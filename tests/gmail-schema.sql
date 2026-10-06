begin;
insert into auth.users(id) values ('ffffffff-0000-4000-8000-000000000001'), ('ffffffff-0000-4000-8000-000000000002');
insert into public.email_workspaces(id, user_id, kind, name) values
  ('ffffffff-0000-4000-8000-000000000011','ffffffff-0000-4000-8000-000000000001','personal','Test personal'),
  ('ffffffff-0000-4000-8000-000000000012','ffffffff-0000-4000-8000-000000000001','business','Test business');
insert into public.email_tasks(user_id, workspace_id, title, email_subject, email_from, email_url, message_id, dedupe_key) values
  ('ffffffff-0000-4000-8000-000000000001','ffffffff-0000-4000-8000-000000000011','Pay bill','Bill','Test','https://mail.google.com','abc','same-email-task'),
  ('ffffffff-0000-4000-8000-000000000001','ffffffff-0000-4000-8000-000000000012','Send invoice','Invoice','Test','https://mail.google.com','abc','same-email-task');
do $$
begin
  begin
    insert into public.gmail_connections(user_id, workspace_id, email, refresh_token_encrypted) values
      ('ffffffff-0000-4000-8000-000000000002','ffffffff-0000-4000-8000-000000000011','bad@example.invalid','test');
    raise exception 'FAIL: connection accepted another owner workspace';
  exception when foreign_key_violation then null;
  end;
  begin
    insert into public.email_tasks(user_id, workspace_id, title, email_subject, email_from, email_url, message_id, dedupe_key) values
      ('ffffffff-0000-4000-8000-000000000001','ffffffff-0000-4000-8000-000000000011','Duplicate','Bill','Test','https://mail.google.com','abc','same-email-task');
    raise exception 'FAIL: duplicate task accepted';
  exception when unique_violation then null;
  end;
  if has_table_privilege('authenticated','public.gmail_connections','select') or
     has_table_privilege('authenticated','public.gmail_oauth_states','select') then
    raise exception 'FAIL: credentials or OAuth states exposed';
  end if;
  if has_table_privilege('authenticated','public.email_tasks','insert') or
     has_table_privilege('authenticated','public.email_tasks','update') then
    raise exception 'FAIL: browser can bypass validated task writes';
  end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','ffffffff-0000-4000-8000-000000000001',true);
do $$ begin
  if (select count(*) from public.email_tasks) <> 2 then raise exception 'FAIL: owner cannot read own tasks'; end if;
  if (select count(*) from public.email_tasks where workspace_id='ffffffff-0000-4000-8000-000000000011') <> 1 then raise exception 'FAIL: workspace filter'; end if;
end $$;
select set_config('request.jwt.claim.sub','ffffffff-0000-4000-8000-000000000002',true);
do $$ begin
  if (select count(*) from public.email_tasks) <> 0 then raise exception 'FAIL: another owner can read tasks'; end if;
  if (select count(*) from public.email_workspaces) <> 0 then raise exception 'FAIL: another owner can read workspaces'; end if;
end $$;
reset role;
rollback;
