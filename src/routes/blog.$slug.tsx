import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { MarketingLayout } from '@/components/nanti/marketing';
import { FinalCta } from '@/components/nanti/public-pages';
import { useLocale } from '@/lib/locale';
import { launchArticles } from '@/data/launch-articles';
import { articles } from '@/data/articles';
import { fetchArticleBySlug } from '@/lib/nanti-blog';
export const Route=createFileRoute('/blog/$slug')({loader:async({params})=>{const launch=launchArticles.find(a=>a.slug===params.slug);const old=articles.find(a=>a.slug===params.slug);const article=launch||old||await fetchArticleBySlug({data:params.slug});if(!article)throw notFound();return {article};},head:({loaderData})=>{const a=loaderData?.article;if(!a)return{};const c='en'in a?a.id:a;return {meta:[{title:`${c.title} — NANTI Journal`},{name:'description',content:c.excerpt},{property:'og:title',content:c.title},{property:'og:description',content:c.excerpt},{property:'og:type',content:'article'}]};},component:Article});
function Article(){const {article}=Route.useLoaderData();const {locale,t}=useLocale();const c='en'in article?article[locale]:article;return <MarketingLayout><article className="site-width"><div className="n-prose"><Link to="/blog" className="text-link">← {t('All articles','Semua artikel')}</Link><p className="eyebrow">{c.category} · NANTI Journal</p><h1 className="section-heading">{c.title}</h1><p>{c.excerpt}</p>{c.content.split('\n\n').map((block:string,i:number)=>block.startsWith('## ')?<h2 key={i}>{block.slice(3)}</h2>:block.startsWith('- ')?<ul key={i}>{block.split('\n').map((line,j)=><li key={j}>{line.replace(/^- /,'')}</li>)}</ul>:<p key={i}>{block}</p>)}</div></article><FinalCta/></MarketingLayout>}
