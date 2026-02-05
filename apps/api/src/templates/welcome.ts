/**
 * Welcome email template
 */
export interface WelcomeEmailData {
  workspaceName: string;
  workspaceUrl: string;
}

export function generateWelcomeEmail(data: WelcomeEmailData): {
  subject: string;
  html: string;
} {
  const { workspaceName, workspaceUrl } = data;

  return {
    subject: `Welcome to ${workspaceName}!`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Workspace</title>
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
                      Welcome to ${workspaceName}!
                    </h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 0 40px 40px;">
                    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.5;">
                      You're now a member of <strong>${workspaceName}</strong>. We're excited to have you on board!
                    </p>

                    <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px; line-height: 1.5;">
                      Click the button below to start exploring your workspace.
                    </p>

                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td align="center" style="padding: 8px 0;">
                          <a href="${workspaceUrl}" style="display: inline-block; padding: 12px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                            Go to Workspace
                          </a>
                        </td>
                      </tr>
                    </table>

                    <div style="margin: 32px 0 0; padding: 20px; background-color: #f9fafb; border-radius: 6px; border-left: 4px solid #2563eb;">
                      <p style="margin: 0 0 12px; color: #111827; font-size: 14px; font-weight: 600;">
                        Getting Started
                      </p>
                      <ul style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        <li>Complete your profile settings</li>
                        <li>Explore workspace features</li>
                        <li>Collaborate with your team members</li>
                      </ul>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      Need help? Contact us at support@tenantforge.dev
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
