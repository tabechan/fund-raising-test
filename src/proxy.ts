import { withAuth } from "next-auth/middleware";

export default withAuth(
    // Default behavior is to redirect unauthenticated users to the sign-in page
    function middleware(req) {
        // Custom logic if needed
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: "/login",
        },
    }
);

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (auth API routes)
         * - login (login page)
         * - register (registration page)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api/auth|login|register|_next/static|_next/image|favicon.ico).*)",
    ],
};
