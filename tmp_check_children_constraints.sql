SELECT conname, pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
WHERE c.conrelid = 'Children'::regclass
  AND c.contype = 'u';
