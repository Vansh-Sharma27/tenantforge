/**
 * Member removed email template
 */
export interface MemberRemovedEmailData {
  workspaceName: string;
}

export function generateMemberRemovedEmail(data: MemberRemovedEmailData): {
  subject: string;
  html: string;
} {
  const { workspaceName } = data;

  return {
    subject: `You've been removed from ${workspaceName}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Removed from Workspace</title>
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
                      Workspace Access Removed
                    </h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 0 40px 40px;">
                    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.5;">
                      You've been removed from <strong>${workspaceName}</strong>.
                    </p>

                    <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px; line-height: 1.5;">
                      You no longer have access to this workspace and its resources.
                    </p>

                    <div style="margin: 0; padding: 16px; background-color: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
                      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                        <strong>Note:</strong> If you believe this is a mistake, please contact the workspace administrator for assistance.
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
