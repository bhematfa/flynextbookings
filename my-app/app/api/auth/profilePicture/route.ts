import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseAndVerifyToken } from "@/utils/jwt";

/*****************************************************
 * OpenAI. (2025). ChatGPT (Feb 06 version) [Large language model]. https://chatgpt.com
 *****************************************************/

export async function GET(request: Request) {
  const decoded = await parseAndVerifyToken(request);
  if (!decoded || !decoded.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { profilePicture: true },
    });
    if (!user || !user.profilePicture) {
      return NextResponse.json({ error: "No profile picture" }, { status: 404 });
    }
    // Assume JPEG; for PNG or others, store a mimeType in your DB or do filetype detection
    return new NextResponse(user.profilePicture, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": "inline",
      },
    });
  } catch (err) {
    console.error("ProfilePicture GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const decoded = await parseAndVerifyToken(request);
  if (!decoded || !decoded.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1) Parse multipart form data using the standard Web API
    const formData = await request.formData();

    // 2) Get the file from the field named "file"
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 3) Convert the file’s contents to a Node Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4) Store in DB
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { profilePicture: buffer },
    });

    return NextResponse.json({ message: "Profile picture updated" }, { status: 200 });
  } catch (err) {
    console.error("ProfilePicture POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}