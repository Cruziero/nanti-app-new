import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import type { Item, Person, Project, ReminderChannel, ReminderIntensity, ConversationTone, AppLanguage, FocusArea } from './nanti-types';
import { addDays, todayISO } from './nanti-utils';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { loadWorkspace, saveMemories, changeMemory, deleteMemory, savePreferences } from './launch.functions';
export interface Settings {
  name: string;
  briefingTime: string;
  endOfDayTime: string;
  notifications: Record<string, boolean>;
  onboarded: boolean;
  role?: string;
  volume?: string;
  // New preference fields
  language: AppLanguage;
  tone: ConversationTone;
  focusArea: FocusArea;
  preferredName: string;
  emojiPreference: boolean;
  verbosity: "concise" | "normal" | "detailed";
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  reminderChannels: ReminderChannel[];
  reminderIntensity: ReminderIntensity;
  // Integration status
  whatsappConnected: boolean;
  calendarConnected: boolean;
}


const defaultSettings: Settings = { name:'', preferredName:'', briefingTime:'08:00', endOfDayTime:'17:30', notifications:{}, onboarded:false, language:'indonesian', tone:'professional', focusArea:'everything', emojiPreference:false, verbosity:'normal', quietHoursEnabled:false, quietHoursStart:'22:00', quietHoursEnd:'07:00', reminderChannels:['in_app'], reminderIntensity:'normal', whatsappConnected:false, calendarConnected:false };
interface State {items:Item[];people:Person[];projects:Project[];settings:Settings}
const emptyState:State={items:[],people:[],projects:[],settings:defaultSettings};
interface Ctx extends State {
 hydrated:boolean; error:string; busy:boolean; reload:()=>void;
 update:(id:string,patch:Partial<Item>)=>Promise<void>; addItems:(items:Item[],conversationText?:string)=>Promise<void>;
 complete:(id:string)=>Promise<void>; snooze:(id:string,days:number)=>Promise<void>;track:(id:string)=>Promise<void>;ignore:(id:string)=>Promise<void>;remove:(id:string)=>Promise<void>;
 setSettings:(patch:Partial<Settings>)=>Promise<void>; reset:()=>void;
 personOf:(id?:string)=>Person|undefined; projectOf:(id?:string)=>Project|undefined;
 toggleReminder:(id:string)=>Promise<void>;setReminderIntensity:(id:string,intensity:ReminderIntensity)=>Promise<void>;setReminderChannels:(id:string,channels:ReminderChannel[])=>Promise<void>;
}
const StoreContext=createContext<Ctx|null>(null);
export function NantiProvider({children}:{children:ReactNode}) {
 const [state,setState]=useState<State>(emptyState);const stateRef=useRef(state);stateRef.current=state;
 const [hydrated,setHydrated]=useState(false),[error,setError]=useState(''),[pending,setPending]=useState(0),[revision,setRevision]=useState(0);
 const {user,loading}=useSupabaseAuth();const activeUser=useRef(user?.id);activeUser.current=user?.id;
 useEffect(()=>{if(loading)return;let cancelled=false;setState(emptyState);setError('');setHydrated(false);
 if(!user){setHydrated(true);return;}
 loadWorkspace().then(data=>{if(!cancelled)setState({items:data.items,people:data.people,projects:data.projects,settings:{...defaultSettings,...data.settings,whatsappConnected:false,calendarConnected:false}});}).catch(()=>{if(!cancelled)setError('Your memories could not be loaded. Please retry. / Memori belum dapat dimuat. Silakan coba lagi.');}).finally(()=>{if(!cancelled)setHydrated(true);});
 return()=>{cancelled=true;};},[user?.id,loading,revision]);
 async function run(work:(uid:string)=>Promise<void>,rethrow=false){const uid=user?.id;if(!uid||error){const e=new Error(error||'Please sign in. / Silakan masuk.');toast.error(e.message);if(rethrow)throw e;return;}setPending(n=>n+1);try{await work(uid);}catch(e){toast.error(e instanceof Error?e.message:'Not saved. / Belum tersimpan.');if(rethrow)throw e;}finally{setPending(n=>n-1);}}
 const update=async(id:string,patch:Partial<Item>)=>run(async uid=>{const current=stateRef.current.items.find(i=>i.id===id);if(!current)throw new Error('Memory not found.');const item={...current,...patch};if(item.reminderEnabled&&!item.due)throw new Error('Choose a date before enabling a reminder. / Pilih tanggal pengingat terlebih dahulu.');item.reminderEnabled=!!item.reminderEnabled;item.reminderChannels=item.reminderEnabled?['in_app']:[];const saved=await changeMemory({data:{item}});if(activeUser.current===uid)setState(s=>({...s,items:s.items.map(i=>i.id===id?saved:i)}));});
 const reload=()=>setRevision(n=>n+1);
 return <StoreContext.Provider value={{...state,hydrated,error,busy:pending>0,reload,reset:reload,update,
 addItems:async(items)=>run(async uid=>{const saved=await saveMemories({data:{items}});if(activeUser.current===uid)setState(s=>({...s,items:[...saved,...s.items.filter(i=>!saved.some(n=>n.id===i.id))]}));},true),
 complete:id=>update(id,{status:stateRef.current.items.find(i=>i.id===id)?.kind==='waiting'?'received':'done'}),
 snooze:(id,days)=>update(id,{due:addDays(todayISO(),days),reminderEnabled:true}),track:id=>update(id,{status:'open'}),ignore:id=>update(id,{status:'ignored'}),
 remove:async id=>run(async uid=>{await deleteMemory({data:{id}});if(activeUser.current===uid)setState(s=>({...s,items:s.items.filter(i=>i.id!==id)}));}),
 setSettings:async patch=>run(async uid=>{const settings={...stateRef.current.settings,...patch,whatsappConnected:false,calendarConnected:false};await savePreferences({data:{preferences:settings}});if(activeUser.current===uid)setState(s=>({...s,settings}));},true),
 personOf:id=>state.people.find(p=>p.id===id),projectOf:id=>state.projects.find(p=>p.id===id),
 toggleReminder:id=>update(id,{reminderEnabled:!stateRef.current.items.find(i=>i.id===id)?.reminderEnabled}),setReminderIntensity:(id,reminderIntensity)=>update(id,{reminderIntensity}),setReminderChannels:(id,channels)=>update(id,{reminderChannels:channels.filter(c=>c==='in_app')})
 }}>{children}</StoreContext.Provider>;
}
export function useNanti(){const ctx=useContext(StoreContext);if(!ctx)throw new Error('useNanti must be used inside NantiProvider');return ctx;}
