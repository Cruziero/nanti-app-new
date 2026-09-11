import { createFileRoute } from '@tanstack/react-router';
import { HomePage } from '@/components/nanti/public-pages';
export const Route = createFileRoute('/')({
 head: () => ({ meta: [{ title: 'NANTI — You talk. NANTI remembers.' }, {name:'description',content:'NANTI membantu mengingat janji, tenggat, dan tindak lanjut dari percakapan yang kamu bagikan. 10 hari gratis, lalu Rp25.000/bulan.'}] }),
 component: HomePage,
});
