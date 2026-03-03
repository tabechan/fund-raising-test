import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                // 1. Check for Demo Account (Hardcoded for convenience)
                if (credentials.email === "demo@example.com" && credentials.password === "demo_password_1234") {
                    return { id: "1", email: "demo@example.com", name: "Demo User" };
                }

                // 2. Check Database
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                if (user && user.password && await bcrypt.compare(credentials.password, user.password)) {
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                    };
                }

                return null;
            }
        })
    ],
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async signIn({ user, account, profile }: { user: any; account: any; profile?: any }) {
            if (account.provider === "google") {
                const email = user.email;
                if (!email) return false;

                // Check if user exists
                let dbUser = await prisma.user.findUnique({
                    where: { email }
                });

                if (!dbUser) {
                    // Create new user
                    dbUser = await prisma.user.create({
                        data: {
                            email,
                            name: user.name,
                            googleId: user.id, // This is the sub from Google
                            role: email === "demo@example.com" ? "admin" : "user"
                        }
                    });
                } else if (!dbUser.googleId) {
                    // Link Google ID if user exists but has no Google ID linked
                    await prisma.user.update({
                        where: { id: dbUser.id },
                        data: { googleId: user.id }
                    });
                }
                user.id = dbUser.id;
                user.role = dbUser.role;
            } else if (account.provider === "credentials") {
                // For credentials, authorize() already returns the user object.
                // We just need to ensure the role is set if it's the demo account
                if (user.email === "demo@example.com") {
                    user.role = "admin";
                } else {
                    const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
                    user.role = dbUser?.role || "user";
                }
            }
            return true;
        },
        async jwt({ token, user }: { token: any; user?: any }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }: { session: any; token: any }) {
            if (token && session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions as any);
export { handler as GET, handler as POST };
