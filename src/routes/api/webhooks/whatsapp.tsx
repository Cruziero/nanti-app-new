import { createFileRoute } from '@tanstack/react-router';
const unavailable=()=>new Response('Not available',{status:404});
export const Route=createFileRoute('/api/webhooks/whatsapp')({server:{handlers:{GET:unavailable,POST:unavailable}}});
