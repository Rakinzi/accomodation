import { NextResponse } from "next/server"
import { unlink } from "fs/promises"
import { join } from "path"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { filename } = params
    
    // Security check: ensure filename only contains safe characters
    if (!/^[a-zA-Z0-9-_.]+$/.test(filename)) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 })
    }

    const path = join(process.cwd(), 'public', 'uploads', 'properties', filename)
    
    await unlink(path)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}