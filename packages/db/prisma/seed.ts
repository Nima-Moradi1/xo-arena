import path from "node:path";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
dotenv.config();
import { prisma } from "../src/index";

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 12);

  await prisma.user.upsert({
    where: { email: "demo@xo.local" },
    update: {},
    create: {
      email: "demo@xo.local",
      username: "demo_player",
      nickname: "Demo Player",
      passwordHash,
      isEmailVerified: true,
      emailVerifiedAt: new Date()
    }
  });

  await prisma.user.upsert({
    where: { email: "rival@xo.local" },
    update: {},
    create: {
      email: "rival@xo.local",
      username: "rival_player",
      nickname: "Rival Player",
      passwordHash,
      isEmailVerified: true,
      emailVerifiedAt: new Date()
    }
  });

  console.log("Seed users created:");
  console.log("demo@xo.local / Password123!");
  console.log("rival@xo.local / Password123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
