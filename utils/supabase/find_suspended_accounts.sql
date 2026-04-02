UPDATE public.profiles
SET status = 'suspended'
WHERE status IN ('active', 'pending')
  AND role = 'student'
  AND (
    (last_active IS NOT NULL AND last_active < now() - interval '12 months')
    OR (last_active IS NULL AND created_at < now() - interval '12 months')
  );