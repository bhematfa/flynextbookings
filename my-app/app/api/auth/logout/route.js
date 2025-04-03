// app/api/auth/logout/route.js
/*****************************************************
 * OpenAI. (2025). ChatGPT (Feb 06 version) [Large language model]. https://chatgpt.com
 *****************************************************/

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(request) {
  const { token } = await request.json();
  if (!token) {
    return NextResponse.json(
      { message: "You are already Logged Out" },
      { status: 200 }
    );
  }
  const expiredToken = jwt.sign(
    {
      userId: "user.userId",
      email: "user.email",
      role: "USER",
    },
    process.env.JWT_SECRET,
    { expiresIn: "1s" }
  );
  return NextResponse.json(
    { message: "Logged Out" },
    { token: expiredToken },
    { status: 200 }
  );
}
