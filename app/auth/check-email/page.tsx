import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <div className="text-white font-bold text-xl">✉</div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ፈለገ ግዮን ባስ ትራንስፖርት</h1>
          <p className="text-sm text-gray-600">Email Verification Required</p>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-orange-200">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-orange-900">Check Your Email</CardTitle>
            <CardDescription className="text-sm text-gray-600">
              We've sent you a confirmation link
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800 leading-relaxed">
                Please check your email inbox and click the confirmation link to activate your account. 
                The link will expire in 24 hours.
              </p>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Didn't receive the email? Check your spam folder or contact your administrator.
              </div>
              
              <Link 
                href="/auth/login" 
                className="inline-block w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Back to Login
              </Link>
            </div>

            <div className="text-xs text-gray-500">
              Secure email verification for ፈለገ ግዮን ባስ ትራንስፖርት
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
