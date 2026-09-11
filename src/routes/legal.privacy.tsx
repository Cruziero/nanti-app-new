import { createFileRoute } from '@tanstack/react-router';
import { LegalPage } from '@/components/nanti/legal-pages';
export const Route=createFileRoute('/legal/privacy')({head:()=>({meta:[{title:'Privacy · NANTI'}]}),component:()=> <LegalPage type="privacy"/>});
