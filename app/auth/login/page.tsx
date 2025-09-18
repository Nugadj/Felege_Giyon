"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <div className="text-white font-bold text-xl">ፈ</div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ፈለገ ግዮን ባስ ትራንስፖርት</h1>
          <p className="text-sm text-gray-600">Felege Giyon Bus Transport System</p>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-blue-200">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-blue-900">Welcome Back</CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Sign in to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@felegegiyon.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-white/80 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-white/80 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium" 
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <div className="text-sm text-gray-600">
                Need an account?{" "}
                <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-medium">
                  Contact Administrator
                </Link>
              </div>
              <div className="text-xs text-gray-500">
                Secure access to ፈለገ ግዮን ባስ ትራንስፖርት system
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
