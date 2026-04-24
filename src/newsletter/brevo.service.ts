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
export class BrevoService {
  private readonly logger = new Logger(BrevoService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.brevo.com/v3';
  private readonly personalEmail: string;
  private readonly personalName: string = 'Newsletter';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('BREVO_API_KEY');
    this.personalEmail = this.configService.get<string>('PERSONAL_EMAIL') || '';

    if (!this.apiKey) {
      this.logger.error('BREVO_API_KEY is not configured');
    }
    if (!this.personalEmail) {
      this.logger.warn('PERSONAL_EMAIL is not configured');
    }
  }

  async sendEmail(
    to: { email: string; name?: string }[],
    subject: string,
    htmlContent: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
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

      const response = await fetch(`${this.baseUrl}/smtp/email`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': this.apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        this.logger.error('Brevo API error:', error);
        return {
          success: false,
          error: error.message || 'Failed to send email',
        };
      }

      const result = await response.json();
      this.logger.log(`Email sent successfully with ID: ${result.messageId}`);

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      this.logger.error('Error sending email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendBulkEmail(
    subscribers: { email: string; name?: string }[],
    subject: string,
    htmlContent: string,
  ): Promise<{ success: boolean; sentCount?: number; error?: string }> {
    try {
      const payload = {
        messageVersions: subscribers.map((subscriber) => ({
          to: [subscriber],
          subject,
          htmlContent,
        })),
        sender: {
          email: this.personalEmail,
          name: this.personalName,
        },
        replyTo: {
          email: this.personalEmail,
          name: this.personalName,
        },
      };

      const response = await fetch(`${this.baseUrl}/smtp/email`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': this.apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        this.logger.error('Brevo bulk email API error:', error);
        return {
          success: false,
          error: error.message || 'Failed to send bulk emails',
        };
      }

      this.logger.log(
        `Bulk emails sent successfully to ${subscribers.length} subscribers`,
      );

      return {
        success: true,
        sentCount: subscribers.length,
      };
    } catch (error) {
      this.logger.error('Error sending bulk emails:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getContacts(limit: number = 50, offset: number = 0): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/contacts?limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'api-key': this.apiKey,
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to get contacts');
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Error getting contacts:', error);
      throw error;
    }
  }

  async validateEmail(email: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/email/checker?email=${encodeURIComponent(email)}`,
        {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'api-key': this.apiKey,
          },
        },
      );

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      return result.isValidFormat;
    } catch (error) {
      this.logger.error('Error validating email:', error);
      return false;
    }
  }
}
