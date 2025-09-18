/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Message } from './message.entity';
import { MessageService } from './message.service';
import { MessageResolver } from './message.resolver';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService,
      ): Promise<PostgresConnectionOptions> =>
        Promise.resolve({
          type: 'postgres',
          host: configService.get('DATABASE_HOST'),
          port: parseInt(configService.get('DATABASE_PORT') ?? '5432', 10),
          username: configService.get('DATABASE_USER'),
          password: configService.get('DATABASE_PASSWORD'),
          database: configService.get('DATABASE_NAME'),
          entities: [Message],
          autoLoadEntities: true,
          synchronize: true,
        }),
    }),
    TypeOrmModule.forFeature([Message]),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, MessageService, MessageResolver],
})
export class AppModule {}