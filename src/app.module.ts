import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { ContactModule } from './contact/contact.module';


@Module({
  imports: [AuthModule, NewsletterModule, ContactModule, ConfigModule.forRoot({
      isGlobal: true,
    }),],
  controllers: [AppController],
  providers: [AppService, PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
