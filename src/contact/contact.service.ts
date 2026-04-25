import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BrevoContactService } from './brevo.service';
import { CreateContactDto, ContactResponseDto } from './contact.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly brevoService: BrevoContactService,
  ) {}

  async create(createContactDto: CreateContactDto): Promise<ContactResponseDto> {
    const contact = await this.prisma.contact.create({
      data: {
        name: createContactDto.name,
        email: createContactDto.email,
        phone: createContactDto.phone || null,
        company: createContactDto.company || null,
        subject: createContactDto.subject,
        message: createContactDto.message,
      },
    });

    // Envoyer les emails
    await this.sendContactEmails(contact);

    return this.mapToResponse(contact);
  }

  async findAll(): Promise<ContactResponseDto[]> {
    const contacts = await this.prisma.contact.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return contacts.map((contact) => this.mapToResponse(contact));
  }

  async findOne(id: string): Promise<ContactResponseDto> {
    const contact = await this.prisma.contact.findUnique({ where: { id } });

    if (!contact) {
      throw new Error('Contact not found');
    }

    return this.mapToResponse(contact);
  }

  private async sendContactEmails(contact: any): Promise<void> {
    try {
      // Email de confirmation au visiteur
      const visitorEmailTemplate = this.getVisitorEmailTemplate(contact);
      const visitorResult = await this.brevoService.sendEmail(
        [{ email: contact.email, name: contact.name }],
        'Confirmation de votre message - CIS Vitrine',
        visitorEmailTemplate,
      );

      if (visitorResult.success) {
        this.logger.log(`✅ Visitor confirmation email sent to ${contact.email}`);
      } else {
        this.logger.error(`❌ Failed to send visitor email: ${visitorResult.error}`);
      }

      // Email de notification à l'administrateur
      const adminEmail = process.env.PERSONAL_EMAIL;
      if (adminEmail) {
        const adminEmailTemplate = this.getAdminEmailTemplate(contact);
        const adminResult = await this.brevoService.sendEmail(
          [{ email: adminEmail, name: 'CIS Vitrine Admin' }],
          `Nouveau message de contact de ${contact.name}`,
          adminEmailTemplate,
        );

        if (adminResult.success) {
          this.logger.log(`✅ Admin notification email sent to ${adminEmail}`);
        } else {
          this.logger.error(`❌ Failed to send admin email: ${adminResult.error}`);
        }
      } else {
        this.logger.warn('⚠️ PERSONAL_EMAIL not configured - admin notification not sent');
      }
    } catch (error) {
      this.logger.error(`❌ Error in sendContactEmails: ${error.message}`);
    }
  }

  private getVisitorEmailTemplate(contact: any): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
            .header { background-color: #1976d2; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background-color: white; padding: 20px; }
            .footer { background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
            .highlight { background-color: #e3f2fd; padding: 15px; border-left: 4px solid #1976d2; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Merci pour votre message ✓</h1>
            </div>
            <div class="content">
              <p>Bonjour <strong>${contact.name}</strong>,</p>
              <p>Nous avons bien reçu votre message et vous remercions de nous avoir contactés.</p>
              
              <div class="highlight">
                <h3>Récapitulatif de votre message :</h3>
                <p><strong>Sujet :</strong> ${contact.subject}</p>
                <p><strong>Email :</strong> ${contact.email}</p>
                ${contact.phone ? `<p><strong>Téléphone :</strong> ${contact.phone}</p>` : ''}
                ${contact.company ? `<p><strong>Entreprise :</strong> ${contact.company}</p>` : ''}
              </div>

              <p>Notre équipe examinera votre message et vous recontactera dans les plus brefs délais, généralement dans un délai de 24 heures pendant les jours ouvrables.</p>
              
              <p>Si vous avez besoin d'une réponse immédiate, n'hésitez pas à nous appeler directement.</p>
              
              <p>Cordialement,<br><strong>L'équipe CIS Vitrine</strong></p>
            </div>
            <div class="footer">
              <p>© 2026 CIS Vitrine. Tous droits réservés.</p>
              <p>Cet email a été envoyé à ${contact.email}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getAdminEmailTemplate(contact: any): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
            .header { background-color: #d32f2f; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background-color: white; padding: 20px; }
            .footer { background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
            .field { margin: 15px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
            .field-label { font-weight: bold; color: #d32f2f; }
            .message-box { background-color: #fafafa; padding: 15px; border-left: 4px solid #d32f2f; margin: 20px 0; }
            .action-button { display: inline-block; background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 Nouveau Message de Contact</h1>
            </div>
            <div class="content">
              <p>Vous avez reçu un nouveau message de contact de la part d'un visiteur.</p>
              
              <div class="field">
                <div class="field-label">Nom :</div>
                <p>${contact.name}</p>
              </div>

              <div class="field">
                <div class="field-label">Email :</div>
                <p><a href="mailto:${contact.email}">${contact.email}</a></p>
              </div>

              ${contact.phone ? `
              <div class="field">
                <div class="field-label">Téléphone :</div>
                <p>${contact.phone}</p>
              </div>
              ` : ''}

              ${contact.company ? `
              <div class="field">
                <div class="field-label">Entreprise :</div>
                <p>${contact.company}</p>
              </div>
              ` : ''}

              <div class="field">
                <div class="field-label">Sujet :</div>
                <p>${contact.subject}</p>
              </div>

              <div class="message-box">
                <div class="field-label">Message :</div>
                <p>${contact.message.replace(/\n/g, '<br>')}</p>
              </div>

              <div class="field">
                <div class="field-label">Date de réception :</div>
                <p>${new Date(contact.createdAt).toLocaleString('fr-FR')}</p>
              </div>

              <p>Assurez-vous de répondre à ce message dès que possible.</p>
            </div>
            <div class="footer">
              <p>© 2026 CIS Vitrine Admin. Tous droits réservés.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private mapToResponse(contact: any): ContactResponseDto {
    return {
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone || undefined,
      company: contact.company || undefined,
      subject: contact.subject,
      message: contact.message,
      createdAt: contact.createdAt,
    };
  }
}

