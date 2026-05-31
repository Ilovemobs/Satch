import { hash } from "bcryptjs";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { username, email, password } = body;

  if (!username || !email || !password) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (password.length < 6) {
    return Response.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existingUser) {
    const field = existingUser.email === email ? "Email" : "Username";
    return Response.json({ error: `${field} already taken` }, { status: 400 });
  }

  const passwordHash = await hash(password, 12);

  const user = await prisma.user.create({
    data: { username, email, passwordHash },
  });

  return Response.json({
    id: user.id,
    username: user.username,
    email: user.email,
  }, { status: 201 });
}
