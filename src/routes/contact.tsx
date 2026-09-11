import { createFileRoute } from '@tanstack/react-router';
import { ContactPage } from '@/components/nanti/public-pages';
export const Route = createFileRoute('/contact')({
 head: () => ({ meta: [{ title: 'Hubungi / Contact NANTI' }, {name:'description',content:'NANTI membantu mengingat janji, tenggat, dan tindak lanjut dari percakapan yang kamu bagikan. 10 hari gratis, lalu Rp25.000/bulan.'}] }),
 validateSearch: (search: Record<string, unknown>)  : {topic?:string} => ({topic: typeof search['topic'] === 'string' ? search['topic'] : ''}),
 component: ContactPage,
});
