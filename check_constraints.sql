SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint 
WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = 'User')
AND conname LIKE '%email%';
