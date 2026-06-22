import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: `"Kanban Board" <${process.env.FROM_EMAIL}>`,
        to,
        subject,
        html,
      });
      console.log(`📧 Email sent to ${to}`);
    } catch (error) {
      console.error('❌ Failed to send email:', error);
    }
  }

  async sendProjectInvite(
    email: string,
    projectName: string,
    inviterName: string,
  ) {
    const subject = `You've been invited to ${projectName}`;
    const html = `
      <h2>You've been invited to a project!</h2>
      <p><strong>${inviterName}</strong> invited you to join the project: <strong>${projectName}</strong></p>
      <p>Log in to the Kanban board to accept and start collaborating.</p>
      <hr>
      <small>This is an automated email from your Kanban Board.</small>
    `;

    await this.sendEmail(email, subject, html);
  }

  async sendTicketAssignment(
    email: string,
    ticketTitle: string,
    projectName: string,
    assignedBy: string,
  ) {
    const subject = `You have been assigned to a ticket: ${ticketTitle}`;
    const html = `
      <h2>New Ticket Assignment</h2>
      <p>You have been assigned to the ticket: <strong>${ticketTitle}</strong></p>
      <p>Project: <strong>${projectName}</strong></p>
      <p>Assigned by: <strong>${assignedBy}</strong></p>
      <p>Please check the Kanban board for more details.</p>
      <hr>
      <small>This is an automated email.</small>
    `;

    await this.sendEmail(email, subject, html);
  }
}
