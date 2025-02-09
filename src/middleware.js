import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
    const isRootPage = req.nextUrl.pathname === '/'
    const isStudent = token?.userType === 'STUDENT'
    const isLandlord = token?.userType === 'LANDLORD'

    // If not authenticated and trying to access protected routes
    if (!isAuth && !isAuthPage) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    // Handle root route redirection
    if (isRootPage) {
      if (isAuth) {
        return NextResponse.redirect(
          new URL(
            isStudent ? '/student-dashboard' : '/dashboard',
            req.url
          )
        )
      }
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    // Redirect authenticated users away from auth pages
    if (isAuthPage && isAuth) {
      return NextResponse.redirect(
        new URL(
          isStudent ? '/student-dashboard' : '/dashboard',
          req.url
        )
      )
    }

    // Handle dashboard access based on user type
    if (isAuth) {
      if (req.nextUrl.pathname.startsWith('/student-dashboard') && !isStudent) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }

      if (req.nextUrl.pathname.startsWith('/dashboard') && !isLandlord) {
        return NextResponse.redirect(new URL('/student-dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => true
    },
  }
)

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/student-dashboard/:path*',
    '/auth/:path*'
  ]
}