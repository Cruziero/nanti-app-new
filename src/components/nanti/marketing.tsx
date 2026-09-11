import { Link, useRouterState } from '@tanstack/react-router';
import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import { useLocale, LanguageSwitch } from '@/lib/locale';
import { Logo } from './logo';
import { SiteFooter } from './footer';
export function MarketingNav() {
 const { t } = useLocale(); const [open,setOpen] = useState(false);
 const path = useRouterState({ select: s => s.location.pathname });
 useEffect(() => setOpen(false), [path]);
 const links: [string,string][] = [['/how-it-works',t('How it works','Cara kerja')],['/business',t('For business','Untuk bisnis')],['/personal',t('For you','Untukmu')],['/pricing',t('Pricing','Harga')],['/blog',t('Journal','Jurnal')]];
 return <header className="marketing-nav"><a href="#main-content" className="skip-link">{t('Skip to content','Langsung ke konten')}</a><div className="site-width nav-inner"><Link to="/" aria-label="NANTI home"><Logo /></Link><nav className="desktop-links" aria-label={t('Main navigation','Navigasi utama')}>{links.map(([to,label]) => <Link key={to} to={to} aria-current={path===to?'page':undefined}>{label}</Link>)}</nav><div className="nav-actions"><LanguageSwitch/><Link className="login-link" to="/auth/login">{t('Log in','Masuk')}</Link><Link className="n-button nav-cta" to="/auth/signup">{t('Try free','Coba gratis')}</Link><button className="mobile-menu" aria-expanded={open} aria-controls="mobile-links" aria-label={t('Menu','Menu')} onClick={() => setOpen(!open)}>{open?<X/>:<Menu/>}</button></div></div>{open&&<nav id="mobile-links" className="mobile-links">{links.map(([to,label])=><Link to={to} key={to}>{label}</Link>)}<Link to="/auth/login">{t('Log in','Masuk')}</Link><Link to="/auth/signup">{t('Start 10 days free','Mulai 10 hari gratis')}</Link></nav>}</header>;
}
export function MarketingLayout({children}:{children:ReactNode}) { return <div className="n-marketing"><MarketingNav/><main id="main-content">{children}</main><SiteFooter/></div>; }
export function useReveal() { return { ref: useRef<HTMLDivElement>(null), visible:true }; }
export function Reveal({children,className}:{children:ReactNode;className?:string;delay?:number}) { return <div className={className}>{children}</div>; }
