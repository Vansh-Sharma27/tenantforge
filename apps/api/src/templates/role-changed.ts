/**
 * Role changed email template
 */
export interface RoleChangedEmailData {
  workspaceName: string;
  oldRole: string;
  newRole: string;
  workspaceUrl: string;
}

export function generateRoleChangedEmail(data: RoleChangedEmailData): {
  subject: string;
  html: string;
} {
  const { workspaceName, oldRole, newRole, workspaceUrl } = data;

  return {
    subject: `Your role in ${workspaceName} has been updated`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Role Updated</title>
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
                      Your Role Has Changed
                    </h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 0 40px 40px;">
                    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.5;">
                      Your role in <strong>${workspaceName}</strong> has been updated.
                    </p>

                    <div style="margin: 0 0 24px; padding: 16px; background-color: #f9fafb; border-radius: 6px;">
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                            Previous Role:
                          </td>
                          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">
                            ${oldRole}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                            New Role:
                          </td>
                          <td style="padding: 8px 0; color: #2563eb; font-size: 14px; font-weight: 600; text-align: right;">
                            ${newRole}
                          </td>
                        </tr>
                      </table>
                    </div>

                    <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px; line-height: 1.5;">
                      Your permissions and access level may have changed based on your new role.
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
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      If you believe this is a mistake, please contact your workspace administrator.
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
