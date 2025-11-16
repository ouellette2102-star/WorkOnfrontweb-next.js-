#!/usr/bin/env tsx
/**
 * Script de seed pour créer des données de démonstration
 * Usage: pnpm db:seed
 */

import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

// 90 métiers répartis en 10 catégories
const categoriesData = [
  {
    name: "Peinture",
    nameEn: "Painting",
    icon: "🎨",
    skills: [
      "Peinture intérieure",
      "Peinture extérieure",
      "Préparation surface",
      "Peinture résidentielle",
      "Peinture commerciale",
      "Finition",
      "Tape à masquer",
      "Pulvérisation",
    ],
  },
  {
    name: "Plomberie",
    nameEn: "Plumbing",
    icon: "🔧",
    skills: [
      "Réparation fuite",
      "Installation robinet",
      "Débouchage",
      "Chauffe-eau",
      "Plomberie résidentielle",
      "Plomberie commerciale",
    ],
  },
  {
    name: "Électricité",
    nameEn: "Electrical",
    icon: "⚡",
    skills: [
      "Installation prise",
      "Dépannage électrique",
      "Éclairage",
      "Tableau électrique",
      "Câblage résidentiel",
    ],
  },
  {
    name: "Menuiserie",
    nameEn: "Carpentry",
    icon: "🪵",
    skills: [
      "Armoires",
      "Étagères",
      "Plancher",
      "Portes",
      "Fenêtres",
      "Travaux sur mesure",
    ],
  },
  {
    name: "Entretien",
    nameEn: "Maintenance",
    icon: "🧹",
    skills: [
      "Nettoyage résidentiel",
      "Nettoyage commercial",
      "Entretien pelouse",
      "Déneigement",
      "Vitres",
      "Organisation",
    ],
  },
  {
    name: "Livraison",
    nameEn: "Delivery",
    icon: "📦",
    skills: [
      "Livraison locale",
      "Déménagement",
      "Transport meubles",
      "Course",
      "Livraison express",
    ],
  },
  {
    name: "Jardinage",
    nameEn: "Gardening",
    icon: "🌱",
    skills: [
      "Tonte",
      "Plantation",
      "Taille",
      "Aménagement paysager",
      "Arrosage",
    ],
  },
  {
    name: "Cuisine",
    nameEn: "Cooking",
    icon: "👨‍🍳",
    skills: [
      "Service traiteur",
      "Cuisine résidentielle",
      "Préparation repas",
      "Service événement",
    ],
  },
  {
    name: "Informatique",
    nameEn: "IT Support",
    icon: "💻",
    skills: [
      "Support technique",
      "Installation logiciel",
      "Configuration réseau",
      "Réparation ordinateur",
    ],
  },
  {
    name: "Divers",
    nameEn: "Miscellaneous",
    icon: "🔨",
    skills: [
      "Montage meubles",
      "Assemblage",
      "Petits travaux",
      "Bricolage",
      "Aide manuelle",
    ],
  },
];

async function main() {
  console.log("🌱 Début du seed...\n");

  // Clean existing data (optional - comment out in production)
  // await prisma.auditEvent.deleteMany();
  // await prisma.dispute.deleteMany();
  // await prisma.review.deleteMany();
  // await prisma.payment.deleteMany();
  // await prisma.match.deleteMany();
  // await prisma.offer.deleteMany();
  // await prisma.mission.deleteMany();
  // await prisma.scheduleSlot.deleteMany();
  // await prisma.workerSkill.deleteMany();
  // await prisma.workerProfile.deleteMany();
  // await prisma.skill.deleteMany();
  // await prisma.category.deleteMany();
  // await prisma.clientOrg.deleteMany();
  // await prisma.user.deleteMany();

  // 1. Create Categories and Skills
  console.log("📁 Création des catégories et compétences...");
  const categories = [];
  for (const catData of categoriesData) {
    const category = await prisma.category.create({
      data: {
        name: catData.name,
        nameEn: catData.nameEn,
        icon: catData.icon,
        residentialAllowed: true,
        skills: {
          create: catData.skills.map((skillName) => ({
            name: skillName,
            requiresPermit: false,
          })),
        },
      },
      include: { skills: true },
    });
    categories.push(category);
  }
  console.log(`✅ ${categories.length} catégories créées\n`);

  // 2. Create Demo Users
  console.log("👥 Création des utilisateurs de démo...");

  // Admin user
  const admin = await prisma.user.create({
    data: {
      clerkId: "demo_admin_" + Date.now(),
      role: "ADMIN",
      firstName: "Admin",
      lastName: "WorkOn",
      email: "admin@workon.app",
      phone: "+15141234567",
      verified: true,
      addressCity: "Québec",
      addressRegion: "QC",
      addressCountry: "CA",
      legalAcceptedAt: new Date(),
    },
  });

  // Client: Boulangerie Limoilou
  const clientUser = await prisma.user.create({
    data: {
      clerkId: "demo_client_" + Date.now(),
      role: "CLIENT",
      firstName: "Jean",
      lastName: "Dupont",
      email: "jean.dupont@boulangerie-limoilou.ca",
      phone: "+15141234568",
      verified: true,
      addressLat: 46.8139,
      addressLng: -71.2080,
      addressCity: "Québec",
      addressRegion: "QC",
      addressCountry: "CA",
      legalAcceptedAt: new Date(),
    },
  });

  const clientOrg = await prisma.clientOrg.create({
    data: {
      ownerId: clientUser.id,
      type: "BUSINESS",
      name: "Boulangerie Limoilou",
      verificationStatus: "VERIFIED",
    },
  });

  // Create 200 workers
  const workers = [];
  const workerUsers = [];
  for (let i = 0; i < 200; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const city = faker.location.city();
    const lat = 45.5 + (Math.random() - 0.5) * 0.5; // ~Montréal région
    const lng = -73.5 + (Math.random() - 0.5) * 0.5;

    const user = await prisma.user.create({
      data: {
        clerkId: `demo_worker_${i}_${Date.now()}`,
        role: "WORKER",
        firstName,
        lastName,
        email: faker.internet.email({ firstName, lastName }),
        phone: faker.phone.number("+1##########"),
        avatarUrl: faker.image.avatar(),
        bio: faker.person.bio(),
        ratingAvg: 3.5 + Math.random() * 1.5, // 3.5-5.0
        ratingCount: Math.floor(Math.random() * 50),
        level: Math.floor(Math.random() * 10) + 1,
        badges: faker.helpers.arrayElements(
          ["Certifié", "Rapide", "Fiable", "Expert"],
          { min: 0, max: 3 }
        ),
        verified: Math.random() > 0.3,
        addressLat: lat,
        addressLng: lng,
        addressCity: city,
        addressRegion: "QC",
        addressCountry: "CA",
        legalAcceptedAt: new Date(),
      },
    });

    const category = faker.helpers.arrayElement(categories);
    const skills = faker.helpers.arrayElements(category.skills, {
      min: 2,
      max: 5,
    });

    const worker = await prisma.workerProfile.create({
      data: {
        userId: user.id,
        hourlyRate: 20 + Math.random() * 40, // $20-60/h
        residentialEnabled: Math.random() > 0.2,
        portfolio: Array.from({ length: Math.floor(Math.random() * 6) }).map(
          () => ({
            url: faker.image.url(),
            type: "image",
            caption: faker.lorem.sentence(),
          })
        ),
        availability: {
          instantToggle: Math.random() > 0.5,
          repeating: {},
        },
        completedMissions: Math.floor(Math.random() * 100),
        totalEarnings: Math.random() * 50000,
        skills: {
          create: skills.map((skill) => ({
            skillId: skill.id,
            verified: Math.random() > 0.3,
          })),
        },
      },
    });

    workers.push(worker);
    workerUsers.push(user);
  }

  // Alice Martin (Peintre) - worker spécial
  const aliceUser = await prisma.user.create({
    data: {
      clerkId: `demo_alice_${Date.now()}`,
      role: "WORKER",
      firstName: "Alice",
      lastName: "Martin",
      email: "alice.martin@example.com",
      phone: "+15141234569",
      avatarUrl: faker.image.avatar(),
      bio: "Peintre professionnelle avec 10 ans d'expérience. Spécialisée en peinture résidentielle et commerciale.",
      ratingAvg: 4.8,
      ratingCount: 47,
      level: 8,
      badges: ["Certifié", "Expert", "Rapide"],
      verified: true,
      addressLat: 45.5017,
      addressLng: -73.5673,
      addressCity: "Montréal",
      addressRegion: "QC",
      addressCountry: "CA",
      legalAcceptedAt: new Date(),
    },
  });

  const paintingCategory = categories.find((c) => c.name === "Peinture")!;
  const aliceWorker = await prisma.workerProfile.create({
    data: {
      userId: aliceUser.id,
      hourlyRate: 45,
      residentialEnabled: true,
      portfolio: [
        {
          url: faker.image.url(),
          type: "image",
          caption: "Projet résidentiel - Salon moderne",
        },
        {
          url: faker.image.url(),
          type: "image",
          caption: "Peinture extérieure - Maison victorienne",
        },
        {
          url: faker.image.url(),
          type: "image",
          caption: "Finition professionnelle",
        },
      ],
      availability: {
        instantToggle: true,
        repeating: {},
      },
      completedMissions: 89,
      totalEarnings: 125000,
      skills: {
        create: paintingCategory.skills.slice(0, 5).map((skill) => ({
          skillId: skill.id,
          verified: true,
        })),
      },
    },
  });

  workers.push(aliceWorker);
  workerUsers.push(aliceUser);

  console.log(`✅ ${workerUsers.length} travailleurs créés\n`);

  // 3. Create Missions
  console.log("📋 Création des missions...");
  const missions = [];

  // Mission spéciale: Boulangerie Limoilou
  const mission1 = await prisma.mission.create({
    data: {
      authorClientId: clientUser.id,
      clientOrgId: clientOrg.id,
      title: "Remplacement Caissier 4h ce soir",
      description:
        "Besoin urgent d'un remplacement pour la caisse ce soir de 17h à 21h. Expérience en caisse requise.",
      categoryId: categories.find((c) => c.name === "Divers")!.id,
      requiredSkills: [],
      locationLat: 46.8139,
      locationLng: -71.2080,
      locationAddress: "123 Rue de la Boulangerie, Limoilou, QC",
      priceType: "FIXED",
      budgetMin: 80,
      budgetMax: 100,
      status: "OPEN",
      startAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // Dans 2h
      endAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // Dans 6h
    },
  });
  missions.push(mission1);

  // Créer 60 missions supplémentaires
  for (let i = 0; i < 60; i++) {
    const category = faker.helpers.arrayElement(categories);
    const skills = faker.helpers.arrayElements(category.skills, {
      min: 1,
      max: 3,
    });
    const priceType = faker.helpers.arrayElement(["FIXED", "HOURLY"]);
    const budgetMin = priceType === "FIXED" ? 50 + Math.random() * 200 : 20 + Math.random() * 30;
    const budgetMax = priceType === "FIXED" ? budgetMin : budgetMin + Math.random() * 20;

    const mission = await prisma.mission.create({
      data: {
        authorClientId: clientUser.id,
        clientOrgId: Math.random() > 0.5 ? clientOrg.id : undefined,
        title: faker.company.catchPhrase(),
        description: faker.lorem.paragraph(),
        categoryId: category.id,
        requiredSkills: skills.map((s) => s.id),
        locationLat: 45.5 + (Math.random() - 0.5) * 0.5,
        locationLng: -73.5 + (Math.random() - 0.5) * 0.5,
        locationAddress: faker.location.streetAddress({ useFullAddress: true }),
        priceType,
        budgetMin,
        budgetMax,
        status: faker.helpers.arrayElement([
          "DRAFT",
          "OPEN",
          "MATCHED",
          "IN_PROGRESS",
        ]),
        startAt: faker.date.future(),
        endAt: faker.date.future(),
      },
    });
    missions.push(mission);
  }

  console.log(`✅ ${missions.length} missions créées\n`);

  // 4. Create Matches for the special mission
  console.log("🎯 Création des matches...");
  const missionWithCategory = await prisma.mission.findUnique({
    where: { id: mission1.id },
    include: { category: { include: { skills: true } } },
  });

  if (missionWithCategory) {
    // Match Alice to the mission
    const aliceWorkerWithSkills = await prisma.workerProfile.findUnique({
      where: { id: aliceWorker.id },
      include: {
        user: true,
        skills: true,
      },
    });

    if (aliceWorkerWithSkills) {
      // Simulate match score
      const matchScore = 85;
      await prisma.match.create({
        data: {
          missionId: mission1.id,
          workerId: aliceWorker.id,
          score: matchScore,
          featuresJSON: {
            distance: 0.8,
            skillsOverlap: 0.6,
            rating: 0.96,
            sla: 0.9,
            responseTime: 0.8,
            priceFit: 0.7,
            availability: 1.0,
          },
        },
      });
    }

    // Create matches for top 20 workers
    const topWorkers = workers.slice(0, 20);
    for (const worker of topWorkers) {
      const score = 60 + Math.random() * 30;
      await prisma.match.create({
        data: {
          missionId: mission1.id,
          workerId: worker.id,
          score,
          featuresJSON: {
            distance: Math.random(),
            skillsOverlap: Math.random(),
            rating: Math.random(),
            sla: Math.random(),
            responseTime: Math.random(),
            priceFit: Math.random(),
            availability: Math.random(),
          },
        },
      });
    }
  }

  console.log("✅ Matches créés\n");

  console.log("🎉 Seed terminé avec succès!\n");
  console.log("📊 Résumé:");
  console.log(`   - ${categories.length} catégories`);
  console.log(`   - ${workerUsers.length} travailleurs`);
  console.log(`   - ${missions.length} missions`);
  console.log(`   - 1 admin (${admin.email})`);
  console.log(`   - 1 client de démo (${clientUser.email})`);
  console.log(`   - Alice Martin (alice.martin@example.com) - Peintre 4.8★`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

