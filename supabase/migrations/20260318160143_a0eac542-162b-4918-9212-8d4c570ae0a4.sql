DELETE FROM companies
WHERE id IN (
  SELECT c.id
  FROM companies c
  LEFT JOIN jobs j ON j.company_id = c.id
  WHERE c.detected_ats_platform IS NULL
    AND c.slug IS NULL
    AND c.workspace_id IS NULL
  GROUP BY c.id
  HAVING COUNT(j.id) = 0
);