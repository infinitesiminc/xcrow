-- Delete the IPEDS-imported USC duplicate first
DELETE FROM public.school_accounts
WHERE id = 'f666ebba-aadf-4ad7-b56a-f3f53f757a6a';

-- Now merge IPEDS metadata into the manually-created USC record
UPDATE public.school_accounts
SET ipeds_id = '123961',
    state = 'CA',
    city = 'Los Angeles',
    enrollment = 30000,
    carnegie_class = 'R1',
    institution_type = 'R1'
WHERE id = 'a0000000-0000-0000-0000-000000000001';