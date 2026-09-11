import { createFileRoute } from '@tanstack/react-router';
const unavailable=()=>new Response('Not available',{status:404});
export const Route=createFileRoute('/api/debug/server-info')({server:{handlers:{GET:unavailable,POST:unavailable}}});
