import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { DomainModule } from './modules/domain/domain.module';
import { RuleModule } from './modules/rule/rule.module';
import { EventModule } from './modules/event/event.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UserController } from './modules/user/user.controller';
import { UserModule } from './modules/user/user.module';

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
    UserModule
  ],
  controllers: [UserController],
})
export class AppModule {}
