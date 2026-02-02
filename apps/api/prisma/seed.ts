import { PrismaClient, UserStatus, Role, Plan } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create test user
  const passwordHash = await argon2.hash("Password123!", {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4,
  });

  const testUser = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      passwordHash,
      name: "Test User",
      status: UserStatus.ACTIVE,
      emailVerified: new Date(),
    },
  });

  console.log(`Created/Updated user: ${testUser.email}`);

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash,
      name: "Admin User",
      status: UserStatus.ACTIVE,
      emailVerified: new Date(),
    },
  });

  console.log(`Created/Updated user: ${adminUser.email}`);

  // Create test workspace
  const testWorkspace = await prisma.workspace.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: {
      name: "Acme Corporation",
      slug: "acme-corp",
      plan: Plan.FREE,
      settings: {
        timezone: "America/New_York",
        dateFormat: "MM/DD/YYYY",
      },
    },
  });

  console.log(`Created/Updated workspace: ${testWorkspace.slug}`);

  // Create membership for test user (OWNER)
  await prisma.membership.upsert({
    where: {
      userId_workspaceId: {
        userId: testUser.id,
        workspaceId: testWorkspace.id,
      },
    },
    update: {},
    create: {
      userId: testUser.id,
      workspaceId: testWorkspace.id,
      role: Role.OWNER,
    },
  });

  console.log(`Created membership: ${testUser.email} -> ${testWorkspace.slug} (OWNER)`);

  // Create membership for admin user (ADMIN)
  await prisma.membership.upsert({
    where: {
      userId_workspaceId: {
        userId: adminUser.id,
        workspaceId: testWorkspace.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      workspaceId: testWorkspace.id,
      role: Role.ADMIN,
    },
  });

  console.log(`Created membership: ${adminUser.email} -> ${testWorkspace.slug} (ADMIN)`);

  // Create a Pro workspace for testing plan features
  const proWorkspace = await prisma.workspace.upsert({
    where: { slug: "pro-team" },
    update: {},
    create: {
      name: "Pro Team",
      slug: "pro-team",
      plan: Plan.PRO,
      settings: {
        timezone: "Europe/London",
        dateFormat: "DD/MM/YYYY",
      },
    },
  });

  console.log(`Created/Updated workspace: ${proWorkspace.slug}`);

  // Test user is owner of pro workspace too
  await prisma.membership.upsert({
    where: {
      userId_workspaceId: {
        userId: testUser.id,
        workspaceId: proWorkspace.id,
      },
    },
    update: {},
    create: {
      userId: testUser.id,
      workspaceId: proWorkspace.id,
      role: Role.OWNER,
    },
  });

  console.log(`Created membership: ${testUser.email} -> ${proWorkspace.slug} (OWNER)`);

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
