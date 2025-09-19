import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Webhook } from 'svix';
import { UserService } from './user.service';

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{ email_address: string }>;
    first_name?: string;
    last_name?: string;
    image_url?: string;
  };
}

@Controller('api/webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private userService: UserService) {}

  @Post('clerk')
  @HttpCode(HttpStatus.OK)
  async handleClerkWebhook(
    @Body() payload: any,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    if (!svixId || !svixTimestamp || !svixSignature) {
      this.logger.error('Missing svix headers');
      throw new Error('Missing svix headers');
    }

    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      this.logger.error('Missing CLERK_WEBHOOK_SECRET environment variable');
      throw new Error('Missing CLERK_WEBHOOK_SECRET');
    }

    let event: ClerkWebhookEvent;

    try {
      const wh = new Webhook(webhookSecret);
      event = wh.verify(JSON.stringify(payload), {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ClerkWebhookEvent;
    } catch (err) {
      this.logger.error('Error verifying webhook:', err);
      throw new Error('Error verifying webhook');
    }

    this.logger.log(`Received webhook event: ${event.type}`);

    try {
      switch (event.type) {
        case 'user.created':
          await this.handleUserCreated(event);
          break;
        case 'user.updated':
          await this.handleUserUpdated(event);
          break;
        case 'user.deleted':
          await this.handleUserDeleted(event);
          break;
        default:
          this.logger.log(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Error processing webhook event: ${error.message}`);
      throw error;
    }

    return { success: true };
  }

  private async handleUserCreated(event: ClerkWebhookEvent) {
    const { data } = event;
    const email = data.email_addresses?.[0]?.email_address;

    if (!email) {
      this.logger.warn(`User created event missing email for user ${data.id}`);
      return;
    }

    try {
      await this.userService.createUser({
        clerkId: data.id,
        email,
        firstName: data.first_name || undefined,
        lastName: data.last_name || undefined,
        avatarUrl: data.image_url || undefined,
      });

      this.logger.log(`Created user in database: ${data.id}`);
    } catch (error) {
      this.logger.error(`Failed to create user ${data.id}: ${error.message}`);
      throw error;
    }
  }

  private async handleUserUpdated(event: ClerkWebhookEvent) {
    const { data } = event;
    const email = data.email_addresses?.[0]?.email_address;

    try {
      await this.userService.updateUserByClerkId(data.id, {
        email: email || undefined,
        firstName: data.first_name || undefined,
        lastName: data.last_name || undefined,
        avatarUrl: data.image_url || undefined,
      });

      this.logger.log(`Updated user in database: ${data.id}`);
    } catch (error) {
      this.logger.error(`Failed to update user ${data.id}: ${error.message}`);
      throw error;
    }
  }

  private async handleUserDeleted(event: ClerkWebhookEvent) {
    const { data } = event;

    try {
      await this.userService.deleteUserByClerkId(data.id);
      this.logger.log(`Deleted user from database: ${data.id}`);
    } catch (error) {
      this.logger.error(`Failed to delete user ${data.id}: ${error.message}`);
      throw error;
    }
  }
}
