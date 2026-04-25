import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SendSmtpEmail {
  to: { email: string; name?: string }[];
  sender: { email: string; name: string };
  subject: string;
  htmlContent: string;
  replyTo: { email: string; name: string };
}

@Injectable()
export class BrevoContactService {
  private readonly logger = new Logger(BrevoContactService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.brevo.com/v3';
  private readonly personalEmail: string;
  private readonly personalName: string = 'CIS Vitrine';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('BREVO_API_KEY') || '';
    this.personalEmail = this.configService.get<string>('PERSONAL_EMAIL') || '';

    this.logger.log(`Brevo Service initialized`);
    this.logger.log(`API Key configured: ${this.apiKey ? 'YES' : 'NO'}`);
    this.logger.log(`Personal Email: ${this.personalEmail}`);

    if (!this.apiKey) {
      this.logger.error('⚠️ BREVO_API_KEY is not configured in .env file!');
    }
    if (!this.personalEmail) {
      this.logger.error('⚠️ PERSONAL_EMAIL is not configured in .env file!');
    }
  }

  async sendEmail(
    to: { email: string; name?: string }[],
    subject: string,
    htmlContent: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.apiKey) {
        this.logger.error('Cannot send email: BREVO_API_KEY not configured');
        return {
          success: false,
          error: 'Brevo API key not configured',
        };
      }

      if (!this.personalEmail) {
        this.logger.error('Cannot send email: PERSONAL_EMAIL not configured');
        return {
          success: false,
          error: 'Personal email not configured',
        };
      }

      const payload: SendSmtpEmail = {
        to,
        sender: {
          email: this.personalEmail,
          name: this.personalName,
        },
        subject,
        htmlContent,
        replyTo: {
          email: this.personalEmail,
          name: this.personalName,
        },
      };

      this.logger.log(`Sending email to: ${to.map((t) => t.email).join(', ')}`);
      this.logger.log(`Subject: ${subject}`);

      const response = await fetch(`${this.baseUrl}/smtp/email`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': this.apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        this.logger.error('Brevo API error:', responseData);
        return {
          success: false,
          error: responseData.message || 'Failed to send email',
        };
      }

      this.logger.log(`✅ Email sent successfully. Message ID: ${responseData.messageId}`);

      return {
        success: true,
        messageId: responseData.messageId,
      };
    } catch (error) {
      this.logger.error('❌ Error sending email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
