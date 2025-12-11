/**
 * Email Service
 * Handles sending transactional emails using Resend
 */

import { Resend } from 'resend';

export class EmailService {
    private resend: Resend;
    private fromEmail: string;
    private adminEmail: string;

    constructor(apiKey: string, fromEmail: string = 'onboarding@resend.dev', adminEmail: string = 'rickibodner@gmail.com') {
        this.resend = new Resend(apiKey);
        this.fromEmail = fromEmail;
        this.adminEmail = process.env.ADMIN_EMAIL || adminEmail;
    }

    /**
     * Send a welcome email to a new user
     */
    async sendWelcomeEmail(email: string, name?: string): Promise<any> {
        try {
            console.log(`[EmailService] Sending welcome email to: ${email}`);

            const result = await this.resend.emails.send({
                from: this.fromEmail,
                to: email,
                subject: 'Welcome to CC Legal!',
                html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Welcome to CC Legal!</h1>
            <p>Hi ${name || 'there'},</p>
            <p>We're excited to help you customize your wellness legal documents.</p>
            <p>Your account has been created successfully.</p>
            <br/>
            <p>Best regards,</p>
            <p>The CC Legal Team</p>
          </div>
        `
            });

            console.log('[EmailService] Email sent successfully:', result);
            return result;
        } catch (error: any) {
            console.error('[EmailService] Error sending welcome email:', error);
            throw error;
        }
    }

    /**
     * Send an admin alert when a new user signs up
     */
    async sendAdminAlert(userEmail: string, userName?: string): Promise<any> {
        try {
            console.log(`[EmailService] Sending admin alert for: ${userEmail}`);

            const result = await this.resend.emails.send({
                from: this.fromEmail,
                to: this.adminEmail,
                subject: `New User Signup: ${userEmail}`,
                html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New User Signup</h2>
            <p><strong>Email:</strong> ${userEmail}</p>
            <p><strong>Name:</strong> ${userName || 'N/A'}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <br/>
            <p>Check Supabase for full details.</p>
          </div>
        `
            });

            console.log('[EmailService] Admin alert sent successfully:', result);
            return result;
        } catch (error: any) {
            console.error('[EmailService] Error sending admin alert:', error);
            // Don't throw - admin alert failure shouldn't block user flow
            return null;
        }
    }
}
