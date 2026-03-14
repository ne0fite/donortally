import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend = new Resend(process.env.RESEND_API_KEY);

  async sendInvite(to: string, firstName: string, activationUrl: string): Promise<void> {
    await this.resend.emails.send({
      from: 'noreply@donortally.com',
      to,
      subject: "You've been invited to DonorTally",
      html: `
        <p>Hi ${firstName},</p>
        <p>You've been invited to join DonorTally. Click the link below to set your password and activate your account:</p>
        <p><a href="${activationUrl}">${activationUrl}</a></p>
        <p>This link expires in 7 days.</p>
      `,
    });
  }
}
