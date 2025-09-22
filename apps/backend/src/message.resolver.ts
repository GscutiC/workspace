import {
  Resolver,
  Query,
  Mutation,
  Args,
  InputType,
  Field,
} from '@nestjs/graphql';
import { Message } from './graphql/models';
import { MessageService } from './message.service';
import { UserService } from './user.service';

@InputType()
class CreateMessageInput {
  @Field()
  content: string;

  @Field()
  senderId: string;

  @Field(() => String, { nullable: true })
  roomId?: string | null;

  @Field(() => String, { nullable: true })
  targetUserId?: string | null;
}

@Resolver(() => Message)
export class MessageResolver {
  constructor(
    private messageService: MessageService,
    private userService: UserService,
  ) {}

  @Query(() => Message, { nullable: true })
  async helloWorld(): Promise<Message | null> {
    return this.messageService.getLastMessage() as any;
  }

  @Mutation(() => Message)
  async createHelloMessage(
    @Args('text', { defaultValue: '¡Hola Mundo!' }) text: string,
    @Args('senderId', { nullable: true }) senderId?: string,
  ): Promise<Message> {
    let finalSenderId = senderId;

    if (!senderId) {
      // Use the known demo user ID as default
      finalSenderId = 'cmfpueq4t0002uk80mcbanu00'; // Alice Johnson (user_demo_1)
    }

    // Ensure finalSenderId is not undefined
    if (!finalSenderId) {
      throw new Error('Sender ID is required');
    }

    return this.messageService.createMessage({
      content: text,
      senderId: finalSenderId,
    }) as any;
  }

  @Mutation(() => Message)
  async createMessage(
    @Args('input') input: CreateMessageInput,
  ): Promise<Message> {
    const serviceInput = {
      content: input.content,
      senderId: input.senderId,
      roomId: input.roomId || undefined,
      targetUserId: input.targetUserId || undefined,
    };
    return this.messageService.createMessage(serviceInput) as any;
  }

  @Query(() => [Message])
  async messagesByRoom(
    @Args('roomId') roomId: string,
    @Args('limit', { defaultValue: 50 }) limit: number,
  ): Promise<Message[]> {
    return this.messageService.getMessagesByRoom(roomId, limit) as any;
  }

  @Query(() => [Message])
  async directMessages(
    @Args('userId1') userId1: string,
    @Args('userId2') userId2: string,
    @Args('limit', { defaultValue: 50 }) limit: number,
  ): Promise<Message[]> {
    return this.messageService.getDirectMessages(
      userId1,
      userId2,
      limit,
    ) as any;
  }
}
