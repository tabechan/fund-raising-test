import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: "このメールアドレスは既に登録されています" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword
            }
        });

        console.log("User registered in DB:", { name, email });

        return NextResponse.json({ message: "User registered successfully", userId: newUser.id });
    } catch (error: any) {
        console.error("Registration Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
