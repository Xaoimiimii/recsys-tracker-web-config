import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { DomainModule } from './modules/domain/domain.module';
import { RuleModule } from './modules/rule/rule.module';
import { EventModule } from './modules/event/event.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserController } from './modules/user/user.controller';
import { UserModule } from './modules/user/user.module';
import { ItemModule } from './modules/item/item.module';
import { RatingModule } from './modules/rating/rating.module';
import { TaskModule } from './modules/task/task.module';
import { ScheduleModule } from '@nestjs/schedule';
import { RecommendationModule } from './modules/recommendation/recommendation.module';
import { ElasticsearchModule } from '@nestjs/elasticsearch';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    AuthModule,
    DomainModule,
    RuleModule,
    EventModule,
    PrismaModule,
    UserModule,
    ItemModule,
    RatingModule,
    TaskModule,
    ScheduleModule.forRoot(),
    RecommendationModule,
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        node: configService.getOrThrow<string>('ELASTIC_ENDPOINT'),
        auth: {
          apiKey: configService.getOrThrow<string>('ELASTIC_API_KEY'),
        },
      }),
      inject: [ConfigService],
    })
  ],
  controllers: [UserController],
})
export class AppModule { }
