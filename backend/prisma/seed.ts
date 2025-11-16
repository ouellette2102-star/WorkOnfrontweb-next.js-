import { PrismaClient, UserRole, MissionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed...');

  // Nettoyer la base de données (optionnel - commenter en production)
  // await prisma.contract.deleteMany();
  // await prisma.payment.deleteMany();
  // await prisma.mission.deleteMany();
  // await prisma.worker.deleteMany();
  // await prisma.employer.deleteMany();
  // await prisma.user.deleteMany();

  const saltRounds = 10;
  const defaultPassword = await bcrypt.hash('password123', saltRounds);

  // Créer des utilisateurs de test
  const employerUser = await prisma.user.upsert({
    where: { email: 'employer@test.com' },
    update: {},
    create: {
      email: 'employer@test.com',
      name: 'Employer Test',
      role: UserRole.EMPLOYER,
      active: true,
      profile: {
        passwordHash: defaultPassword,
      },
    },
  });

  const workerUser = await prisma.user.upsert({
    where: { email: 'worker@test.com' },
    update: {},
    create: {
      email: 'worker@test.com',
      name: 'Worker Test',
      role: UserRole.WORKER,
      active: true,
      profile: {
        passwordHash: defaultPassword,
      },
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      name: 'Admin Test',
      role: UserRole.ADMIN,
      active: true,
      profile: {
        passwordHash: defaultPassword,
      },
    },
  });

  console.log('✅ Utilisateurs créés');

  // Créer les profils employer et worker
  const employer = await prisma.employer.upsert({
    where: { userId: employerUser.id },
    update: {},
    create: {
      userId: employerUser.id,
      companyName: 'Test Company Inc.',
      billingInfo: {
        address: '123 Test Street',
        city: 'Montreal',
        province: 'QC',
        postalCode: 'H1A 1A1',
      },
    },
  });

  const worker = await prisma.worker.upsert({
    where: { userId: workerUser.id },
    update: {},
    create: {
      userId: workerUser.id,
      skills: [
        { name: 'Plomberie', level: 'expert', verified: true },
        { name: 'Électricité', level: 'intermédiaire', verified: true },
      ],
      rating: 4.5,
      badges: ['verified', 'top_rated'],
    },
  });

  console.log('✅ Profils créés');

  // Créer des missions de test
  const mission1 = await prisma.mission.create({
    data: {
      title: 'Réparation de plomberie urgente',
      employerId: employer.id,
      status: MissionStatus.CREATED,
      location: {
        lat: 45.5017,
        lng: -73.5673,
      },
      priceCents: 15000, // 150.00 CAD
      currency: 'CAD',
    },
  });

  const mission2 = await prisma.mission.create({
    data: {
      title: 'Installation électrique',
      employerId: employer.id,
      status: MissionStatus.CREATED,
      location: {
        lat: 45.5088,
        lng: -73.5878,
      },
      priceCents: 25000, // 250.00 CAD
      currency: 'CAD',
    },
  });

  console.log('✅ Missions créées');

  console.log(`
📊 Résumé du seed:
- 3 utilisateurs (employer, worker, admin)
- 1 employer profile
- 1 worker profile
- 2 missions

🔑 Identifiants de test:
- Employer: employer@test.com / password123
- Worker: worker@test.com / password123
- Admin: admin@test.com / password123
  `);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

