import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, password, name, userType } = body

    if (!email || !password) {
      return new NextResponse("Missing fields", { status: 400 })
    }

    const exist = await prisma.user.findUnique({
      where: {
        email
      }
    })

    if (exist) {
      return new NextResponse("User already exists", { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        userType
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}