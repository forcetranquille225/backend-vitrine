import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { BrevoContactService } from './brevo.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ContactController],
  providers: [ContactService, BrevoContactService, PrismaService],
  exports: [ContactService],
})
export class ContactModule {}
