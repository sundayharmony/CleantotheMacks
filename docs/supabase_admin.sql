-- Grant admin role to the primary admin user
-- Replace email if needed
update public.profiles
set role = 'admin'
where email = 'stisby3@gmail.com';
