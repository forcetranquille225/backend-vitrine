import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { SubscribeDto, SendNewsletterDto } from './dto/newsletter.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  /**
   * Subscribe to newsletter (public endpoint)
   */
  @Post('subscribe')
  @HttpCode(HttpStatus.CREATED)
  async subscribe(@Body() subscribeDto: SubscribeDto) {
    const subscriber = await this.newsletterService.subscribe(subscribeDto);
    return {
      success: true,
      message: 'Subscription successful',
      data: subscriber,
    };
  }

  /**
   * Unsubscribe from newsletter (public endpoint)
   */
  @Post('unsubscribe')
  @HttpCode(HttpStatus.OK)
  async unsubscribe(@Body('email') email: string) {
    await this.newsletterService.unsubscribe(email);
    return {
      success: true,
      message: 'Unsubscription successful',
    };
  }

  /**
   * Get all subscribers (protected)
   */
  @Get('subscribers')
  @UseGuards(JwtAuthGuard)
  async getSubscribers() {
    const subscribers = await this.newsletterService.getAllSubscribers();
    return {
      success: true,
      data: subscribers,
      count: subscribers.length,
    };
  }

  /**
   * Get subscriber statistics (protected)
   */
  @Get('subscribers/stats')
  @UseGuards(JwtAuthGuard)
  async getSubscriberStats() {
    const stats = await this.newsletterService.getSubscriberStats();
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Delete subscriber (protected)
   */
  @Delete('subscribers/:email')
  @UseGuards(JwtAuthGuard)
  async deleteSubscriber(@Param('email') email: string) {
    await this.newsletterService.unsubscribe(email);
    return {
      success: true,
      message: 'Subscriber deleted',
    };
  }

  /**
   * Create and send newsletter (protected)
   */
  @Post('send')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async sendNewsletter(@Body() sendNewsletterDto: SendNewsletterDto) {
    const newsletter = await this.newsletterService.createAndSendNewsletter(
      sendNewsletterDto,
    );
    return {
      success: true,
      message: sendNewsletterDto.sendImmediately
        ? 'Newsletter sent successfully'
        : 'Newsletter created as draft',
      data: newsletter,
    };
  }

  /**
   * Send a scheduled newsletter (protected)
   */
  @Post(':id/send')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async scheduledSend(@Param('id') newsletterId: string) {
    const newsletter = await this.newsletterService.sendNewsletter(newsletterId);
    return {
      success: true,
      message: 'Newsletter sent successfully',
      data: newsletter,
    };
  }

  /**
   * Get all newsletters (protected)
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getNewsletters() {
    const newsletters = await this.newsletterService.getAllNewsletters();
    return {
      success: true,
      data: newsletters,
      count: newsletters.length,
    };
  }

  /**
   * Get newsletter by ID (protected)
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getNewsletter(@Param('id') id: string) {
    const newsletter = await this.newsletterService.getNewsletterById(id);
    return {
      success: true,
      data: newsletter,
    };
  }
}
