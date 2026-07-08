import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.adjuster.findFirst();
  if (existing) {
    console.log("Adjuster already exists, skipping seed.");
    return;
  }

  await prisma.adjuster.create({
    data: {
      name: process.env.ADJUSTER_NAME ?? "Ajustador",
      email: process.env.ADMIN_EMAIL ?? "ajustador@example.com",
      phone: process.env.ADJUSTER_PHONE ?? "555-0000",
      serviceAreas: process.env.ADJUSTER_SERVICE_AREAS ?? "Área metropolitana",
      availability: {
        mon: ["09:00-17:00"],
        tue: ["09:00-17:00"],
        wed: ["09:00-17:00"],
        thu: ["09:00-17:00"],
        fri: ["09:00-17:00"],
      },
    },
  });

  console.log("Seeded adjuster record.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
