"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    document.title = "Login | Student Accommodation"
  }, [])

  async function onSubmit(e) {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    const formData = new FormData(e.currentTarget)

    try {
      const res = await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirect: false,
      })

      if (res?.error) {
        setError("Invalid credentials")
        setIsLoading(false)
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      setError("Something went wrong")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Side - Background Image */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative"
        style={{
          backgroundImage: "url('/bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Content over background */}
        <div className="relative z-10 flex items-center justify-center p-12">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">Welcome Back</h1>
            <p className="text-xl text-white/90">
              Continue your journey with us
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-sky-600 to-sky-400 rounded-full flex items-center justify-center mb-6">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-zinc-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Please enter your details to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-zinc-700">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="Enter your email"
                  disabled={isLoading}
                  className="pl-10 h-12 bg-zinc-50 border-zinc-200 focus:border-sky-500 focus:ring-sky-500/20 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-zinc-700">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className="pl-10 pr-10 h-12 bg-zinc-50 border-zinc-200 focus:border-sky-500 focus:ring-sky-500/20 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 text-center">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-zinc-500">Or</span>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-sm text-zinc-600">
              {"Don't have an account? "}
              <Link
                href="/auth/register"
                className="font-medium text-sky-600 hover:text-sky-500 transition-colors"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}