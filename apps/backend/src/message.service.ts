import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async createMessage(text: string): Promise<Message> {
    const message = this.messageRepository.create({ text });
    return await this.messageRepository.save(message);
  }

  async getLastMessage(): Promise<Message | null> {
    return await this.messageRepository.findOne({
      order: { createdAt: 'DESC' },
      where: {},
    });
  }
}