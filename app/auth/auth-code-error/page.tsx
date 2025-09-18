import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AuthCodeError() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">ፈለገ ግዮን ባስ ትራንስፖርት</h1>
            <p className="text-sm text-gray-600">Felege Giyon Bus Transport</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-red-600">Authentication Error</CardTitle>
              <CardDescription>There was an error confirming your email address.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <p className="text-sm text-gray-600">
                  The email confirmation link may have expired or been used already. Please try signing up again or
                  contact support if the problem persists.
                </p>
                <div className="flex flex-col gap-2">
                  <Button asChild>
                    <Link href="/auth/register">Try Again</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/auth/login">Sign In Instead</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
