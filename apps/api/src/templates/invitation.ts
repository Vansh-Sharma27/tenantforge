/**
 * Invitation email template
 */
import { escapeHtml } from "../utils/escape";
export interface InvitationEmailData {
  workspaceName: string;
  inviterName: string;
  role: string;
  invitationUrl: string;
}

export function generateInvitationEmail(data: InvitationEmailData): {
  subject: string;
  html: string;
} {
  const { invitationUrl } = data;
  const workspaceName = escapeHtml(data.workspaceName);
  const inviterName = escapeHtml(data.inviterName);
  const role = escapeHtml(data.role);

  return {
    subject: `You've been invited to join ${data.workspaceName}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Workspace Invitation</title>
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
                      You've been invited!
                    </h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 0 40px 40px;">
                    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.5;">
                      <strong>${inviterName}</strong> has invited you to join <strong>${workspaceName}</strong> as a <strong>${role}</strong>.
                    </p>

                    <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px; line-height: 1.5;">
                      Click the button below to accept the invitation and get started.
                    </p>

                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td align="center" style="padding: 8px 0;">
                          <a href="${invitationUrl}" style="display: inline-block; padding: 12px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                            Accept Invitation
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 24px 0 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                      If the button doesn't work, copy and paste this link into your browser:
                      <br>
                      <a href="${invitationUrl}" style="color: #2563eb; word-break: break-all;">${invitationUrl}</a>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      This invitation was sent by TenantForge. If you didn't expect this email, you can safely ignore it.
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
