
-- Create missing profile for to.jmail@gmail.com
INSERT INTO public.profiles (id, display_name)
VALUES ('560e7930-f51f-4618-83eb-f4532c1eee2c', 'to.jmail@gmail.com')
ON CONFLICT (id) DO NOTHING;

-- Add bot friendship for this user
INSERT INTO public.friendships (requester_id, recipient_id, status)
VALUES ('b6e42fc8-7495-4752-a312-f800570a4de3', '560e7930-f51f-4618-83eb-f4532c1eee2c', 'accepted')
ON CONFLICT DO NOTHING;

-- Remove stale non-bot friendship (Jackson Lam <-> to.jmail)
DELETE FROM public.friendships
WHERE id = 'ff0c69d8-bf21-4bf1-98d3-d4a7552779da';
