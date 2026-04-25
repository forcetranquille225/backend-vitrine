import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BrevoService } from './brevo.service';

interface SubscribeDto {
  email: string;
  name?: string;
}

interface SendNewsletterDto {
  subject: string;
  htmlContent: string;
  sendImmediately: boolean;
}

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(
    private prisma: PrismaService,
    private brevoService: BrevoService,
  ) {}

  /**
   * Subscribe a new email to the newsletter
   */
  async subscribe(data: SubscribeDto) {
    const { email, name } = data;

    // Validate email format
    const isValidEmail = await this.brevoService.validateEmail(email);
    if (!isValidEmail) {
      throw new BadRequestException('Invalid email format');
    }

    // Check if already subscribed
    const existing = await this.prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.status === 'SUBSCRIBED') {
        throw new BadRequestException('Email already subscribed');
      }

      // Resubscribe
      return await this.prisma.newsletterSubscriber.update({
        where: { email },
        data: { status: 'SUBSCRIBED' },
      });
    }

    // Create new subscriber
    const subscriber = await this.prisma.newsletterSubscriber.create({
      data: {
        email,
        name: name || '',
        status: 'SUBSCRIBED',
      },
    });

    this.logger.log(`New subscriber: ${email}`);
    return subscriber;
  }

  /**
   * Unsubscribe an email from the newsletter
   */
  async unsubscribe(email: string) {
    const subscriber = await this.prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (!subscriber) {
      throw new BadRequestException('Email not found');
    }

    return await this.prisma.newsletterSubscriber.update({
      where: { email },
      data: { status: 'UNSUBSCRIBED' },
    });
  }

  /**
   * Get all subscribers
   */
  async getAllSubscribers(status?: string) {
    const statusEnum = (status || 'SUBSCRIBED') as any;
    const where = { status: statusEnum };

    return await this.prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create and send a newsletter
   */
  async createAndSendNewsletter(data: SendNewsletterDto) {
    const { subject, htmlContent, sendImmediately } = data;

    // Validate content
    if (!subject || !htmlContent) {
      throw new BadRequestException('Subject and content are required');
    }

    // Get all active subscribers
    const subscribers = await this.getAllSubscribers('SUBSCRIBED');

    if (subscribers.length === 0) {
      throw new BadRequestException('No active subscribers found');
    }

    // Create newsletter record
    const newsletter = await this.prisma.newsletter.create({
      data: {
        subject,
        content: htmlContent,
        status: sendImmediately ? 'SENT' : 'DRAFT',
        sentAt: sendImmediately ? new Date() : null,
      },
    });

    if (sendImmediately) {
      // Send immediately
      const subscriberEmails = subscribers.map((sub) => ({
        email: sub.email,
        name: sub.name || undefined,
      }));

      const result = await this.brevoService.sendBulkEmail(
        subscriberEmails,
        subject,
        htmlContent,
      );

      if (!result.success) {
        // Update newsletter status to FAILED
        await this.prisma.newsletter.update({
          where: { id: newsletter.id },
          data: { status: 'FAILED' },
        });

        throw new BadRequestException(result.error || 'Failed to send newsletter');
      }

      this.logger.log(
        `Newsletter sent to ${subscribers.length} subscribers`,
      );
    }

    return newsletter;
  }

  /**
   * Send a newsletter that was previously created
   */
  async sendNewsletter(newsletterId: string) {
    const newsletter = await this.prisma.newsletter.findUnique({
      where: { id: newsletterId },
    });

    if (!newsletter) {
      throw new BadRequestException('Newsletter not found');
    }

    if (newsletter.status === 'SENT') {
      throw new BadRequestException('Newsletter already sent');
    }

    // Get all active subscribers
    const subscribers = await this.getAllSubscribers('SUBSCRIBED');

    if (subscribers.length === 0) {
      throw new BadRequestException('No active subscribers found');
    }

    const subscriberEmails = subscribers.map((sub) => ({
      email: sub.email,
      name: sub.name || undefined,
    }));

    const result = await this.brevoService.sendBulkEmail(
      subscriberEmails,
      newsletter.subject,
      newsletter.content,
    );

    if (!result.success) {
      await this.prisma.newsletter.update({
        where: { id: newsletterId },
        data: { status: 'FAILED' },
      });

      throw new BadRequestException(result.error || 'Failed to send newsletter');
    }

    // Update newsletter status
    const updatedNewsletter = await this.prisma.newsletter.update({
      where: { id: newsletterId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    this.logger.log(`Newsletter ${newsletterId} sent to ${subscribers.length} subscribers`);
    return updatedNewsletter;
  }

  /**
   * Get all newsletters
   */
  async getAllNewsletters() {
    return await this.prisma.newsletter.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get newsletter by ID
   */
  async getNewsletterById(id: string) {
    const newsletter = await this.prisma.newsletter.findUnique({
      where: { id },
    });

    if (!newsletter) {
      throw new BadRequestException('Newsletter not found');
    }

    return newsletter;
  }

  /**
   * Get subscriber count by status
   */
  async getSubscriberStats() {
    const [subscribed, unsubscribed, bounced, total] = await Promise.all([
      this.prisma.newsletterSubscriber.count({ where: { status: 'SUBSCRIBED' } }),
      this.prisma.newsletterSubscriber.count({
        where: { status: 'UNSUBSCRIBED' },
      }),
      this.prisma.newsletterSubscriber.count({ where: { status: 'BOUNCED' } }),
      this.prisma.newsletterSubscriber.count(),
    ]);

    return {
      subscribed,
      unsubscribed,
      bounced,
      total,
    };
  }
}
