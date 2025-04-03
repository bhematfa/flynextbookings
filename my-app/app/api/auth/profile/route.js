// app/api/auth/profile/route.js
/*****************************************************
 * OpenAI. (2025). ChatGPT (Feb 06 version) [Large language model]. https://chatgpt.com
 *****************************************************/

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseAndVerifyToken } from "@/utils/jwt";
import formidable from "formidable";
import { promisify } from "util";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

const parseForm = async (req) => {
  const form = formidable({ multiples: false });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({ fields, files });
    });
  });
};

export async function GET(request) {
  const decoded = await parseAndVerifyToken(request);
  if (!decoded || decoded.err || !decoded.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        profilePicture: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    let base64Image;
    if (user.profilePicture) {
      // Buffer --> base64
      base64Image = user.profilePicture.toString("base64");
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profilePicture: base64Image
        ? `data:image/jpeg;base64,${base64Image}`
        : null,
    });
  } catch (error) {
    console.log("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  const decoded = await parseAndVerifyToken(request);
  if (!decoded || decoded.err || !decoded.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const req = request;
    const { fields, files } = await parseForm(req);
    if (!fields) {
      return NextResponse.json({ error: "No fields" }, { status: 400 });
    }
    if (fields.firstName && typeof fields.firstName !== "string") {
      return NextResponse.json(
        { error: "Invalid first name" },
        { status: 400 }
      );
    }
    if (fields.lastName && typeof fields.lastName !== "string") {
      return NextResponse.json({ error: "Invalid last name" }, { status: 400 });
    }
    if (
      fields.phoneNumber &&
      (typeof fields.phoneNumber !== "string" ||
        !/^\d+$/.test(fields.phoneNumber))
    ) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 }
      );
    }

    let profilePictureBytes = undefined;
    if (files.file) {
      const filePath = files.file.filepath; // temp file path
      const fileData = await promisify(fs.readFile)(filePath);
      profilePictureBytes = fileData;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        firstName: fields.firstName || undefined,
        lastName: fields.lastName || undefined,
        phoneNumber: fields.phoneNumber || undefined,
        profilePicture: profilePictureBytes || undefined,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profilePicture: false,
      },
    });

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
