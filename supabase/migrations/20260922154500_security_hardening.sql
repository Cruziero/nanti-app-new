-- Harden trigger helper search path flagged by Supabase security advisor.
alter function public.update_updated_at_column() set search_path = '';