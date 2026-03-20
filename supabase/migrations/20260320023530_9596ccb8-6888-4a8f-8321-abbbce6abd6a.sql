-- Deduplicate school_courses: keep the row with the most skills_extracted per group
-- First, delete child course_items pointing to duplicate courses we'll remove
DELETE FROM school_course_items
WHERE course_id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY school_id, program_name, COALESCE(degree_type, ''), COALESCE(department, '')
        ORDER BY
          COALESCE(jsonb_array_length(skills_extracted), 0) DESC,
          created_at ASC
      ) AS rn
    FROM school_courses
  ) ranked
  WHERE rn > 1
);

-- Then delete the duplicate courses themselves
DELETE FROM school_courses
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY school_id, program_name, COALESCE(degree_type, ''), COALESCE(department, '')
        ORDER BY
          COALESCE(jsonb_array_length(skills_extracted), 0) DESC,
          created_at ASC
      ) AS rn
    FROM school_courses
  ) ranked
  WHERE rn > 1
);

-- Add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_school_courses_dedup
ON school_courses (school_id, program_name, COALESCE(degree_type, ''), COALESCE(department, ''))