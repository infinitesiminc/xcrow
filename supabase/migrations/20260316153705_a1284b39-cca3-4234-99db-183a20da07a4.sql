
DELETE FROM public.simulation_queue WHERE user_id = '496a33cd-9215-47c3-a782-675b4a6ab91e';
DELETE FROM public.completed_simulations WHERE user_id = '496a33cd-9215-47c3-a782-675b4a6ab91e';
DELETE FROM public.custom_simulations WHERE user_id = '496a33cd-9215-47c3-a782-675b4a6ab91e';
DELETE FROM public.analysis_history WHERE user_id = '496a33cd-9215-47c3-a782-675b4a6ab91e';
DELETE FROM public.bookmarked_roles WHERE user_id = '496a33cd-9215-47c3-a782-675b4a6ab91e';
DELETE FROM public.user_usage WHERE user_id = '496a33cd-9215-47c3-a782-675b4a6ab91e';
DELETE FROM public.workspace_members WHERE user_id = '496a33cd-9215-47c3-a782-675b4a6ab91e';
DELETE FROM public.profiles WHERE id = '496a33cd-9215-47c3-a782-675b4a6ab91e';
DELETE FROM auth.users WHERE id = '496a33cd-9215-47c3-a782-675b4a6ab91e';
