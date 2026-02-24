import { NextResponse } from "next/server";
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: fileName,
            Body: buffer,
            ContentType: file.type,
        });

        await r2Client.send(command);

        const url = `${R2_PUBLIC_URL}/${fileName}`;
        return NextResponse.json({ url });
    } catch (error: any) {
        console.error("R2 Upload Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
