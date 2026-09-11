import { createFileRoute } from '@tanstack/react-router';
import { MemoryCollection } from '@/components/nanti/memory-collection';
export const Route=createFileRoute('/app/reminders')({component:()=> <MemoryCollection view="reminders"/>});
