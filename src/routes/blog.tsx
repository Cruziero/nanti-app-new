import { createFileRoute, Link } from '@tanstack/react-router';
import { MarketingLayout } from '@/components/nanti/marketing';
import { JournalCards } from '@/components/nanti/public-pages';
import { useLocale } from '@/lib/locale';
import { articles } from '@/data/articles';
export const Route=createFileRoute('/blog')({head:()=>({meta:[{title:'Jurnal / Journal — NANTI'},{name:'description',content:'Practical reads on conversations, memory, and following through. Artikel tentang percakapan dan memori.'}]}),component:Journal});
function Journal(){const {t}=useLocale();return <MarketingLayout><div className="site-width"><header className="page-intro"><span className="eyebrow">{t('The NANTI journal','Jurnal NANTI')}</span><h1 className="n-display">{t('A little food\nfor thought.','Sedikit ruang\nuntuk berpikir.')}</h1><p className="hero-copy">{t('Practical ideas for remembering what matters and following through.','Ide praktis untuk mengingat yang penting dan menuntaskannya.')}</p></header><section style={{paddingBottom:70}}><JournalCards/></section><details style={{marginBottom:50}}><summary>{t('Earlier articles','Artikel sebelumnya')}</summary><ul>{articles.map(a=><li key={a.slug}><Link to="/blog/$slug" params={{slug:a.slug}}>{a.title}</Link></li>)}</ul></details></div></MarketingLayout>}
