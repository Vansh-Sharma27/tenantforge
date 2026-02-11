/**
 * Email verification template
 */
export interface VerificationEmailData {
  verificationUrl: string;
}

export function generateVerificationEmail(data: VerificationEmailData): {
  subject: string;
  html: string;
} {
  const { verificationUrl } = data;

  return {
    subject: "Verify your email — TenantForge",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px; text-align: center;">
                    <h1 style="margin: 0; color: #111827; font-size: 24px; font-weight: 700;">
                      Verify your email
                    </h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 0 40px 40px;">
                    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.5;">
                      Thanks for signing up for TenantForge. Please verify your email address to activate your account.
                    </p>

                    <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px; line-height: 1.5;">
                      Click the button below to confirm your email.
                    </p>

                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td align="center" style="padding: 8px 0;">
                          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 32px; background-color: #10B981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                            Verify Email
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 24px 0 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                      If the button doesn't work, copy and paste this link into your browser:
                      <br>
                      <a href="${verificationUrl}" style="color: #10B981; word-break: break-all;">${verificationUrl}</a>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      This link expires in 24 hours. If you didn't create a TenantForge account, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
}
