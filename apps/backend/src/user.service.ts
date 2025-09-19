import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { User } from '@prisma/client';

export interface CreateUserInput {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  organizationId?: string;
}

export interface UpdateUserInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  organizationId?: string;
  totalPoints?: number;
  level?: number;
  streak?: number;
}

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(userData: CreateUserInput): Promise<User> {
    return await this.prisma.user.create({
      data: userData,
      include: {
        organization: true,
        achievements: true,
      },
    });
  }

  async findByClerkId(clerkId: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { clerkId },
      include: {
        organization: true,
        achievements: true,
      },
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        organization: true,
        achievements: true,
        sessions: {
          take: 10,
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async updateUserByClerkId(
    clerkId: string,
    userData: UpdateUserInput,
  ): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { clerkId },
        data: {
          ...userData,
          updatedAt: new Date(),
        },
        include: {
          organization: true,
          achievements: true,
        },
      });
    } catch (error) {
      throw new NotFoundException(`User with Clerk ID ${clerkId} not found`);
    }
  }

  async deleteUserByClerkId(clerkId: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { clerkId },
      });
    } catch (error) {
      throw new NotFoundException(`User with Clerk ID ${clerkId} not found`);
    }
  }

  async findOrCreateUser(userData: CreateUserInput): Promise<User> {
    const existingUser = await this.findByClerkId(userData.clerkId);
    if (existingUser) {
      return existingUser;
    }
    return await this.createUser(userData);
  }

  async getAllUsers(): Promise<User[]> {
    return await this.prisma.user.findMany({
      include: {
        organization: true,
        achievements: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // New methods for virtual office functionality
  async updateUserActivity(clerkId: string): Promise<User> {
    return await this.prisma.user.update({
      where: { clerkId },
      data: {
        lastActiveAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async addPoints(clerkId: string, points: number): Promise<User> {
    const user = await this.findByClerkId(clerkId);
    if (!user) {
      throw new NotFoundException(`User with Clerk ID ${clerkId} not found`);
    }

    const newTotalPoints = user.totalPoints + points;
    const newLevel = Math.floor(newTotalPoints / 1000) + 1; // 1000 points per level

    return await this.prisma.user.update({
      where: { clerkId },
      data: {
        totalPoints: newTotalPoints,
        level: newLevel,
        updatedAt: new Date(),
      },
    });
  }

  async updateStreak(clerkId: string, streak: number): Promise<User> {
    return await this.prisma.user.update({
      where: { clerkId },
      data: {
        streak,
        updatedAt: new Date(),
      },
    });
  }
}
