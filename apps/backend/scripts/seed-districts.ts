import { PrismaClient, DistrictType, SpaceTheme } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDistricts() {
  console.log('🏛️ Seeding districts...');

  try {
    // Find or create organization
    let organization = await prisma.organization.findFirst({
      where: {
        name: 'Default Organization'
      }
    });

    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: 'Default Organization',
          slug: 'default-org',
          description: 'Default organization for testing',
          plan: 'FREE',
          maxUsers: 100,
          maxSpaces: 5,
          maxStorage: 1024,
          settings: {
            allowPublicSpaces: true,
            requireApproval: false,
          }
        }
      });
      console.log('✅ Created organization:', organization.name);
    }

    // Find or create a user to be the creator
    let creator = await prisma.user.findFirst({
      where: { organizationId: organization.id }
    });

    if (!creator) {
      creator = await prisma.user.create({
        data: {
          clerkId: 'system_user_' + Date.now(),
          email: 'system@example.com',
          firstName: 'System',
          lastName: 'User',
          organizationId: organization.id,
        }
      });
      console.log('✅ Created system user:', creator.email);
    }

    // Find or create space
    let space = await prisma.space.findFirst({
      where: { 
        organizationId: organization.id,
        name: 'Main Virtual Office'
      }
    });

    if (!space) {
      space = await prisma.space.create({
        data: {
          name: 'Main Virtual Office',
          description: 'The main virtual office space with districts',
          organizationId: organization.id,
          creatorId: creator.id,
          theme: SpaceTheme.MODERN,
          isPublic: true,
          maxUsers: 100,
          layout: {
            width: 128,
            height: 128,
            spawnPoints: [
              { x: 64, y: 64 }
            ]
          }
        }
      });
      console.log('✅ Created space:', space.name);
    }

    // District definitions - 16 districts in a 4x4 grid
    const districts = [
      // Row 1 (Commercial Districts)
      { code: 'D-0101', name: 'Downtown Commercial', type: DistrictType.COMMERCIAL, bounds: { x1: 0, y1: 0, x2: 32, y2: 32 }, color: '#4A90E2' },
      { code: 'D-0102', name: 'Business Central', type: DistrictType.COMMERCIAL, bounds: { x1: 32, y1: 0, x2: 64, y2: 32 }, color: '#5CB85C' },
      { code: 'D-0103', name: 'Financial District', type: DistrictType.COMMERCIAL, bounds: { x1: 64, y1: 0, x2: 96, y2: 32 }, color: '#F0AD4E' },
      { code: 'D-0104', name: 'Tech Hub', type: DistrictType.COMMERCIAL, bounds: { x1: 96, y1: 0, x2: 128, y2: 32 }, color: '#D9534F' },
      
      // Row 2 (Mixed Use Districts)
      { code: 'D-0201', name: 'Creative Quarter', type: DistrictType.MIXED_USE, bounds: { x1: 0, y1: 32, x2: 32, y2: 64 }, color: '#9B59B6' },
      { code: 'D-0202', name: 'Innovation Hub', type: DistrictType.MIXED_USE, bounds: { x1: 32, y1: 32, x2: 64, y2: 64 }, color: '#3498DB' },
      { code: 'D-0203', name: 'Startup Village', type: DistrictType.MIXED_USE, bounds: { x1: 64, y1: 32, x2: 96, y2: 64 }, color: '#E67E22' },
      { code: 'D-0204', name: 'Co-working Zone', type: DistrictType.MIXED_USE, bounds: { x1: 96, y1: 32, x2: 128, y2: 64 }, color: '#95A5A6' },
      
      // Row 3 (Residential Districts)
      { code: 'D-0301', name: 'Garden District', type: DistrictType.RESIDENTIAL, bounds: { x1: 0, y1: 64, x2: 32, y2: 96 }, color: '#1ABC9C' },
      { code: 'D-0302', name: 'Peaceful Heights', type: DistrictType.RESIDENTIAL, bounds: { x1: 32, y1: 64, x2: 64, y2: 96 }, color: '#F39C12' },
      { code: 'D-0303', name: 'Quiet Suburbs', type: DistrictType.RESIDENTIAL, bounds: { x1: 64, y1: 64, x2: 96, y2: 96 }, color: '#8E44AD' },
      { code: 'D-0304', name: 'Family Quarter', type: DistrictType.RESIDENTIAL, bounds: { x1: 96, y1: 64, x2: 128, y2: 96 }, color: '#34495E' },
      
      // Row 4 (Recreational/Admin Districts)
      { code: 'D-0401', name: 'Recreation Park', type: DistrictType.RECREATIONAL, bounds: { x1: 0, y1: 96, x2: 32, y2: 128 }, color: '#E74C3C' },
      { code: 'D-0402', name: 'Sports Complex', type: DistrictType.RECREATIONAL, bounds: { x1: 32, y1: 96, x2: 64, y2: 128 }, color: '#2ECC71' },
      { code: 'D-0403', name: 'Cultural Center', type: DistrictType.RECREATIONAL, bounds: { x1: 64, y1: 96, x2: 96, y2: 128 }, color: '#F1C40F' },
      { code: 'D-0404', name: 'Admin Center', type: DistrictType.ADMINISTRATIVE, bounds: { x1: 96, y1: 96, x2: 128, y2: 128 }, color: '#BDC3C7' },
    ];

    // Clear existing districts for this space
    await prisma.district.deleteMany({
      where: {
        spaceId: space.id
      }
    });

    // Create districts
    for (const district of districts) {
      await prisma.district.create({
        data: {
          organizationId: organization.id,
          spaceId: space.id,
          bounds: JSON.stringify(district.bounds),
          zoneCode: district.code,
          name: district.name,
          description: `${district.name} - A ${district.type.toLowerCase()} district`,
          districtType: district.type,
          color: district.color,
          basePriceMultiplier: getBasePriceMultiplier(district.type),
          taxRate: getTaxRate(district.type),
        }
      });
    }

    console.log(`✅ Created ${districts.length} districts successfully`);

    // Display summary
    const districtCount = await prisma.district.count({
      where: { spaceId: space.id }
    });

    console.log(`📊 Summary:`);
    console.log(`   Organization: ${organization.name}`);
    console.log(`   Space: ${space.name}`);
    console.log(`   Districts: ${districtCount}`);
    console.log(`   GraphQL available at: http://localhost:3001/graphql`);

  } catch (error) {
    console.error('❌ Error seeding districts:', error);
    throw error;
  }
}

function getBasePriceMultiplier(type: DistrictType): number {
  switch (type) {
    case DistrictType.COMMERCIAL: return 1.5;
    case DistrictType.MIXED_USE: return 1.2;
    case DistrictType.RESIDENTIAL: return 1.0;
    case DistrictType.RECREATIONAL: return 0.8;
    case DistrictType.ADMINISTRATIVE: return 1.3;
    default: return 1.0;
  }
}

function getTaxRate(type: DistrictType): number {
  switch (type) {
    case DistrictType.COMMERCIAL: return 0.15;
    case DistrictType.MIXED_USE: return 0.12;
    case DistrictType.RESIDENTIAL: return 0.08;
    case DistrictType.RECREATIONAL: return 0.05;
    case DistrictType.ADMINISTRATIVE: return 0.10;
    default: return 0.10;
  }
}

// Run if called directly
if (require.main === module) {
  seedDistricts()
    .then(() => {
      console.log('🎉 District seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 District seeding failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { seedDistricts };