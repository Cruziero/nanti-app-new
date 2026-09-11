import { createFileRoute } from '@tanstack/react-router';
import { AuthForm } from '@/components/nanti/auth-form';
export const Route=createFileRoute('/auth/reset-password')({component:()=> <AuthForm mode="reset"/>});
