"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Starting admin login process")
      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      console.log("[v0] Response status:", response.status)

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error("[v0] JSON parse error:", parseError)
        throw new Error("Server returned invalid response")
      }

      console.log("[v0] Response data:", data)

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Login failed")
      }

      console.log("[v0] Login successful, storing session")
      // Store admin session
      localStorage.setItem(
        "admin_session",
        JSON.stringify({
          user: data.user,
          loginTime: new Date().toISOString(),
        }),
      )

      console.log("[v0] Redirecting to admin dashboard")
      router.push("/admin")
    } catch (error: unknown) {
      console.error("[v0] Login error:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-red-50 to-orange-100">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">ፈለገ ግዮን ባስ ትራንስፖርት</h1>
            <p className="text-sm text-gray-600">Felege Giyon Bus Transport</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Admin Login</CardTitle>
              <CardDescription>Enter admin credentials to access system controls</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Admin Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="felegegiyon@outlook.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="felege@123"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Admin Sign In"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
