import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import {
  MessageType,
  SubscriptionPlan,
  SpaceTheme,
  RoomType,
  SessionStatus,
  AchievementType,
} from '@prisma/client';

// Register enums for GraphQL
registerEnumType(MessageType, { name: 'MessageType' });
registerEnumType(SubscriptionPlan, { name: 'SubscriptionPlan' });
registerEnumType(SpaceTheme, { name: 'SpaceTheme' });
registerEnumType(RoomType, { name: 'RoomType' });
registerEnumType(SessionStatus, { name: 'SessionStatus' });
registerEnumType(AchievementType, { name: 'AchievementType' });

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  clerkId: string;

  @Field()
  email: string;

  @Field(() => String, { nullable: true })
  firstName: string | null;

  @Field(() => String, { nullable: true })
  lastName: string | null;

  @Field(() => String, { nullable: true })
  avatarUrl: string | null;

  @Field(() => String, { nullable: true })
  phone: string | null;

  @Field(() => String, { nullable: true })
  address: string | null;

  @Field(() => Int)
  totalPoints: number;

  @Field(() => Int)
  level: number;

  @Field(() => Int)
  streak: number;

  @Field(() => Date, { nullable: true })
  lastActiveAt: Date | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => Organization, { nullable: true })
  organization: Organization | null;

  @Field(() => [UserAchievement])
  achievements: UserAchievement[] | null;
}

@ObjectType()
export class Organization {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => String, { nullable: true })
  logoUrl: string | null;

  @Field(() => SubscriptionPlan)
  plan: SubscriptionPlan;

  @Field(() => Date, { nullable: true })
  planExpiresAt: Date | null;

  @Field(() => Int)
  maxUsers: number;

  @Field(() => Int)
  maxSpaces: number;

  @Field(() => Int)
  maxStorage: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class Message {
  @Field(() => ID)
  id: string;

  @Field()
  content: string;

  @Field(() => MessageType)
  type: MessageType;

  @Field()
  senderId: string;

  @Field(() => String, { nullable: true })
  roomId: string | null;

  @Field(() => String, { nullable: true })
  targetUserId: string | null;

  @Field()
  isEdited: boolean;

  @Field()
  isDeleted: boolean;

  @Field()
  isPinned: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => User)
  sender: User | null;

  @Field(() => Room, { nullable: true })
  room: Room | null;

  @Field(() => Message, { nullable: true })
  parent: Message | null;

  @Field(() => [Message])
  replies: Message[] | null;
}

@ObjectType()
export class Space {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => SpaceTheme)
  theme: SpaceTheme;

  @Field(() => String, { nullable: true })
  backgroundUrl: string | null;

  @Field()
  isActive: boolean;

  @Field()
  isPublic: boolean;

  @Field(() => Int)
  maxUsers: number;

  @Field()
  requireInvite: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => User)
  creator: User | null;

  @Field(() => Organization)
  organization: Organization | null;

  @Field(() => [Room])
  rooms: Room[] | null;
}

@ObjectType()
export class Room {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => RoomType)
  type: RoomType;

  @Field(() => Int)
  capacity: number;

  @Field()
  isPrivate: boolean;

  @Field()
  allowGuests: boolean;

  @Field()
  x: number;

  @Field()
  y: number;

  @Field()
  width: number;

  @Field()
  height: number;

  @Field(() => Number, { nullable: true })
  rotation: number | null;

  @Field(() => String, { nullable: true })
  color: string | null;

  @Field(() => String, { nullable: true })
  icon: string | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => Space)
  space: Space | null;

  @Field(() => [Message])
  messages: Message[] | null;
}

@ObjectType()
export class Session {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field(() => String, { nullable: true })
  spaceId: string | null;

  @Field(() => String, { nullable: true })
  roomId: string | null;

  @Field(() => Number, { nullable: true })
  x: number | null;

  @Field(() => Number, { nullable: true })
  y: number | null;

  @Field(() => SessionStatus)
  status: SessionStatus;

  @Field()
  startedAt: Date;

  @Field(() => Date, { nullable: true })
  endedAt: Date | null;

  @Field(() => Number, { nullable: true })
  duration: number | null;

  @Field()
  isActive: boolean;

  @Field()
  lastSeen: Date;

  @Field(() => User)
  user: User | null;

  @Field(() => Space, { nullable: true })
  space: Space | null;

  @Field(() => Room, { nullable: true })
  room: Room | null;
}

@ObjectType()
export class UserAchievement {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field(() => AchievementType)
  type: AchievementType;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field(() => Int)
  points: number;

  @Field(() => String, { nullable: true })
  badgeUrl: string | null;

  @Field()
  unlockedAt: Date;

  @Field(() => User)
  user: User | null;
}
