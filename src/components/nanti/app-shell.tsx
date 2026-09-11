import { type ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { Sun, Sparkles, Plus, Bell, Settings, LogOut, Hourglass, BookOpen } from 'lucide-react';
import { Logo } from './logo';
import { useNanti } from '@/lib/nanti-store';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { useLocale, LanguageSwitch } from '@/lib/locale';
import { cn } from '@/lib/utils';
export function AppShell({children}:{children:ReactNode}){
 const {t}=useLocale();const {error,reload,busy}=useNanti();const {user,signOut}=useSupabaseAuth();const path=useRouterState({select:s=>s.location.pathname});
 const nav=[{to:'/app/today',label:t('Today','Hari Ini'),icon:Sun},{to:'/app',label:t('Ask NANTI','Tanya NANTI'),icon:Sparkles},{to:'/app/inbox',label:t('All memories','Semua memori'),icon:BookOpen},{to:'/app/waiting',label:t('Waiting','Menunggu'),icon:Hourglass},{to:'/app/reminders',label:t('Reminders','Pengingat'),icon:Bell},{to:'/app/settings',label:t('Settings','Pengaturan'),icon:Settings}] as const;
 return <div className="min-h-screen bg-background"><aside className="fixed inset-y-0 left-0 hidden w-[232px] flex-col border-r bg-[#fafbf9] lg:flex"><div className="px-6 py-8"><Logo/></div><div className="px-4"><Link to="/app/import" className="n-button w-full"><Plus size={18}/>{t('Add a memory','Tambah memori')}</Link></div><nav aria-label={t('Workspace','Ruang kerja')} className="mt-7 flex-1 space-y-1 px-4">{nav.map(n=><Link key={n.to} to={n.to} aria-current={path.replace(/\/$/,'')===n.to?'page':undefined} className={cn('flex items-center gap-3 rounded-xl px-3 py-3 text-sm',path.replace(/\/$/,'')===n.to?'bg-[#e9f0e9] font-semibold text-primary':'text-muted-foreground hover:bg-secondary')}><n.icon size={18}/>{n.label}</Link>)}</nav><div className="space-y-4 border-t p-5"><LanguageSwitch/><p className="truncate text-xs text-muted-foreground">{user?.email}</p><button onClick={()=>void signOut()} className="flex items-center gap-2 text-sm"><LogOut size={16}/>{t('Sign out','Keluar')}</button><Link to="/" className="block text-xs text-muted-foreground">{t('NANTI website','Website NANTI')} ↗</Link></div></aside>
 <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-white/95 px-5 py-4 lg:hidden"><Logo/><LanguageSwitch/></header>
 <main id="main-content" className="pb-28 lg:pb-12 lg:pl-[232px]"><div className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12">{error?<div role="alert" className="app-panel"><p>{error}</p><button className="n-button mt-4" onClick={reload}>{t('Retry','Coba lagi')}</button></div>:children}{busy&&<p role="status" className="fixed right-5 top-4 rounded-full border bg-white px-4 py-2 text-sm shadow-sm">{t('Saving…','Menyimpan…')}</p>}</div></main>
 <nav aria-label={t('Mobile navigation','Navigasi seluler')} className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">{[nav[0],nav[1],{to:'/app/import',label:t('Add','Tambah'),icon:Plus},nav[2],nav[5]].map(n=><Link key={n.to} to={n.to} className={cn('flex min-h-16 flex-1 flex-col items-center justify-center gap-1 px-1 text-[11px]',path.replace(/\/$/,'')===n.to?'text-primary font-semibold':'text-muted-foreground')}><n.icon size={20}/>{n.label}</Link>)}</nav></div>;
}
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string | undefined;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-[24px] font-semibold tracking-tight sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Section({
  title,
  count,
  children,
}: {
  title?: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="mb-1.5 flex items-center gap-2 px-1">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
          {title}
        </h2>
        {count !== undefined && (
          <span className="text-[11px] text-muted-foreground/50">{count}</span>
        )}
      </div>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="px-1 py-12 text-center">
      <p className="text-[14px] font-medium text-foreground">{title}</p>
      {hint && <p className="mt-1 text-[13px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
