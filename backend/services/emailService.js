// backend/services/emailService.js - Enhanced email service for organization invitations
const nodemailer = require("nodemailer");

// Create transporter with better configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your-email@gmail.com
    pass: process.env.EMAIL_PASS, // your-app-password
  },
  secure: true,
  tls: {
    rejectUnauthorized: false,
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter verification failed:", error);
  } else {
    console.log("Email service ready:", success);
  }
});

// Enhanced invitation email with organization context
const sendInvitationEmail = async (
  email,
  invitationToken,
  inviterName,
  role,
  organizationName,
  customMessage = ""
) => {
  const inviteUrl = `${process.env.FRONTEND_URL}/accept-invitation?token=${invitationToken}`;

  // Role-specific welcome messages
  const roleMessages = {
    admin:
      "You'll have full administrative access to manage the organization, team members, and all projects.",
    manager:
      "You'll be able to create and manage projects, oversee team members, and access detailed reports.",
    user: "You'll be able to track your time, work on assigned projects, and collaborate with your team.",
  };

  const roleMessage = roleMessages[role] || roleMessages.user;

  // Build email HTML with professional styling
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You're invited to join ${organizationName}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333333;
          background-color: #f8fafc;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .header .subtitle {
          color: #e2e8f0;
          margin: 8px 0 0 0;
          font-size: 16px;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 18px;
          font-weight: 600;
          color: #1a202c;
          margin-bottom: 20px;
        }
        .invitation-details {
          background-color: #f7fafc;
          border-left: 4px solid #667eea;
          padding: 20px;
          margin: 25px 0;
          border-radius: 0 6px 6px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          align-items: center;
        }
        .detail-label {
          font-weight: 600;
          color: #4a5568;
        }
        .detail-value {
          color: #1a202c;
          font-weight: 500;
        }
        .role-badge {
          background-color: #667eea;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .custom-message {
          background-color: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 6px;
          padding: 16px;
          margin: 20px 0;
        }
        .custom-message-label {
          font-weight: 600;
          color: #9a3412;
          font-size: 14px;
          margin-bottom: 8px;
        }
        .custom-message-text {
          color: #7c2d12;
          font-style: italic;
        }
        .cta-section {
          text-align: center;
          margin: 35px 0;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #ffffff;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 16px;
          box-shadow: 0 4px 14px 0 rgba(102, 126, 234, 0.4);
          transition: all 0.3s ease;
        }
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px 0 rgba(102, 126, 234, 0.6);
        }
        .expiry-notice {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 16px;
          margin: 25px 0;
          text-align: center;
        }
        .expiry-notice .icon {
          font-size: 20px;
          margin-bottom: 8px;
        }
        .expiry-text {
          color: #dc2626;
          font-weight: 600;
          font-size: 14px;
        }
        .alternative-link {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 16px;
          margin: 20px 0;
        }
        .alternative-link-label {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 8px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .alternative-link-url {
          word-break: break-all;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 12px;
          color: #475569;
          background-color: #ffffff;
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
        }
        .footer {
          background-color: #f8fafc;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
        }
        .footer-text {
          color: #64748b;
          font-size: 14px;
          margin: 0;
        }
        .footer-link {
          color: #667eea;
          text-decoration: none;
        }
        .security-notice {
          margin-top: 20px;
          padding: 16px;
          background-color: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 6px;
          font-size: 12px;
          color: #0c4a6e;
        }
        @media only screen and (max-width: 600px) {
          .container {
            margin: 0;
            border-radius: 0;
          }
          .header, .content, .footer {
            padding: 30px 20px;
          }
          .detail-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .detail-value {
            margin-top: 4px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>🎉 You're Invited!</h1>
          <p class="subtitle">Join ${organizationName} on TimeTrack Pro</p>
        </div>

        <!-- Main Content -->
        <div class="content">
          <div class="greeting">Hi there!</div>
          
          <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> as a team member.</p>
          
          <!-- Invitation Details -->
          <div class="invitation-details">
            <div class="detail-row">
              <span class="detail-label">Organization:</span>
              <span class="detail-value">${organizationName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Invited by:</span>
              <span class="detail-value">${inviterName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Your role:</span>
              <span class="role-badge">${role}</span>
            </div>
          </div>

          <p>${roleMessage}</p>

          ${
            customMessage
              ? `
          <div class="custom-message">
            <div class="custom-message-label">Personal message from ${inviterName}:</div>
            <div class="custom-message-text">"${customMessage}"</div>
          </div>
          `
              : ""
          }

          <!-- Call to Action -->
          <div class="cta-section">
            <a href="${inviteUrl}" class="cta-button">Accept Invitation & Create Account</a>
          </div>

          <!-- Expiry Notice -->
          <div class="expiry-notice">
            <div class="icon">⏰</div>
            <div class="expiry-text">This invitation expires in 7 days</div>
          </div>

          <!-- Alternative Link -->
          <div class="alternative-link">
            <div class="alternative-link-label">Or copy and paste this link:</div>
            <div class="alternative-link-url">${inviteUrl}</div>
          </div>

          <p>Once you accept the invitation, you'll be able to:</p>
          <ul style="color: #4a5568; margin-left: 20px;">
            <li>Track your time and manage tasks</li>
            <li>Collaborate with your team members</li>
            <li>Access project information and reports</li>
            <li>Use productivity tools and integrations</li>
          </ul>

          <!-- Security Notice -->
          <div class="security-notice">
            <strong>🔒 Security Notice:</strong> This invitation is specifically for ${email}. 
            If you didn't expect this invitation, you can safely ignore this email. 
            The invitation will automatically expire in 7 days.
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p class="footer-text">
            This invitation was sent by ${inviterName} from ${organizationName}.<br>
            If you have questions, please contact your team administrator.
          </p>
          <p class="footer-text" style="margin-top: 16px;">
            <a href="#" class="footer-link">TimeTrack Pro</a> - Professional Time Tracking & Team Management
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Text version for email clients that don't support HTML
  const textContent = `
You're invited to join ${organizationName}!

Hi there!

${inviterName} has invited you to join ${organizationName} as a ${role}.

${roleMessage}

${
  customMessage
    ? `Personal message from ${inviterName}: "${customMessage}"`
    : ""
}

To accept this invitation and create your account, click the link below:
${inviteUrl}

IMPORTANT: This invitation expires in 7 days.

Once you join, you'll be able to:
- Track your time and manage tasks
- Collaborate with your team members  
- Access project information and reports
- Use productivity tools and integrations

Security Notice: This invitation is specifically for ${email}. If you didn't expect this invitation, you can safely ignore this email.

---
This invitation was sent by ${inviterName} from ${organizationName}.
TimeTrack Pro - Professional Time Tracking & Team Management
`;

  const mailOptions = {
    from: {
      name: "TimeTrack Pro",
      address: process.env.EMAIL_USER,
    },
    to: email,
    subject: `You're invited to join ${organizationName} on TimeTrack Pro`,
    html: htmlContent,
    text: textContent,
    headers: {
      "X-Mailer": "TimeTrack Pro Invitation System",
      "X-Organization": organizationName,
      "X-Invitation-Role": role,
    },
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(
      `Invitation email sent successfully to ${email}:`,
      info.messageId
    );
    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info),
    };
  } catch (error) {
    console.error("Failed to send invitation email:", error);
    throw new Error(`Email delivery failed: ${error.message}`);
  }
};

// Send reminder email for pending invitations
const sendInvitationReminder = async (
  email,
  invitationToken,
  inviterName,
  organizationName,
  daysUntilExpiry
) => {
  const inviteUrl = `${process.env.FRONTEND_URL}/accept-invitation?token=${invitationToken}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reminder: Your invitation to ${organizationName} expires soon</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #f59e0b;">⏰ Invitation Reminder</h2>
      </div>
      
      <p>Hi there!</p>
      
      <p>This is a friendly reminder that you have a pending invitation to join <strong>${organizationName}</strong>.</p>
      
      <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 16px; margin: 20px 0; text-align: center;">
        <strong style="color: #92400e;">Your invitation expires in ${daysUntilExpiry} day${
    daysUntilExpiry !== 1 ? "s" : ""
  }</strong>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteUrl}" 
           style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          Accept Invitation Now
        </a>
      </div>
      
      <p>If you have any questions about this invitation, please contact ${inviterName} or your team administrator.</p>
      
      <hr style="margin: 30px 0;">
      <p style="color: #666; font-size: 12px; text-align: center;">
        This reminder was sent because you haven't responded to your invitation yet.<br>
        If you don't want to receive reminders, the invitation will automatically expire in ${daysUntilExpiry} day${
    daysUntilExpiry !== 1 ? "s" : ""
  }.
      </p>
    </body>
    </html>
  `;

  const mailOptions = {
    from: {
      name: "TimeTrack Pro",
      address: process.env.EMAIL_USER,
    },
    to: email,
    subject: `Reminder: Your invitation to ${organizationName} expires soon`,
    html: htmlContent,
    headers: {
      "X-Mailer": "TimeTrack Pro Reminder System",
      "X-Organization": organizationName,
    },
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Reminder email sent to ${email}:`, info.messageId);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Failed to send reminder email:", error);
    throw new Error(`Reminder email delivery failed: ${error.message}`);
  }
};

// Send welcome email after successful registration
const sendWelcomeEmail = async (
  email,
  userName,
  organizationName,
  userRole
) => {
  const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${organizationName}!</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #10b981;">🎉 Welcome to ${organizationName}!</h1>
      </div>
      
      <p>Hi ${userName}!</p>
      
      <p>Welcome to <strong>${organizationName}</strong>! Your account has been successfully created and you're now part of the team.</p>
      
      <div style="background-color: #f0f9ff; border: 1px solid #3b82f6; border-radius: 6px; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1e40af;">What's next?</h3>
        <ul style="color: #374151;">
          <li>Complete your profile setup</li>
          <li>Explore your dashboard and available projects</li>
          <li>Start tracking your time and productivity</li>
          <li>Connect with your team members</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" 
           style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          Go to Dashboard
        </a>
      </div>
      
      <p>If you have any questions or need help getting started, don't hesitate to reach out to your team administrator.</p>
      
      <hr style="margin: 30px 0;">
      <p style="color: #666; font-size: 12px; text-align: center;">
        TimeTrack Pro - Professional Time Tracking & Team Management<br>
        You're receiving this email because you just joined ${organizationName}.
      </p>
    </body>
    </html>
  `;

  const mailOptions = {
    from: {
      name: "TimeTrack Pro",
      address: process.env.EMAIL_USER,
    },
    to: email,
    subject: `Welcome to ${organizationName} - Let's get started!`,
    html: htmlContent,
    headers: {
      "X-Mailer": "TimeTrack Pro Welcome System",
      "X-Organization": organizationName,
    },
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}:`, info.messageId);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    throw new Error(`Welcome email delivery failed: ${error.message}`);
  }
};

module.exports = {
  sendInvitationEmail,
  sendInvitationReminder,
  sendWelcomeEmail,
};
