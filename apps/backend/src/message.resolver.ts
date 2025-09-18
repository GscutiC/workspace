import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { Message } from './message.entity';
import { MessageService } from './message.service';

@Resolver(() => Message)
export class MessageResolver {
  constructor(private messageService: MessageService) {}

  @Query(() => Message, { nullable: true })
  async helloWorld(): Promise<Message | null> {
    return this.messageService.getLastMessage();
  }

  @Mutation(() => Message)
  async createHelloMessage(
    @Args('text', { defaultValue: '¡Hola Mundo!' }) text: string,
  ): Promise<Message> {
    return this.messageService.createMessage(text);
  }
}