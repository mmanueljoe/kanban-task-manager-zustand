import { SignJWT, jwtVerify } from "jose";
import { env } from "@/config/env.js";

// jose wants the secret as bytes, not a string.
const secret = new TextEncoder().encode(env.jwtSecret);
const ALGORITHM = "HS256";

// Sign a token that says "this is user X." The user id rides in the standard
// `sub` (subject) claim; the token expires in a day.
export async function signAuthToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(secret);
}

// Verify signature + expiry and return the user id. Throws if the token is
// tampered with, expired, or malformed.
export async function verifyAuthToken(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, secret);
  if (!payload.sub) {
    throw new Error("Token is missing its subject");
  }
  return payload.sub;
}
