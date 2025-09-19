import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Message, MessageType } from '@prisma/client';
import { Message as GraphQLMessage } from './graphql/models';

export interface CreateMessageInput {
  content: string;
  senderId: string;
  roomId?: string;
  targetUserId?: string;
  type?: MessageType;
  metadata?: any;
  parentId?: string;
}

export interface UpdateMessageInput {
  content?: string;
  isEdited?: boolean;
  isPinned?: boolean;
  reactions?: any;
}

@Injectable()
export class MessageService {
  constructor(private prisma: PrismaService) {}

  async createMessage(data: CreateMessageInput): Promise<Message> {
    return await this.prisma.message.create({
      data: {
        content: data.content,
        senderId: data.senderId,
        roomId: data.roomId,
        targetUserId: data.targetUserId,
        type: data.type || MessageType.TEXT,
        metadata: data.metadata,
        parentId: data.parentId,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        parent: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        replies: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  async getMessageById(id: string): Promise<Message> {
    const message = await this.prisma.message.findUnique({
      where: { id },
      include: {
        sender: true,
        room: true,
        parent: true,
        replies: {
          include: {
            sender: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    return message;
  }

  async getLastMessage(): Promise<Message | null> {
    return await this.prisma.message.findFirst({
      orderBy: { createdAt: 'desc' },
      where: { isDeleted: false },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async getMessagesByRoom(
    roomId: string,
    limit = 50,
    cursor?: string,
  ): Promise<Message[]> {
    return await this.prisma.message.findMany({
      where: {
        roomId,
        isDeleted: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        replies: {
          take: 3,
          include: {
            sender: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
    });
  }

  async getDirectMessages(
    userId1: string,
    userId2: string,
    limit = 50,
  ): Promise<Message[]> {
    return await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId1, targetUserId: userId2 },
          { senderId: userId2, targetUserId: userId1 },
        ],
        isDeleted: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async updateMessage(id: string, data: UpdateMessageInput): Promise<Message> {
    try {
      return await this.prisma.message.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      });
    } catch (error) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }
  }

  async deleteMessage(id: string, softDelete = true): Promise<void> {
    try {
      if (softDelete) {
        await this.prisma.message.update({
          where: { id },
          data: {
            isDeleted: true,
            content: '[deleted]',
            updatedAt: new Date(),
          },
        });
      } else {
        await this.prisma.message.delete({
          where: { id },
        });
      }
    } catch (error) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }
  }

  async addReaction(
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<Message> {
    const message = await this.getMessageById(messageId);
    const reactions = (message.reactions as any) || {};

    if (!reactions[emoji]) {
      reactions[emoji] = [];
    }

    if (!reactions[emoji].includes(userId)) {
      reactions[emoji].push(userId);
    }

    return await this.updateMessage(messageId, { reactions });
  }

  async removeReaction(
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<Message> {
    const message = await this.getMessageById(messageId);
    const reactions = (message.reactions as any) || {};

    if (reactions[emoji]) {
      reactions[emoji] = reactions[emoji].filter((id: string) => id !== userId);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    }

    return await this.updateMessage(messageId, { reactions });
  }

  async searchMessages(
    query: string,
    roomId?: string,
    limit = 20,
  ): Promise<Message[]> {
    return await this.prisma.message.findMany({
      where: {
        content: {
          contains: query,
          mode: 'insensitive',
        },
        ...(roomId && { roomId }),
        isDeleted: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
