"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Save, Database, Bell, Shield, Globe, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface SettingsFormClientProps {
  initialSettings: Record<string, any>
  userEmail: string
}

export function SettingsFormClient({ initialSettings, userEmail }: SettingsFormClientProps) {
  const [settings, setSettings] = useState(initialSettings)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSaveSettings = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save settings")
      }

      setSuccess("Settings saved successfully!")
      toast.success("Settings saved successfully!")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save settings"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            General Settings
          </CardTitle>
          <CardDescription>Basic system configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={settings.company_name || ""}
                onChange={(e) => updateSetting("company_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-email">Company Email</Label>
              <Input
                id="company-email"
                type="email"
                value={settings.company_email || userEmail}
                onChange={(e) => updateSetting("company_email", e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company-phone">Company Phone</Label>
              <Input
                id="company-phone"
                value={settings.company_phone || ""}
                onChange={(e) => updateSetting("company_phone", e.target.value)}
                placeholder="Enter company phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default-currency">Default Currency</Label>
              <Input
                id="default-currency"
                value={settings.default_currency || "ETB"}
                onChange={(e) => updateSetting("default_currency", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-address">Company Address</Label>
            <Input
              id="company-address"
              value={settings.company_address || ""}
              onChange={(e) => updateSetting("company_address", e.target.value)}
              placeholder="Enter company address"
            />
          </div>
        </CardContent>
      </Card>

      {/* Booking Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Booking Settings
          </CardTitle>
          <CardDescription>Configure booking and reservation policies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Booking deadline removed for this deployment - no deadline policy at this station */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Overbooking</Label>
              <p className="text-sm text-muted-foreground">Allow booking more seats than bus capacity</p>
            </div>
            <Switch
              checked={settings.allow_overbooking || false}
              onCheckedChange={(checked) => updateSetting("allow_overbooking", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Payment on Booking</Label>
              <p className="text-sm text-muted-foreground">Require immediate payment when booking</p>
            </div>
            <Switch
              checked={settings.require_payment !== false}
              onCheckedChange={(checked) => updateSetting("require_payment", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Send Confirmation SMS</Label>
              <p className="text-sm text-muted-foreground">Send SMS confirmation for bookings</p>
            </div>
            <Switch
              checked={settings.send_confirmation_sms !== false}
              onCheckedChange={(checked) => updateSetting("send_confirmation_sms", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>Configure system notifications and alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Send email notifications for bookings and updates</p>
            </div>
            <Switch
              checked={settings.email_notifications !== false}
              onCheckedChange={(checked) => updateSetting("email_notifications", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">Send SMS notifications for important updates</p>
            </div>
            <Switch
              checked={settings.sms_notifications !== false}
              onCheckedChange={(checked) => updateSetting("sms_notifications", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Admin Alerts</Label>
              <p className="text-sm text-muted-foreground">Receive alerts for system events and issues</p>
            </div>
            <Switch
              checked={settings.admin_alerts !== false}
              onCheckedChange={(checked) => updateSetting("admin_alerts", checked)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-email">Admin Alert Email</Label>
            <Input
              id="admin-email"
              type="email"
              value={settings.admin_alert_email || userEmail}
              onChange={(e) => updateSetting("admin_alert_email", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Settings
          </CardTitle>
          <CardDescription>Configure security and access controls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
            </div>
            <Switch
              checked={settings.two_factor_auth || false}
              onCheckedChange={(checked) => updateSetting("two_factor_auth", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Session Timeout</Label>
              <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
            </div>
            <Switch
              checked={settings.session_timeout !== false}
              onCheckedChange={(checked) => updateSetting("session_timeout", checked)}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="session-duration">Session Duration (hours)</Label>
              <Input
                id="session-duration"
                type="number"
                value={settings.session_duration_hours || 8}
                onChange={(e) => updateSetting("session_duration_hours", parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-expiry">Password Expiry (days)</Label>
              <Input
                id="password-expiry"
                type="number"
                value={settings.password_expiry_days || 90}
                onChange={(e) => updateSetting("password_expiry_days", parseInt(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database & Backup
          </CardTitle>
          <CardDescription>Database maintenance and backup settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Automatic Backups</Label>
              <p className="text-sm text-muted-foreground">Enable automatic database backups</p>
            </div>
            <Switch
              checked={settings.automatic_backups !== false}
              onCheckedChange={(checked) => updateSetting("automatic_backups", checked)}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="backup-frequency">Backup Frequency</Label>
              <Select
                value={settings.backup_frequency || "daily"}
                onValueChange={(value) => updateSetting("backup_frequency", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="retention-period">Retention Period (days)</Label>
              <Input
                id="retention-period"
                type="number"
                value={settings.retention_period_days || 30}
                onChange={(e) => updateSetting("retention_period_days", parseInt(e.target.value))}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <Button variant="outline">
              <Database className="w-4 h-4 mr-2" />
              Create Backup Now
            </Button>
            <Button variant="outline">
              <Database className="w-4 h-4 mr-2" />
              View Backup History
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button size="lg" onClick={handleSaveSettings} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save All Settings
            </>
          )}
        </Button>
      </div>
    </div>
  )
}