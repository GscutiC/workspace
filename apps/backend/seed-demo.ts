import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create organization
  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Organización Demo',
      slug: 'demo-org',
      description: 'Organización de demostración para el sistema de parcelas',
    },
  });

  console.log('✅ Organization created:', organization.id);

  // Create a demo user to be the creator
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      clerkId: 'demo-user-clerk-id',
      email: 'demo@example.com',
      firstName: 'Demo',
      lastName: 'User',
      organizationId: organization.id,
    },
  });

  console.log('✅ Demo user created:', demoUser.id);

  // Create space
  const space = await prisma.space.upsert({
    where: { 
      id: 'demo-space-id' // Use a specific ID for upsert
    },
    update: {},
    create: {
      id: 'demo-space-id',
      name: 'Oficina Virtual',
      description: 'Espacio virtual principal con parcelas',
      layout: {
        width: 1000,
        height: 800,
        tileSize: 32,
        objects: []
      },
      organizationId: organization.id,
      creatorId: demoUser.id,
      isPublic: true,
    },
  });

  console.log('✅ Space created:', space.id);

  // Output the IDs to use for parcel creation
  console.log('\n📋 Use these IDs for parcel creation:');
  console.log(`Organization ID: ${organization.id}`);
  console.log(`Space ID: ${space.id}`);

  return { organizationId: organization.id, spaceId: space.id };
}

main()
  .then(async (result) => {
    console.log('\n🎉 Seeding completed successfully!');
    console.log('You can now create parcels using:');
    console.log(`curl -X POST http://localhost:3001/parcels/generate/demo/${result.organizationId}/${result.spaceId}`);
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });