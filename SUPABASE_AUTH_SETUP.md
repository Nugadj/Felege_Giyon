# Supabase Authentication Setup Guide

## Issues Fixed:
1. **Email Confirmation Bypass**: Added `email_confirm: true` to admin user creation
2. **Profile Creation**: Fixed duplicate profile creation by using database trigger + update pattern

## Required Supabase Settings:

### 1. Authentication Settings
Go to your Supabase Dashboard → Authentication → Settings

**Email Confirmation:**
- ✅ **Enable email confirmations**: Can be ON or OFF (we bypass it for admin-created users)
- ✅ **Confirm email on sign up**: Can be ON or OFF (we bypass it for admin-created users)

**Security:**
- ✅ **Enable phone confirmations**: OFF (unless you need it)
- ✅ **Enable custom SMTP**: Optional (for production)

### 2. Database Trigger (Already Set Up)
The database has a trigger that automatically creates profiles:

```sql
-- This trigger is already in your database
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 3. Environment Variables Required
Make sure your `.env.local` has:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## How It Works Now:

1. **Admin creates user** → API calls `adminClient.auth.admin.createUser()` with `email_confirm: true`
2. **Database trigger fires** → Automatically creates profile record
3. **API updates profile** → Sets correct role and full name
4. **User can login immediately** → No email confirmation required

## Testing:

1. Create a new user via admin panel
2. Try to login with the new user credentials
3. Should work without email confirmation

## Troubleshooting:

If users still can't login:
1. Check Supabase Dashboard → Authentication → Users
2. Verify the user shows "Email Confirmed: Yes"
3. Check the user's metadata contains the correct role
4. Verify the profile record exists in the profiles table