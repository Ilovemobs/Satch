import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hash } from "bcryptjs";
import * as dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  const passwordHash = await hash("password123", 12);

  const alice = await prisma.user.upsert({
    where: { email: "alice@test.com" },
    update: {},
    create: {
      username: "alice",
      email: "alice@test.com",
      passwordHash,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@test.com" },
    update: {},
    create: {
      username: "bob",
      email: "bob@test.com",
      passwordHash,
    },
  });

  const demoCanvas = JSON.stringify({
    version: "5.3.0",
    objects: [
      { type: "rect", left: 50, top: 50, width: 200, height: 150, fill: "#f59e0b", strokeWidth: 0 },
      { type: "ellipse", left: 300, top: 80, rx: 80, ry: 60, fill: "#3b82f6", strokeWidth: 0 },
      { type: "textbox", left: 100, top: 250, width: 300, fontSize: 28, fill: "#ffffff", text: "Hello Satch!" },
    ],
    background: "#18181b",
  });

  const drawing1 = await prisma.drawing.create({
    data: {
      title: "Sunset Dreams",
      description: "A vibrant sunset scene with geometric shapes",
      canvasData: demoCanvas,
      isMinted: true,
      ownerId: alice.id,
    },
  });

  const drawing2 = await prisma.drawing.create({
    data: {
      title: "Blue Moon",
      description: "Abstract art featuring a blue moon",
      canvasData: demoCanvas,
      isMinted: true,
      ownerId: bob.id,
    },
  });

  const drawing3 = await prisma.drawing.create({
    data: {
      title: "Golden Hour",
      description: "Warm golden tones dominate this piece",
      canvasData: demoCanvas,
      isMinted: true,
      ownerId: alice.id,
    },
  });

  const endTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.auction.create({
    data: {
      drawingId: drawing1.id,
      startingBid: 500,
      currentBid: 500,
      endTime,
      sellerId: alice.id,
    },
  });

  await prisma.auction.create({
    data: {
      drawingId: drawing2.id,
      startingBid: 300,
      currentBid: 350,
      endTime,
      sellerId: bob.id,
    },
  });

  console.log("✅ Seed complete!");
  console.log("   Alice (alice@test.com / password123)");
  console.log("   Bob   (bob@test.com / password123)");
  console.log("   Created 3 drawings, 2 active auctions");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
