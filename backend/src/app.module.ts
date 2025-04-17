import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AtGuard, RoleGuard } from './common/guards';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PlansModule } from './plans/plans.module';
import { ChannelsModule } from './channels/channels.module';
import { RankingsModule } from './rankings/rankings.module';
import { UserschannelsModule } from './userschannels/userschannels.module';
import { LogsModule } from './logger/logs.module';
import { CustomerModule } from './customer/customers.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    PrismaModule,
    AuthModule,
    PlansModule,
    ChannelsModule,
    RankingsModule,
    UserschannelsModule,
    LogsModule,
    CustomerModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AtGuard
    },
    {
      provide: APP_GUARD,
      useClass: RoleGuard
    }
  ]
})
export class AppModule { }
