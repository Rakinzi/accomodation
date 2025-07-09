"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, User, Mail, Lock, Eye, EyeOff, UserCheck } from "lucide-react"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [userType, setUserType] = useState("STUDENT")
  const [showStudentFields, setShowStudentFields] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  const handleUserTypeChange = (value) => {
    setUserType(value)
    setShowStudentFields(value === "STUDENT")
  }

  async function onSubmit(e) {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    const formData = new FormData(e.currentTarget)

    try {
      const userData = {
        email: formData.get("email"),
        password: formData.get("password"),
        name: formData.get("name"),
        userType,
        ...(userType === "STUDENT" && {
          gender: formData.get("gender"),
          religion: formData.get("religion")
        })
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message)
        toast.error(data.message || "Registration failed")
        return
      }

      toast.success("Registration successful! Please sign in to continue")

      setTimeout(() => {
        router.push("/auth/login")
      }, 2000)

    } catch (error) {
      setError("Something went wrong")
      toast.error("Failed to create account")
    } finally {
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
            <h1 className="text-4xl font-bold mb-4">Join Our Community</h1>
            <p className="text-xl text-white/90">
              Start your journey with us today
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-lg space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto w-14 h-14 bg-gradient-to-r from-sky-600 to-sky-400 rounded-full flex items-center justify-center mb-4">
              <UserCheck className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900">
              Create your account
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Please fill in the details to get started
            </p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Name and Email Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-zinc-700">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder="Enter your full name"
                    disabled={isLoading}
                    className="pl-10 h-11 bg-zinc-50 border-zinc-200 focus:border-sky-500 focus:ring-sky-500/20 transition-colors"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-zinc-700">
                  Email Address
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
                    className="pl-10 h-11 bg-zinc-50 border-zinc-200 focus:border-sky-500 focus:ring-sky-500/20 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Password and Account Type Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    placeholder="Create a password"
                    disabled={isLoading}
                    className="pl-10 pr-10 h-11 bg-zinc-50 border-zinc-200 focus:border-sky-500 focus:ring-sky-500/20 transition-colors"
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

              {/* Account Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-zinc-700">
                  Account Type
                </Label>
                <Select
                  value={userType}
                  onValueChange={handleUserTypeChange}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-11 bg-zinc-50 border-zinc-200 focus:border-sky-500 focus:ring-sky-500/20 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">Student</SelectItem>
                    <SelectItem value="LANDLORD">Landlord</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Student-specific Fields */}
            {showStudentFields && (
              <div className="space-y-3 p-3 bg-sky-50 rounded-lg border border-sky-200">
                <h3 className="text-sm font-medium text-zinc-700">Student Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Gender */}
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-zinc-700">
                      Gender
                    </Label>
                    <Select
                      name="gender"
                      defaultValue="ANY"
                      disabled={isLoading}
                    >
                      <SelectTrigger className="h-10 bg-white border-zinc-200 focus:border-sky-500 focus:ring-sky-500/20 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Religion */}
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-zinc-700">
                      Religion
                    </Label>
                    <Select
                      name="religion"
                      defaultValue="ANY"
                      disabled={isLoading}
                    >
                      <SelectTrigger className="h-10 bg-white border-zinc-200 focus:border-sky-500 focus:ring-sky-500/20 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CHRISTIAN">Christian</SelectItem>
                        <SelectItem value="MUSLIM">Muslim</SelectItem>
                        <SelectItem value="HINDU">Hindu</SelectItem>
                        <SelectItem value="BUDDHIST">Buddhist</SelectItem>
                        <SelectItem value="JEWISH">Jewish</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 text-center">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
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

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-zinc-600">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-sky-600 hover:text-sky-500 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}