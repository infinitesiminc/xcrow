INSERT INTO public.school_accounts (id, name, domain, total_seats, used_seats, plan_status, contact_email, created_by)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Demo University',
  'demo.edu',
  50,
  0,
  'active',
  'jackson@crowy.ai',
  'bb10735b-051e-4bb5-918e-931a9c79d0fd'
);

INSERT INTO public.school_admins (school_id, user_id, role)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'bb10735b-051e-4bb5-918e-931a9c79d0fd',
  'admin'
);