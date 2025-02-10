"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  const [userType, setUserType] = useState("STUDENT")
  const [showStudentFields, setShowStudentFields] = useState(true)

  const handleUserTypeChange = (value) => {
    setUserType(value)
    setShowStudentFields(value === "STUDENT")
  }

  async function onSubmit(e) {
    e.preventDefault()
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

      if (!res.ok) {
        const data = await res.json()
        setError(data.message)
        return
      }

      router.push("/auth/login")
    } catch (error) {
      setError("Something went wrong")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <div className="w-full max-w-2xl space-y-8 rounded-2xl bg-white p-8 shadow-lg dark:bg-zinc-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create an account</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Sign up to get started
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Basic Fields in Grid Layout */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="Enter your name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="Enter your email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Create a password"
              />
            </div>

            <div className="space-y-2">
              <Label>Account Type</Label>
              <Select value={userType} onValueChange={handleUserTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="LANDLORD">Landlord</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Student-specific fields */}
            {showStudentFields && (
              <>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select name="gender" defaultValue="ANY">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Religion</Label>
                  <Select name="religion" defaultValue="ANY">
                    <SelectTrigger>
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
              </>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <Button type="submit" className="w-full">
            Sign up
          </Button>
        </form>

        <div className="text-center text-sm">
          <p className="text-zinc-600 dark:text-zinc-400">
            Already have an account?{" "}
            <Link 
              href="/auth/login"
              className="font-medium text-sky-600 hover:text-sky-500"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}