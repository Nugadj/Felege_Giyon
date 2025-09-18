-- Check the constraint on the trips.status column
SELECT 
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'trips' 
    AND tc.constraint_type = 'CHECK'
    AND cc.check_clause LIKE '%status%';

-- Also check what values currently exist in the status column
SELECT DISTINCT status, COUNT(*) as count
FROM trips 
GROUP BY status
ORDER BY status;
