import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const status = token?.status;
    const role = token?.role;
    const { pathname } = req.nextUrl;

    if (role === "ADMIN" && pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    if (role !== "ADMIN" && pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Restrict non-approved accounts from app surfaces
    if (role !== "ADMIN") {
      if (status === "APPROVED" && pathname === "/pending") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      const isRestrictedStatus = status === "PENDING" || status === "REJECTED" || status === "DISABLED";
      if (isRestrictedStatus && pathname !== "/pending") {
        return NextResponse.redirect(new URL("/pending", req.url));
      }
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
  matcher: ["/dashboard/:path*", "/admin/:path*", "/mya-chat/:path*", "/pending"],
};
