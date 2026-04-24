import { Module } from '@nestjs/common';
import { NewsletterController } from './newsletter.controller';
import { NewsletterService } from './newsletter.service';
import { BrevoService } from './brevo.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [NewsletterController],
  providers: [NewsletterService, BrevoService, PrismaService],
  exports: [NewsletterService, BrevoService],
})
export class NewsletterModule {}
