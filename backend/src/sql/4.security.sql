alter table public.security_roles
  add groups text [] default array []::text [] not null;
