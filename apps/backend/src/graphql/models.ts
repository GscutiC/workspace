import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import {
  MessageType,
  SubscriptionPlan,
  SpaceTheme,
  RoomType,
  SessionStatus,
  AchievementType,
  DistrictType,
  ParcelType,
  ParcelStatus,
  BuildingType,
} from '@prisma/client';

@ObjectType()
export class Bounds {
  @Field(() => Int)
  x1: number;

  @Field(() => Int)
  y1: number;

  @Field(() => Int)
  x2: number;

  @Field(() => Int)
  y2: number;
}

// Register enums for GraphQL
registerEnumType(MessageType, { name: 'MessageType' });
registerEnumType(SubscriptionPlan, { name: 'SubscriptionPlan' });
registerEnumType(SpaceTheme, { name: 'SpaceTheme' });
registerEnumType(RoomType, { name: 'RoomType' });
registerEnumType(SessionStatus, { name: 'SessionStatus' });
registerEnumType(AchievementType, { name: 'AchievementType' });
registerEnumType(DistrictType, { name: 'DistrictType' });
registerEnumType(ParcelType, { name: 'ParcelType' });
registerEnumType(ParcelStatus, { name: 'ParcelStatus' });
registerEnumType(BuildingType, { name: 'BuildingType' });

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

@ObjectType()
export class District {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => Bounds)
  bounds: Bounds;

  @Field(() => DistrictType)
  districtType: DistrictType;

  @Field()
  color: string;

  @Field()
  zoneCode: string;

  @Field(() => Number)
  basePriceMultiplier: number;

  @Field(() => Number)
  taxRate: number;

  @Field()
  organizationId: string;

  @Field()
  spaceId: string;

  @Field(() => [Parcel], { nullable: true })
  parcels?: Parcel[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class Parcel {
  @Field(() => ID)
  id: string;

  @Field(() => Int)
  number: number;

  @Field(() => String, { nullable: true })
  name: string | null;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => Int)
  x: number;

  @Field(() => Int)
  y: number;

  @Field(() => Int)
  width: number;

  @Field(() => Int)
  height: number;

  @Field(() => ParcelType)
  parcelType: ParcelType;

  @Field(() => ParcelStatus)
  status: ParcelStatus;

  @Field(() => BuildingType, { nullable: true })
  buildingType: BuildingType | null;

  @Field(() => Number, { nullable: true })
  basePrice: number | null;

  @Field(() => Number, { nullable: true })
  currentPrice: number | null;

  @Field(() => Number, { nullable: true })
  monthlyTax: number | null;

  @Field(() => String, { nullable: true })
  ownerId: string | null;

  @Field()
  organizationId: string;

  @Field()
  spaceId: string;

  @Field(() => String, { nullable: true })
  districtId: string | null;

  @Field(() => District, { nullable: true })
  district?: District | null;

  @Field(() => String, { nullable: true })
  mapConfig: string | null;

  @Field(() => String, { nullable: true })
  preset: string | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class DistrictStats {
  @Field(() => Int)
  totalDistricts: number;

  @Field(() => [DistrictTypeCount])
  districtsByType: DistrictTypeCount[];

  @Field(() => [DistrictStat])
  stats: DistrictStat[];
}

@ObjectType()
export class DistrictTypeCount {
  @Field(() => DistrictType)
  districtType: DistrictType;

  @Field(() => Int)
  _count: number;
}

@ObjectType()
export class DistrictStat {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  zoneCode: string;

  @Field(() => DistrictType)
  districtType: DistrictType;

  @Field(() => Number)
  basePriceMultiplier: number;

  @Field(() => Int)
  parcelCount: number;

  @Field(() => Int)
  avgPrice: number;

  @Field(() => Int)
  totalValue: number;
}
