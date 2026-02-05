import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const status = token?.status;
    const role = token?.role;
    const { pathname } = req.nextUrl;

    // Allow access to pending page if status is PENDING
    if (status === "PENDING" && pathname !== "/pending") {
      return NextResponse.redirect(new URL("/pending", req.url));
    }

    // Redirect from pending if status is APPROVED
    if (status === "APPROVED" && pathname === "/pending") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Admin check
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/mya-chat/:path*",
    "/pending",
  ],
};
