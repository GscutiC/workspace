import { PrismaClient, SubscriptionPlan, SpaceTheme, RoomType, MessageType, AchievementType, SessionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create Organization
  const organization = await prisma.organization.create({
    data: {
      name: 'Acme Virtual Office',
      slug: 'acme-virtual-office',
      description: 'A modern virtual office space for remote teams',
      plan: SubscriptionPlan.PRO,
      maxUsers: 100,
      maxSpaces: 10,
      maxStorage: 10240, // 10GB
      settings: {
        allowPublicSpaces: true,
        requireApproval: false,
        defaultTheme: 'MODERN',
      },
    },
  });

  console.log('✅ Created organization:', organization.name);

  // Create Users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        clerkId: 'user_demo_1',
        email: 'alice@acme.com',
        firstName: 'Alice',
        lastName: 'Johnson',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b1c5?w=150',
        organizationId: organization.id,
        totalPoints: 2500,
        level: 3,
        streak: 7,
        preferences: {
          theme: 'dark',
          notifications: true,
          soundEnabled: true,
        },
      },
    }),
    prisma.user.create({
      data: {
        clerkId: 'user_demo_2',
        email: 'bob@acme.com',
        firstName: 'Bob',
        lastName: 'Smith',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        organizationId: organization.id,
        totalPoints: 1800,
        level: 2,
        streak: 3,
        preferences: {
          theme: 'light',
          notifications: true,
          soundEnabled: false,
        },
      },
    }),
    prisma.user.create({
      data: {
        clerkId: 'user_demo_3',
        email: 'carol@acme.com',
        firstName: 'Carol',
        lastName: 'Davis',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        organizationId: organization.id,
        totalPoints: 3200,
        level: 4,
        streak: 12,
        preferences: {
          theme: 'auto',
          notifications: true,
          soundEnabled: true,
        },
      },
    }),
  ]);

  console.log('✅ Created users:', users.map(u => u.firstName).join(', '));

  // Create Spaces
  const mainSpace = await prisma.space.create({
    data: {
      name: 'Main Office',
      description: 'Our primary virtual office space with meeting rooms and social areas',
      creatorId: users[0].id,
      organizationId: organization.id,
      theme: SpaceTheme.MODERN,
      maxUsers: 50,
      layout: {
        width: 1200,
        height: 800,
        background: '/assets/office-background.jpg',
        objects: [
          { type: 'desk', x: 100, y: 200, width: 80, height: 60 },
          { type: 'plant', x: 50, y: 150, width: 30, height: 40 },
          { type: 'whiteboard', x: 200, y: 100, width: 120, height: 80 },
        ],
      },
    },
  });

  const creativeSpace = await prisma.space.create({
    data: {
      name: 'Creative Hub',
      description: 'A space for brainstorming and creative collaboration',
      creatorId: users[1].id,
      organizationId: organization.id,
      theme: SpaceTheme.COLORFUL,
      maxUsers: 25,
      layout: {
        width: 1000,
        height: 600,
        background: '/assets/creative-background.jpg',
        objects: [
          { type: 'round-table', x: 300, y: 200, width: 100, height: 100 },
          { type: 'bean-bags', x: 150, y: 350, width: 60, height: 60 },
          { type: 'art-wall', x: 50, y: 50, width: 200, height: 100 },
        ],
      },
    },
  });

  console.log('✅ Created spaces:', [mainSpace.name, creativeSpace.name].join(', '));

  // Create Rooms
  const rooms = await Promise.all([
    prisma.room.create({
      data: {
        name: 'Conference Room A',
        description: 'Large meeting room for team meetings',
        type: RoomType.MEETING,
        capacity: 12,
        spaceId: mainSpace.id,
        x: 300,
        y: 150,
        width: 150,
        height: 100,
        color: '#3B82F6',
        icon: '📞',
        config: {
          hasWhiteboard: true,
          hasProjector: true,
          hasAudioSystem: true,
        },
      },
    }),
    prisma.room.create({
      data: {
        name: 'Focus Pod 1',
        description: 'Quiet space for focused work',
        type: RoomType.FOCUS,
        capacity: 2,
        spaceId: mainSpace.id,
        x: 500,
        y: 200,
        width: 80,
        height: 80,
        color: '#10B981',
        icon: '🎯',
        config: {
          hasNoiseReduction: true,
          hasGoodLighting: true,
        },
      },
    }),
    prisma.room.create({
      data: {
        name: 'Coffee Lounge',
        description: 'Casual space for informal chats',
        type: RoomType.SOCIAL,
        capacity: 8,
        spaceId: mainSpace.id,
        x: 100,
        y: 400,
        width: 120,
        height: 100,
        color: '#F59E0B',
        icon: '☕',
        config: {
          hasComfortableSeating: true,
          hasSnacks: true,
        },
      },
    }),
    prisma.room.create({
      data: {
        name: 'Brainstorm Room',
        description: 'Creative thinking space',
        type: RoomType.BRAINSTORM,
        capacity: 6,
        spaceId: creativeSpace.id,
        x: 200,
        y: 100,
        width: 120,
        height: 90,
        color: '#8B5CF6',
        icon: '💡',
        config: {
          hasDigitalWhiteboard: true,
          hasStickyNotes: true,
          hasCreativeTools: true,
        },
      },
    }),
  ]);

  console.log('✅ Created rooms:', rooms.map(r => r.name).join(', '));

  // Create User Achievements
  const achievements = await Promise.all([
    prisma.userAchievement.create({
      data: {
        userId: users[0].id,
        type: AchievementType.FIRST_LOGIN,
        title: 'Welcome Aboard!',
        description: 'Completed first login to the virtual office',
        points: 100,
        badgeUrl: '/assets/badges/first-login.png',
      },
    }),
    prisma.userAchievement.create({
      data: {
        userId: users[0].id,
        type: AchievementType.DAILY_STREAK_7,
        title: 'Week Warrior',
        description: 'Logged in for 7 consecutive days',
        points: 500,
        badgeUrl: '/assets/badges/streak-7.png',
      },
    }),
    prisma.userAchievement.create({
      data: {
        userId: users[2].id,
        type: AchievementType.MEETING_MASTER,
        title: 'Meeting Master',
        description: 'Organized 10+ successful meetings',
        points: 800,
        badgeUrl: '/assets/badges/meeting-master.png',
      },
    }),
  ]);

  console.log('✅ Created achievements:', achievements.length);

  // Create Messages
  const messages = await Promise.all([
    prisma.message.create({
      data: {
        content: 'Welcome to our new virtual office! 🎉',
        senderId: users[0].id,
        roomId: rooms[2].id, // Coffee Lounge
        type: MessageType.TEXT,
      },
    }),
    prisma.message.create({
      data: {
        content: 'Looking forward to collaborating with everyone here!',
        senderId: users[1].id,
        roomId: rooms[2].id, // Coffee Lounge
        type: MessageType.TEXT,
      },
    }),
    prisma.message.create({
      data: {
        content: 'The focus pods are amazing for deep work 🎯',
        senderId: users[2].id,
        roomId: rooms[2].id, // Coffee Lounge
        type: MessageType.TEXT,
        reactions: {
          '👍': [users[0].id, users[1].id],
          '🎯': [users[0].id],
        },
      },
    }),
    prisma.message.create({
      data: {
        content: 'Hey Alice, do you have a moment to discuss the project?',
        senderId: users[1].id,
        targetUserId: users[0].id, // Direct message
        type: MessageType.TEXT,
      },
    }),
  ]);

  console.log('✅ Created messages:', messages.length);

  // Create Active Sessions
  const sessions = await Promise.all([
    prisma.session.create({
      data: {
        userId: users[0].id,
        spaceId: mainSpace.id,
        roomId: rooms[0].id, // Conference Room A
        x: 350,
        y: 200,
        status: SessionStatus.ACTIVE,
        metadata: {
          deviceType: 'desktop',
          browser: 'chrome',
        },
      },
    }),
    prisma.session.create({
      data: {
        userId: users[1].id,
        spaceId: mainSpace.id,
        x: 600,
        y: 300,
        status: SessionStatus.ACTIVE,
        metadata: {
          deviceType: 'mobile',
          browser: 'safari',
        },
      },
    }),
  ]);

  console.log('✅ Created sessions:', sessions.length);

  console.log('🎉 Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Organization: ${organization.name}`);
  console.log(`- Users: ${users.length}`);
  console.log(`- Spaces: 2`);
  console.log(`- Rooms: ${rooms.length}`);
  console.log(`- Achievements: ${achievements.length}`);
  console.log(`- Messages: ${messages.length}`);
  console.log(`- Active Sessions: ${sessions.length}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });