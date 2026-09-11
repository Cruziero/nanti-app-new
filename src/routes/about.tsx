import { createFileRoute } from '@tanstack/react-router';
import { InfoPage } from '@/components/nanti/public-pages';
export const Route = createFileRoute('/about')({
 head: () => ({ meta: [{ title: 'Tentang / About NANTI Corp' }, {name:'description',content:'NANTI membantu mengingat janji, tenggat, dan tindak lanjut dari percakapan yang kamu bagikan. 10 hari gratis, lalu Rp25.000/bulan.'}] }),
 component: () => <InfoPage kind="about" />,
});
