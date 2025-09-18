-- Create settings table for system configuration
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for settings (admin only)
CREATE POLICY "settings_select_admin" ON public.settings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "settings_insert_admin" ON public.settings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "settings_update_admin" ON public.settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "settings_delete_admin" ON public.settings FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Insert default settings
INSERT INTO public.settings (key, value, category, description) VALUES
  ('company_name', '"ፈለገ ግዮን ባስ ትራንስፖርት"', 'general', 'Company name'),
  ('company_email', '""', 'general', 'Company email address'),
  ('company_phone', '""', 'general', 'Company phone number'),
  ('company_address', '""', 'general', 'Company address'),
  ('default_currency', '"ETB"', 'general', 'Default currency'),
  ('booking_deadline_hours', '2', 'booking', 'Hours before departure to stop bookings'),
  ('allow_overbooking', 'false', 'booking', 'Allow booking more seats than capacity'),
  ('require_payment', 'true', 'booking', 'Require payment on booking'),
  ('send_confirmation_sms', 'true', 'booking', 'Send SMS confirmation'),
  ('email_notifications', 'true', 'notifications', 'Enable email notifications'),
  ('sms_notifications', 'true', 'notifications', 'Enable SMS notifications'),
  ('admin_alerts', 'true', 'notifications', 'Enable admin alerts'),
  ('admin_alert_email', '""', 'notifications', 'Admin alert email'),
  ('two_factor_auth', 'false', 'security', 'Require 2FA for admin accounts'),
  ('session_timeout', 'true', 'security', 'Enable session timeout'),
  ('session_duration_hours', '8', 'security', 'Session duration in hours'),
  ('password_expiry_days', '90', 'security', 'Password expiry in days'),
  ('automatic_backups', 'true', 'database', 'Enable automatic backups'),
  ('backup_frequency', '"daily"', 'database', 'Backup frequency'),
  ('retention_period_days', '30', 'database', 'Backup retention period in days')
ON CONFLICT (key) DO NOTHING;