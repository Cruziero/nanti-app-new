import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { daySchema } from './memory-schema';
const contextSchema={source:z.string().max(120).optional(),conversationDate:daySchema.optional(),timezone:z.enum(['Asia/Jakarta','Asia/Makassar','Asia/Jayapura']).optional(),me:z.string().max(100).optional(),language:z.enum(['id','en']).optional()};
async function access(id:string){const {requireAccess,limit}=await import('./launch.server');await requireAccess(id);await limit(`ai:${id}`,30,3600);await limit(`ai-day:${id}`,100,86400);}
export const analyzeConversation=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((data:unknown)=>z.object({text:z.string().trim().min(1).max(20000),...contextSchema}).parse(data)).handler(async({data,context})=>{await access(context.userId);const {extractItems}=await import('./nanti-ai.server');return extractItems(data.text,data.source,data);});
export const analyzeScreenshot=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((data:unknown)=>z.object({image:z.string().min(32).max(7_000_000).regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/),...contextSchema}).parse(data)).handler(async({data,context})=>{await access(context.userId);const {extractFromImage}=await import('./nanti-ai.server');return extractFromImage(data.image,data.source,data);});
export const askAssistant=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((data:unknown)=>z.object({question:z.string().trim().min(1).max(2000),language:z.enum(['id','en']).default('id'),context:z.string().max(20000).optional()}).parse(data)).handler(async({data,context})=>{
 await access(context.userId);const {adminDb}=await import('./launch.server');const db=adminDb();
 const results=await Promise.all(['tasks','waiting_items','inbox_items'].map(table=>db.from(table).select('*').eq('user_id',context.userId).order('created_at',{ascending:false}).limit(300)));
 if(results.some(r=>r.error))throw new Error('Memories could not be loaded. Please retry.');
 const memories=results.flatMap((r,index)=>(r.data||[]).map(row=>({id:row.id,title:row.title,kind:row.memory_snapshot?.kind||(index===1?'waiting':row.type),status:row.memory_snapshot?.status||row.status,person:row.memory_snapshot?.personName||row.person_name,due:row.memory_snapshot?.due||row.due_date,source:row.memory_snapshot?.source||row.source||'',quote:row.memory_snapshot?.quote||row.quote||row.conversation_text||''})));
 if(!memories.length)return {answer:data.language==='en'?'Your memory is empty. Add a conversation first, then ask me about it.':'Memorimu masih kosong. Tambahkan percakapan dulu, lalu tanyakan kembali.',sources:[]};
 const {askNanti}=await import('./nanti-ai.server');
 // Bound context and make its limits explicit; never accept caller-supplied private memory.
 let size=0;const selected=memories.filter(m=>{size+=JSON.stringify(m).length;return size<100000;});const result=await askNanti(data.question,JSON.stringify({scope:'Recent saved memories only; may not include entire history',memories:selected}),data.language);
 if(result.sourceIds.some(id=>!selected.some(m=>m.id===id)))throw new Error('The AI answer could not be linked to your memories. Please retry.');
 return {answer:result.answer,sources:result.sourceIds.map(id=>selected.find(m=>m.id===id)!)};
});
export const parseSmartDateServer=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((data:unknown)=>z.object({text:z.string().min(1).max(500)}).parse(data)).handler(async({data})=>{const {parseSmartDate}=await import('./nanti-dates');return parseSmartDate(data.text);});
export const generateFollowUpMessageServer=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((data:unknown)=>z.object({personName:z.string().max(200),what:z.string().max(1000),tone:z.enum(['formal','professional','casual','friendly','warm','direct'])}).parse(data)).handler(async({data})=>{const {generateFollowUpMessage}=await import('./nanti-followup');return {message:generateFollowUpMessage({itemId:'',type:'waiting_no_response',title:data.what,personName:data.personName,daysSince:0,suggestedAction:''},data.tone)};});
