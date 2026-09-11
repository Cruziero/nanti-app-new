import { createFileRoute } from '@tanstack/react-router';
import { LegalPage } from '@/components/nanti/legal-pages';
export const Route=createFileRoute('/legal/terms')({head:()=>({meta:[{title:'Terms · NANTI'}]}),component:()=> <LegalPage type="terms"/>});
