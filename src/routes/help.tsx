import { createFileRoute } from '@tanstack/react-router';
import { InfoPage } from '@/components/nanti/public-pages';
export const Route = createFileRoute('/help')({
 head: () => ({ meta: [{ title: 'Bantuan / NANTI help' }, {name:'description',content:'NANTI membantu mengingat janji, tenggat, dan tindak lanjut dari percakapan yang kamu bagikan. 10 hari gratis, lalu Rp25.000/bulan.'}] }),
 component: () => <InfoPage kind="help" />,
});
