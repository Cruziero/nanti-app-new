import { createFileRoute } from '@tanstack/react-router';
import { InfoPage } from '@/components/nanti/public-pages';
export const Route = createFileRoute('/personal')({
 head: () => ({ meta: [{ title: 'NANTI untukmu / For you' }, {name:'description',content:'NANTI membantu mengingat janji, tenggat, dan tindak lanjut dari percakapan yang kamu bagikan. 10 hari gratis, lalu Rp25.000/bulan.'}] }),
 component: () => <InfoPage kind="personal" />,
});
