"use client"

import { SessionProvider } from "next-auth/react"
import "./globals.css"  
import { Toaster } from "sonner"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}
          <Toaster position="top-center"/>
        </SessionProvider>
      </body>
    </html>
  )
}