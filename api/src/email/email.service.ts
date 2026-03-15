import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { User } from '../models/user.model';

@Injectable()
export class EmailService {
  private readonly resend = new Resend(process.env.RESEND_API_KEY);
  private readonly activationEmailTemplateId = "donor-tally-activation-email";

  async sendInvite(to: string, sender: User, activationUrl: string): Promise<void> {
    await this.resend.emails.send({
      from: 'noreply@donortally.com',
      to,
      template: {
        id: this.activationEmailTemplateId,
        variables: {
          inviter_name: `${sender.firstName} ${sender.lastName}`,
          inviter_email: sender.email,
          organization_name: sender.organization.name,
          activation_link: activationUrl,
        }
      }
    });
  }
}
