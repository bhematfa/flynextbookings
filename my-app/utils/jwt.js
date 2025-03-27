// utils/jwt.js
/*****************************************************
 * OpenAI. (2025). ChatGPT (Feb 06 version) [Large language model]. https://chatgpt.com
 *****************************************************/

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "this_isthese_cret";

export function signToken(payload) {
  // Token will expire in 1 day
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function parseAndVerifyToken(request) {
  let token = null;
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else {
    const tokenCookie = request.cookies?.get?.("token")?.value;
    if (tokenCookie) {
      token = tokenCookie;
    }
  }

  if (!token) {
    return { err: "No token" };
  }

  // Verifies token
  try {
    const decoded = verifyToken(token);
    return decoded;
  } catch (error) {
    return { err: error };
  }
}
