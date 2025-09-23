import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MessageService } from './message.service';
import { MessageResolver } from './message.resolver';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { WebhookController } from './webhook.controller';
import { PrismaService } from './prisma.service';
import { DistrictService } from './district.service';
import { DistrictResolver } from './district.resolver';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: true,
      context: ({ req }) => ({ req }),
    }),
  ],
  controllers: [AppController, WebhookController],
  providers: [
    AppService,
    PrismaService,
    MessageService,
    MessageResolver,
    UserService,
    UserResolver,
    DistrictService,
    DistrictResolver,
  ],
})
export class AppModule {}
