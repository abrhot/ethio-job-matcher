import { prisma } from "../src/lib/db";
import { ingestSource } from "../src/lib/ingest/run";
import { matchAllUsers } from "../src/lib/matching/run";

async function seeker(input: {
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "seeker";
  field: string;
  skills: string[];
  experienceLevel: "student" | "junior";
  yearsExperience: number;
  remoteOk: boolean;
  jobTypes: ("full_time" | "internship")[];
  summary: string;
}) {
  return prisma.user.upsert({
    where: { email: input.email },
    create: {
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      locale: "en",
      alertMode: "both",
      profile: {
        create: {
          fullName: `${input.firstName} ${input.lastName}`,
          field: input.field,
          skills: input.skills,
          experienceLevel: input.experienceLevel,
          yearsExperience: input.yearsExperience,
          preferredCities: ["Addis Ababa"],
          remoteOk: input.remoteOk,
          jobTypes: input.jobTypes,
          summary: input.summary,
        },
      },
    },
    update: {
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      tier: "free",
      premiumUntil: null,
      profile: {
        upsert: {
          create: {
            fullName: `${input.firstName} ${input.lastName}`,
            field: input.field,
            skills: input.skills,
            experienceLevel: input.experienceLevel,
            yearsExperience: input.yearsExperience,
            preferredCities: ["Addis Ababa"],
            remoteOk: input.remoteOk,
            jobTypes: input.jobTypes,
            summary: input.summary,
          },
          update: {
            fullName: `${input.firstName} ${input.lastName}`,
            field: input.field,
            skills: input.skills,
            experienceLevel: input.experienceLevel,
            yearsExperience: input.yearsExperience,
            preferredCities: ["Addis Ababa"],
            remoteOk: input.remoteOk,
            jobTypes: input.jobTypes,
            summary: input.summary,
          },
        },
      },
    },
  });
}

async function main() {
  await seeker({
    email: "hana.tadesse@sera.local",
    firstName: "Hana",
    lastName: "Tadesse",
    role: "admin",
    field: "Software Engineering",
    skills: ["react", "nextjs", "typescript", "node", "postgresql", "python"],
    experienceLevel: "student",
    yearsExperience: 0,
    remoteOk: true,
    jobTypes: ["full_time", "internship"],
    summary: "Fifth-year software engineering student in Addis Ababa.",
  });
  await seeker({
    email: "dawit.bekele@sera.local",
    firstName: "Dawit",
    lastName: "Bekele",
    role: "seeker",
    field: "Accounting",
    skills: ["accounting", "excel", "finance"],
    experienceLevel: "junior",
    yearsExperience: 1,
    remoteOk: false,
    jobTypes: ["full_time"],
    summary: "Junior accountant looking for an on-site role in Addis Ababa.",
  });
  const ingested = await ingestSource("sample");
  const matched = await matchAllUsers();
  const hana = await prisma.user.findUniqueOrThrow({ where: { email: "hana.tadesse@sera.local" } });
  const top = await prisma.match.findMany({
    where: { userId: hana.id },
    include: { job: true },
    orderBy: { score: "desc" },
    take: 5,
  });
  console.log(
    JSON.stringify(
      {
        ingested,
        matched,
        hanaTop: top.map((row) => ({ score: Math.round(row.score), title: row.job.title })),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
