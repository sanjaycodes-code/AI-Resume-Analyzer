import { Resend } from 'resend';
import { env } from '../config/env';

/**
 * Sends a password reset email using Resend, with graceful console fallback in development/demo mode.
 */
export const sendPasswordResetEmail = async (
  email: string,
  resetUrl: string,
  userName?: string
): Promise<void> => {
  const fromAddress = env.EMAIL_FROM || 'onboarding@resend.dev';

  if (env.RESEND_API_KEY && env.RESEND_API_KEY.trim() !== '') {
    try {
      const resend = new Resend(env.RESEND_API_KEY.trim());
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: email,
        subject: 'Reset Your AI Resume Analyzer Password',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Reset Your Password</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; margin: 0;">
              <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <tr>
                  <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 32px 40px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">AI Resume Analyzer</h1>
                    <p style="color: #dbeafe; margin: 6px 0 0 0; font-size: 13px;">Password Reset Request</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 36px 40px;">
                    <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 18px; font-weight: 700;">Hello ${userName ? userName : 'there'},</h2>
                    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                      We received a request to reset your password for your <strong>AI Resume Analyzer</strong> account. Click the button below to choose a new password:
                    </p>
                    <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 28px auto;">
                      <tr>
                        <td align="center" style="border-radius: 10px; background-color: #2563eb;">
                          <a href="${resetUrl}" target="_blank" style="font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; padding: 14px 28px; display: inline-block; border-radius: 10px;">
                            Reset My Password
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 20px 0; background-color: #f1f5f9; padding: 12px 16px; border-radius: 8px;">
                      ⏱️ <strong>Note:</strong> This link is valid for <strong>15 minutes</strong>. If you did not request a password reset, you can safely ignore this email.
                    </p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                    <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0 0 8px 0; font-weight: 600;">
                      Button not opening? Copy and paste this exact link directly into your browser:
                    </p>
                    <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px; font-family: monospace; font-size: 11px; word-break: break-all; color: #1e293b; line-height: 1.4; user-select: all;">
                      ${resetUrl}
                    </div>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      });

      if (error) {
        console.error('[EmailService:ERROR] Resend API rejected email dispatch:');
        console.error(JSON.stringify(error, null, 2));

        if (error.message?.includes('testing emails to your own email address')) {
          console.warn(
            `\n⚠️  [EmailService: RESEND ACCOUNT RESTRICTION NOTICE]\n` +
            `Resend unverified accounts can only send emails to the Resend account owner's email address.\n` +
            `To send to any recipient, verify a custom domain at https://resend.com/domains.\n`
          );
        }

        // Fallback console log so local dev/testing is never blocked
        console.log('==================================================================');
        console.log('[EmailService: FALLBACK CONSOLE RESET LINK]');
        console.log(`Recipient: ${email}`);
        console.log(`Password Reset Link: ${resetUrl}`);
        console.log('==================================================================');
      } else {
        console.log(`[EmailService:SUCCESS] Password reset email sent via Resend! (ID: ${data?.id}, Recipient: ${email})`);
        return;
      }
    } catch (err) {
      console.error('[EmailService:FATAL] Exception while invoking Resend SDK:', err);
      console.log('==================================================================');
      console.log('[EmailService: EXCEPTION FALLBACK CONSOLE RESET LINK]');
      console.log(`Recipient: ${email}`);
      console.log(`Password Reset Link: ${resetUrl}`);
      console.log('==================================================================');
    }
  } else {
    // Development/Demo fallback: log the reset link prominently to console
    console.log('==================================================================');
    console.log('[EmailService: DEV / DEMO MODE — RESEND_API_KEY NOT CONFIGURED]');
    console.log(`Recipient: ${email}`);
    console.log(`Password Reset Link: ${resetUrl}`);
    console.log('==================================================================');
  }
};
