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
  async sendWelcomeEmail(email: string, name: string = ''): Promise<any> {
    try {
      console.log(`[EmailService] Sending welcome email to: ${email}`);

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
                              href="https://cynthiaconcierge.com/dashboard"
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
      console.error('[EmailService] Error sending welcome email:', error);
      throw error;
    }
  }

  /**
   * Send a profile completion reminder email
   */
  async sendProfileCompletionReminder(email: string, name?: string): Promise<any> {
    try {
      console.log(`[EmailService] Sending profile completion reminder to: ${email}`);

      // Import and render the React Email component
      const { render } = await import('@react-email/render');
      const { ProfileCompletionReminderEmail } = await import('../../src/emails/ProfileCompletionReminderEmail.js');

      const profileLink = process.env.DASHBOARD_URL || 
        (process.env.NODE_ENV === 'production' 
          ? 'https://cynthiaconcierge.com/wellness/dashboard/profile'
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
      console.error('[EmailService] Error sending profile completion reminder:', error);
      throw error;
    }
  }

  /**
   * Send a website scan reminder email
   */
  async sendWebsiteScanReminder(email: string, name?: string): Promise<any> {
    try {
      console.log(`[EmailService] Sending website scan reminder to: ${email}`);

      // Import and render the React Email component
      const { render } = await import('@react-email/render');
      const { WebsiteScanReminderEmail } = await import('../../src/emails/WebsiteScanReminderEmail.js');

      const scanLink = process.env.DASHBOARD_URL || 
        (process.env.NODE_ENV === 'production' 
          ? 'https://cynthiaconcierge.com/wellness/dashboard'
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
      console.error('[EmailService] Error sending website scan reminder:', error);
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
}
