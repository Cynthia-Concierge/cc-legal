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
    this.fromEmail = fromEmail || 'onboarding@resend.dev';
    this.adminEmail = process.env.ADMIN_EMAIL || adminEmail;

    // Log configuration on initialization
    console.log(`[EmailService] Initialized with fromEmail: ${this.fromEmail}`);
    if (this.fromEmail === 'onboarding@resend.dev') {
      console.warn(`[EmailService] ⚠️ WARNING: Using default 'onboarding@resend.dev' - this can only send TO the Resend account owner's email.`);
      console.warn(`[EmailService] ⚠️ To send to other users, you must verify a domain in Resend and set EMAIL_FROM_ADDRESS to an email on that domain.`);
    }
  }

  /**
   * Send a welcome email to a new user
   */
  async sendWelcomeEmail(email: string, name: string = ''): Promise<any> {
    try {
      console.log(`[EmailService] Sending welcome email:`);
      console.log(`[EmailService]   From: ${this.fromEmail}`);
      console.log(`[EmailService]   To: ${email}`);

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Welcome to Conscious Counsel! 🛡️',
        html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><!--$-->
<html dir="ltr" lang="en">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
  </head>
  <body
    style='background-color:rgb(243,244,246);margin-top:auto;margin-bottom:auto;margin-left:auto;margin-right:auto;font-family:ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'>
    <table
      border="0"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      align="center">
      <tbody>
        <tr>
          <td
            style='background-color:rgb(243,244,246);margin-top:auto;margin-bottom:auto;margin-left:auto;margin-right:auto;font-family:ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'>
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="border-width:1px;border-style:solid;border-color:rgb(234,234,234);border-radius:0.25rem;margin-top:40px;margin-bottom:40px;margin-left:auto;margin-right:auto;padding:20px;max-width:465px;background-color:rgb(255,255,255)">
              <tbody>
                <tr style="width:100%">
                  <td>
                    <table
                      align="center"
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="margin-top:32px;margin-bottom:32px">
                      <tbody>
                        <tr>
                          <td>
                            <p
                              style="color:rgb(0,0,0);font-size:24px;font-weight:700;text-align:center;padding:0px;margin-top:0px;margin-bottom:0px;margin-left:auto;margin-right:auto;line-height:24px">
                              Conscious Counsel
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <p
                      style="color:rgb(0,0,0);font-size:14px;line-height:24px;margin-top:16px;margin-bottom:16px">
                      Hi ${name || 'there'},
                    </p>
                    <p
                      style="color:rgb(0,0,0);font-size:14px;line-height:24px;margin-top:16px;margin-bottom:16px">
                      We&#x27;re thrilled you&#x27;re here! Your account is all
                      set up, and you&#x27;re just a few steps away from having
                      bulletproof legal protection for your wellness business.
                    </p>
                    <table
                      align="center"
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation">
                      <tbody>
                        <tr>
                          <td>
                            <p
                              style="color:rgb(0,0,0);font-size:14px;line-height:24px;font-weight:700;margin-top:16px;margin-bottom:16px">
                              Here&#x27;s what you can do right now:
                            </p>
                            <ul
                              style="color:rgb(0,0,0);font-size:14px;line-height:24px;padding-left:1.25rem;margin-top:0px">
                              <li style="margin-bottom:0.5rem">
                                <strong>Complete your business profile</strong>
                                – Tell us about your services so we can
                                personalize everything for you
                              </li>
                              <li style="margin-bottom:0.5rem">
                                <strong>Scan your website</strong> – We&#x27;ll
                                analyze your site and identify any legal gaps or
                                risks
                              </li>
                              <li style="margin-bottom:0.5rem">
                                <strong>Generate personalized documents</strong>
                                – Get custom legal documents tailored to your
                                business
                              </li>
                              <li style="margin-bottom:0.5rem">
                                <strong>Check your legal health score</strong> –
                                See how protected your business is and what to
                                improve
                              </li>
                            </ul>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <p
                      style="color:rgb(0,0,0);font-size:14px;line-height:24px;margin-top:16px;margin-bottom:16px">
                      Everything is designed to be simple and straightforward.
                      No legal jargon, no confusion—just clear protection for
                      your business so you can focus on what you do best.
                    </p>
                    <table
                      align="center"
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="text-align:center;margin-top:32px;margin-bottom:32px">
                      <tbody>
                        <tr>
                          <td>
                            <a
                              href="https://free.consciouscounsel.ca/wellness/dashboard"
                              style="background-color:rgb(20,184,166);border-radius:0.25rem;color:rgb(255,255,255);font-size:12px;font-weight:600;text-decoration-line:none;text-align:center;padding-left:20px;padding-right:20px;padding-top:12px;padding-bottom:12px;line-height:100%;text-decoration:none;display:inline-block;max-width:100%;mso-padding-alt:0px"
                              target="_blank"
                              ><span
                                ><!--[if mso
                                  ]><i
                                    style="mso-font-width:500%;mso-text-raise:18"
                                    hidden
                                    >&#8202;&#8202;</i><!
                                [endif]--></span
                              ><span
                                style="max-width:100%;display:inline-block;line-height:120%;mso-padding-alt:0px;mso-text-raise:9px"
                                >Go to Your Dashboard</span
                              ><span
                                ><!--[if mso
                                  ]><i style="mso-font-width:500%" hidden
                                    >&#8202;&#8202;&#8203;</i><!
                                [endif]--></span
                              ></a
                            >
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <table
                      align="center"
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="background-color:rgb(249,250,251);padding:1rem;border-radius:0.375rem;border-width:1px;border-color:rgb(243,244,246);margin-bottom:24px">
                      <tbody>
                        <tr>
                          <td>
                            <p
                              style="color:rgb(0,0,0);font-size:14px;line-height:24px;margin:0px;margin-top:0px;margin-bottom:0px;margin-left:0px;margin-right:0px">
                              <strong>💡 Quick tip:</strong><br />Start by
                              completing your business profile. The more we know
                              about your business, the better we can protect you
                              with personalized legal documents.
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <p
                      style="color:rgb(0,0,0);font-size:14px;line-height:24px;margin-top:16px;margin-bottom:16px">
                      If you have any questions or need help getting started,
                      please email us
                      <a
                        href="mailto:chad@consciouscounsel.ca"
                        style="color:rgb(13,148,136);text-decoration-line:underline"
                        target="_blank"
                        >here</a
                      >. We&#x27;re here to help you every step of the way.
                    </p>
                    <p
                      style="color:rgb(0,0,0);font-size:14px;line-height:24px;margin-top:24px;margin-bottom:16px">
                      Welcome aboard!
                    </p>
                    <p
                      style="color:rgb(0,0,0);font-size:14px;line-height:24px;font-weight:700;margin-top:16px;margin-bottom:16px">
                      The Conscious Counsel Team
                    </p>
                    <hr
                      style="border-width:1px;border-style:solid;border-color:rgb(234,234,234);margin-top:26px;margin-bottom:26px;margin-left:0px;margin-right:0px;width:100%;border:none;border-top:1px solid #eaeaea" />
                    <p
                      style="color:rgb(102,102,102);font-size:12px;line-height:24px;text-align:center;margin-top:16px;margin-bottom:16px">
                      Need help?
                      <a
                        href="mailto:chad@consciouscounsel.ca"
                        style="color:rgb(13,148,136);text-decoration-line:underline"
                        target="_blank"
                        >Email us here</a
                      >
                      (chad@consciouscounsel.ca)
                    </p>
                    <p
                      style="color:rgb(102,102,102);font-size:12px;line-height:24px;text-align:center;margin-top:16px;margin-bottom:16px">
                      ©
                      ${new Date().getFullYear()}
                      Conscious Counsel. All rights reserved.
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>
<!--/$-->`
      });

      console.log('[EmailService] Email sent successfully:', result);
      return result;
    } catch (error: any) {
      console.error('[EmailService] ===== ERROR SENDING WELCOME EMAIL =====');
      console.error('[EmailService] Error details:', {
        message: error?.message,
        name: error?.name,
        status: error?.status,
        statusCode: error?.statusCode,
        response: error?.response,
      });

      // Log full error object if available
      if (error?.response) {
        console.error('[EmailService] Resend API error response:', JSON.stringify(error.response, null, 2));
      }

      // Check for common Resend errors
      if (error?.message?.includes('403') || error?.status === 403 || error?.statusCode === 403) {
        console.error('[EmailService] ⚠️ 403 Forbidden Error - This usually means:');
        console.error('[EmailService]   1. The FROM domain is not verified in Resend');
        console.error('[EmailService]   2. You are using "onboarding@resend.dev" which can only send TO the account owner');
        console.error('[EmailService]   3. The API key does not have permission to send from this domain');
        console.error('[EmailService]   Solution: Verify your domain in Resend Dashboard → Domains');
        console.error('[EmailService]   Then set EMAIL_FROM_ADDRESS to an email on the verified domain (e.g., hello@yourdomain.com)');
      }

      console.error('[EmailService] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      throw error;
    }
  }

  /**
   * Send a profile completion reminder email
   */
  async sendProfileCompletionReminder(email: string, name?: string): Promise<any> {
    try {
      console.log(`[EmailService] Sending profile completion reminder:`);
      console.log(`[EmailService]   From: ${this.fromEmail}`);
      console.log(`[EmailService]   To: ${email}`);

      // Import and render the React Email component
      const { render } = await import('@react-email/render');
      const { ProfileCompletionReminderEmail } = await import('../../src/emails/ProfileCompletionReminderEmail.js');

      const profileLink = process.env.DASHBOARD_URL ||
        (process.env.NODE_ENV === 'production'
          ? 'https://free.consciouscounsel.ca/wellness/dashboard/profile'
          : 'http://localhost:5173/wellness/dashboard/profile');

      const emailHtml = await render(
        ProfileCompletionReminderEmail({
          name: name, // Template will use 'there' as fallback if name is undefined
          profileLink: profileLink
        })
      );

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Quick question about your business...',
        html: emailHtml,
      });

      console.log('[EmailService] Profile completion reminder sent successfully:', result);
      return result;
    } catch (error: any) {
      console.error('[EmailService] ===== ERROR SENDING PROFILE COMPLETION REMINDER =====');
      console.error('[EmailService] Error details:', {
        message: error?.message,
        status: error?.status,
        statusCode: error?.statusCode,
        response: error?.response,
      });
      if (error?.response) {
        console.error('[EmailService] Resend API error response:', JSON.stringify(error.response, null, 2));
      }
      throw error;
    }
  }

  /**
   * Send a website scan reminder email
   */
  async sendWebsiteScanReminder(email: string, name?: string): Promise<any> {
    try {
      console.log(`[EmailService] Sending website scan reminder:`);
      console.log(`[EmailService]   From: ${this.fromEmail}`);
      console.log(`[EmailService]   To: ${email}`);

      // Import and render the React Email component
      const { render } = await import('@react-email/render');
      const { WebsiteScanReminderEmail } = await import('../../src/emails/WebsiteScanReminderEmail.js');

      const scanLink = process.env.DASHBOARD_URL ||
        (process.env.NODE_ENV === 'production'
          ? 'https://free.consciouscounsel.ca/wellness/dashboard'
          : 'http://localhost:5173/wellness/dashboard');

      const emailHtml = await render(
        WebsiteScanReminderEmail({
          name: name, // Template will use 'there' as fallback if name is undefined
          scanLink: scanLink
        })
      );

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Found something on your website...',
        html: emailHtml,
      });

      console.log('[EmailService] Website scan reminder sent successfully:', result);
      return result;
    } catch (error: any) {
      console.error('[EmailService] ===== ERROR SENDING WEBSITE SCAN REMINDER =====');
      console.error('[EmailService] Error details:', {
        message: error?.message,
        status: error?.status,
        statusCode: error?.statusCode,
        response: error?.response,
      });
      if (error?.response) {
        console.error('[EmailService] Resend API error response:', JSON.stringify(error.response, null, 2));
      }
      throw error;
    }
  }

  /**
   * Send an admin alert when a new user signs up
   */
  async sendAdminAlert(userEmail: string, userName?: string): Promise<any> {
    // Disabled per user request
    console.log(`[EmailService] Admin alert disabled. Not sending alert for: ${userEmail}`);
    return Promise.resolve({ id: 'skipped_disabled', message: 'Admin alert disabled' });
  }

  /**
   * Send personalized Legal Health Score email
   */
  async sendLegalHealthScoreEmail(
    email: string,
    userData: {
      name?: string;
      businessName?: string;
      businessType?: string;
      score: number;
      riskLevel: 'Low' | 'Moderate' | 'High';
      hasPhysicalMovement?: boolean;
      hostsRetreats?: boolean;
      hiresStaff?: boolean;
      collectsOnline?: boolean;
      usesPhotos?: boolean;
    }
  ): Promise<any> {
    try {
      console.log(`[EmailService] Sending Legal Health Score email:`);
      console.log(`[EmailService]   From: ${this.fromEmail}`);
      console.log(`[EmailService]   To: ${email}`);
      console.log(`[EmailService]   Score: ${userData.score}, Risk: ${userData.riskLevel}`);

      // Import and render the React Email component
      const { render } = await import('@react-email/render');
      const { LegalHealthScoreEmail } = await import('../../src/emails/LegalHealthScoreEmail.js');

      const dashboardLink = process.env.DASHBOARD_URL ||
        (process.env.NODE_ENV === 'production'
          ? 'https://free.consciouscounsel.ca/wellness/dashboard'
          : 'http://localhost:5173/wellness/dashboard');

      const calendlyLink = 'https://calendly.com/chad-consciouscounsel/connection-call-with-chad';

      const emailHtml = await render(
        LegalHealthScoreEmail({
          name: userData.name,
          businessName: userData.businessName,
          businessType: userData.businessType,
          score: userData.score,
          riskLevel: userData.riskLevel,
          hasPhysicalMovement: userData.hasPhysicalMovement,
          hostsRetreats: userData.hostsRetreats,
          hiresStaff: userData.hiresStaff,
          collectsOnline: userData.collectsOnline,
          usesPhotos: userData.usesPhotos,
          dashboardLink: dashboardLink,
          calendlyLink: calendlyLink,
        })
      );

      // Dynamic subject line based on risk level
      let subject = 'Your Legal Health Score is ready';
      if (userData.riskLevel === 'High') {
        subject = `${userData.name || 'Hi'}, your business has ${userData.score} risk points`;
      } else if (userData.riskLevel === 'Moderate') {
        subject = `Your Legal Health Score: ${userData.score}/100`;
      } else {
        subject = 'Good news about your legal protection';
      }

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: subject,
        html: emailHtml,
      });

      console.log('[EmailService] Legal Health Score email sent successfully:', result);
      return result;
    } catch (error: any) {
      console.error('[EmailService] ===== ERROR SENDING LEGAL HEALTH SCORE EMAIL =====');
      console.error('[EmailService] Error details:', {
        message: error?.message,
        status: error?.status,
        statusCode: error?.statusCode,
        response: error?.response,
      });
      if (error?.response) {
        console.error('[EmailService] Resend API error response:', JSON.stringify(error.response, null, 2));
      }
      throw error;
    }
  }

  /**
   * Send trademark risk report to user with PDF attachment
   */
  async sendTrademarkRiskReport(
    email: string,
    name: string,
    businessName: string,
    riskLevel: string,
    score: number,
    pdfBuffer?: Buffer
  ): Promise<any> {
    try {
      console.log(`[EmailService] Sending trademark risk report:`);
      console.log(`[EmailService]   To: ${email}`);

      const subject = `Your Trademark Risk Snapshot for ${businessName}`;

      const riskLevelColor = riskLevel.includes('HIGH') ? '#ef4444' :
        riskLevel.includes('MODERATE') ? '#f59e0b' : '#10b981';

      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">Hi ${name || 'there'},</h1>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Based on your responses, we've created a <strong>Preliminary Trademark Risk Snapshot</strong> for your brand.
          </p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            This report highlights potential risk factors to consider before investing further in branding or expansion.
          </p>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${riskLevelColor};">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #1a1a1a;">Your Risk Assessment:</p>
            <p style="margin: 5px 0; color: #555;">
              <strong>Risk Level:</strong> 
              <span style="color: ${riskLevelColor}; font-weight: bold;">${riskLevel}</span>
            </p>
            <p style="margin: 5px 0; color: #555;">
              <strong>Risk Score:</strong> ${score}/40
            </p>
          </div>

          ${pdfBuffer ? `
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #14b8a6; color: white; padding: 16px 32px; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              📄 Your Trademark Risk Report (PDF)
            </div>
          </div>
          <div style="background-color: #f0f9ff; border: 2px solid #14b8a6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #1a1a1a; font-size: 15px; font-weight: bold; margin: 0 0 10px 0; text-align: center;">
              📎 PDF Attachment Included
            </p>
            <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0; text-align: center;">
              Your <strong>Trademark Risk Report PDF</strong> is attached to this email. 
              Look for the attachment icon (📎) in your email client to download it.
            </p>
            <p style="color: #666; font-size: 13px; margin: 15px 0 0 0; text-align: center; font-style: italic;">
              The file is named: <code style="background: white; padding: 2px 6px; border-radius: 4px; font-size: 12px;">Trademark-Risk-Report-${businessName.replace(/[^a-zA-Z0-9]/g, '-')}.pdf</code>
            </p>
          </div>
          ` : ''}

          <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #856404; line-height: 1.6;">
              <strong>Important:</strong> This is a preliminary screening based on business and branding factors. 
              It is not a legal opinion, does not constitute legal advice, and does not include a comprehensive 
              search of USPTO, WIPO, or state trademark databases.
            </p>
          </div>

          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-top: 30px;">
            If you'd like, we can also run a full attorney-led trademark search and walk you through next steps.
          </p>

          <p style="color: #1a1a1a; margin-top: 30px;">
            Best,<br>
            <strong>The Conscious Counsel Team</strong>
          </p>
        </div>
      `;

      // Format from address with brand name
      const fromAddress = this.fromEmail.includes('@')
        ? `Conscious Counsel <${this.fromEmail}>`
        : this.fromEmail;

      const emailOptions: any = {
        from: fromAddress,
        to: email,
        subject: subject,
        html: html,
      };

      // Add PDF attachment if provided
      if (pdfBuffer) {
        emailOptions.attachments = [
          {
            filename: `Trademark-Risk-Report-${businessName.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`,
            content: pdfBuffer,
          }
        ];
      }

      const result = await this.resend.emails.send(emailOptions);

      console.log('[EmailService] Trademark risk report sent:', result);
      return result;
    } catch (error: any) {
      console.error('[EmailService] Error sending trademark risk report:', error);
      // Don't throw, just log
    }
  }

  /**
   * Send onboarding package with 3 free documents
   */
  async sendOnboardingPackageEmail(
    email: string,
    name: string,
    documents: { filename: string; content: Buffer }[]
  ): Promise<any> {
    try {
      console.log(`[EmailService] Sending onboarding package:`);
      console.log(`[EmailService]   To: ${email}`);
      console.log(`[EmailService]   Attachments: ${documents.length}`);

      const subject = `Your Free Legal Documents are Ready! 📄`;

      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">Hi ${name || 'there'},</h1>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Congratulations on taking the first step towards protecting your wellness business!
          </p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            We've automatically generated your three free essential legal documents based on your profile. They are attached to this email as PDFs, ready for you to use.
          </p>

          <div style="background-color: #f0f9ff; border: 2px solid #14b8a6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #1a1a1a; font-size: 15px; font-weight: bold; margin: 0 0 10px 0; text-align: center;">
              📎 3 Documents Attached
            </p>
            <ul style="color: #555; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 5px;"><strong>Social Media Disclaimer</strong> - Protects your content liability</li>
              <li style="margin-bottom: 5px;"><strong>Photo Release Form</strong> - For using client photos legally</li>
              <li><strong>Client Intake Form</strong> - Essential client onboarding</li>
            </ul>
             <p style="color: #666; font-size: 13px; margin: 15px 0 0 0; text-align: center;">
              Look for the attachments in your email client.
            </p>
          </div>

          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            <strong>What about the rest?</strong><br/>
            You have other recommended documents that require more care (like Waivers and Service Agreements). You can finalize these in your <a href="https://free.consciouscounsel.ca/wellness/dashboard">Legal Dashboard</a>.
          </p>

          <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="text-align:center;margin-top:32px;margin-bottom:32px">
            <tbody>
              <tr>
                <td>
                  <a href="https://free.consciouscounsel.ca/wellness/dashboard" style="background-color:rgb(20,184,166);border-radius:0.25rem;color:rgb(255,255,255);font-size:16px;font-weight:600;text-decoration-line:none;text-align:center;padding:12px 24px;display:inline-block;">
                    Go to Dashboard
                  </a>
                </td>
              </tr>
            </tbody>
          </table>

          <p style="color: #1a1a1a; margin-top: 30px;">
            Best,<br>
            <strong>The Conscious Counsel Team</strong>
          </p>
        </div>
      `;

      // Format from address
      const fromAddress = this.fromEmail.includes('@')
        ? `Conscious Counsel <${this.fromEmail}>`
        : this.fromEmail;

      const result = await this.resend.emails.send({
        from: fromAddress,
        to: email,
        subject: subject,
        html: html,
        attachments: documents // { filename, content } objects
      });

      console.log('[EmailService] Onboarding package sent:', result);
      return result;
    } catch (error: any) {
      console.error('[EmailService] Error sending onboarding package:', error);
      throw error;
    }
  }

  /**
   * Send trademark search confirmation to user (legacy method - kept for backward compatibility)
   */
  async sendTrademarkConfirmation(email: string, name: string, businessName: string, riskLevel: string, score: number): Promise<any> {
    // Redirect to new method
    return this.sendTrademarkRiskReport(email, name, businessName, riskLevel, score);
  }

  /**
   * Send admin alert for new trademark request
   */
  async sendAdminTrademarkAlert(userEmail: string, businessName: string, riskLevel: string, score: number): Promise<any> {
    if (!this.adminEmail) {
      console.log('[EmailService] No admin email configured, skipping alert');
      return;
    }

    try {
      const subject = `[NEW LEAD] Trademark Risk Report: ${businessName}`;
      const html = `
            <div style="font-family: sans-serif;">
              <h2>New Trademark Risk Report Request</h2>
              <p><strong>Business Name:</strong> ${businessName}</p>
              <p><strong>User Email:</strong> ${userEmail}</p>
              <p><strong>Risk Level:</strong> ${riskLevel}</p>
              <p><strong>Quiz Score:</strong> ${score}</p>
              <br>
              <p><a href="mailto:${userEmail}">Click to email user</a></p>
            </div>
          `;

      const result = await this.resend.emails.send({
        from: 'admin-alerts@consciouscounsel.ca', // Or use fromEmail if domain verified, but often alerts come from system
        to: this.adminEmail,
        subject: subject,
        html: html,
      });

      console.log('[EmailService] Admin trademark alert sent:', result);
      return result;
    } catch (error) {
      console.error('[EmailService] Error sending admin trademark alert:', error);
    }
  }
}
