/**
 * Payment failed email template
 */
import { escapeHtml } from "../utils/escape";
export interface PaymentFailedEmailData {
  workspaceName: string;
  billingUrl: string;
  attemptCount: number;
}

export function generatePaymentFailedEmail(data: PaymentFailedEmailData): {
  subject: string;
  html: string;
} {
  const { billingUrl, attemptCount } = data;
  const workspaceName = escapeHtml(data.workspaceName);

  return {
    subject: `Payment failed for ${data.workspaceName}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Failed</title>
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
                      Payment Failed
                    </h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 0 40px 40px;">
                    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.5;">
                      We were unable to process payment for <strong>${workspaceName}</strong>.
                    </p>

                    <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px; line-height: 1.5;">
                      This was attempt ${attemptCount}. Please update your payment method to avoid service interruption.
                    </p>

                    <div style="text-align: center; margin: 0 0 24px;">
                      <a href="${billingUrl}" style="display: inline-block; padding: 12px 32px; background-color: #111827; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 600;">
                        Update Payment Method
                      </a>
                    </div>

                    <div style="margin: 0; padding: 16px; background-color: #fef2f2; border-radius: 6px; border-left: 4px solid #ef4444;">
                      <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.5;">
                        <strong>Important:</strong> If payment continues to fail, your workspace may be downgraded to the Free plan.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      This is an automated notification from TenantForge.
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
