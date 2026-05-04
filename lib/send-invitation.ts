import nodemailer from "nodemailer";

const APP_NAME = process.env.NUXT_PUBLIC_APP_NAME || 'Moldata'

export async function sendOrganizationInvitation({
  email,
  invitedByUsername,
  invitedByEmail,
  teamName,
  inviteLink,
}: {
  email: string;
  invitedByUsername: string;
  invitedByEmail: string;
  teamName: string;
  inviteLink: string;
}) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
      <div style="color: white; padding: 24px 32px;">
        <h2 style="margin: 0;">You're Invited to Join <span style="color: #a5b4fc;">${teamName}</span>!</h2>
      </div>
      <div style="padding: 32px; background: #f9fafb;">
        <p style="font-size: 18px; margin-bottom: 24px;">Hello,</p>
        <p style="font-size: 16px; margin-bottom: 24px;">
          <strong>${invitedByUsername}</strong> (<a href="mailto:${invitedByEmail}">${invitedByEmail}</a>) has invited you to join the workspace <strong>${teamName}</strong>.
        </p>
        <a href="${inviteLink}" style="display: inline-block; background: #4f46e5; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-size: 18px; font-weight: bold; margin-bottom: 24px;">Accept Invitation</a>
        <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">If you did not expect this invitation, you can safely ignore this email.</p>
      </div>
    </div>
  `;

  const config = useRuntimeConfig();
  const isProduction = process.env.NODE_ENV === 'production';

  // 🛠️ EN DEV : MailHog (localhost)
  if (!isProduction) {
    const transporter = nodemailer.createTransport({
      host: process.env.MAILHOG_HOST || 'mailhog',
      port: 1025,
      secure: false, // ⚠️ Important pour MailHog
    });

    try {
      const info = await transporter.sendMail({
        from: 'noreply@moldata.local',
        to: email,
        subject: `Invitation to join ${teamName}`,
        html,
      });
      console.log('✅ [DEV] Email sent via MailHog:', info.messageId);
      return;
    } catch (error) {
      console.error('❌ [DEV] MailHog error:', error);
      throw error;
    }
  }

  // 📧 EN PROD : Service d'email réel
  const transporter = nodemailer.createTransport({
    host: config.mailerHost || process.env.MAILER_HOST,
    port: Number(config.mailerPort || process.env.MAILER_PORT || 587),
    secure: process.env.MAILER_SECURE === 'true', // TLS en production
    auth: {
      user: config.mailerUser || process.env.MAILER_USER,
      pass: config.mailerPassword || process.env.MAILER_PASSWORD,
    },
  });

  const from = config.mailerFrom || process.env.MAILER_FROM || "noreply@moldata.fr";

  try {
    const info = await transporter.sendMail({
      from,
      to: email,
      subject: `Invitation to join ${teamName} on ${APP_NAME}`,
      html,
    });
    console.log('✅ [PROD] Email sent:', info.messageId);
  } catch (error) {
    console.error('❌ [PROD] Email error:', error);
    throw error;
  }
}

const categoryLabels: Record<string, string> = {
  suggestion: '💡 Suggestion',
  bug: '🐛 Bug',
  feedback: '💬 Retour général',
  praise: '👍 J\'aime bien !',
};

export async function sendFeedbackNotification({
  userEmail,
  userName,
  category,
  message,
}: {
  userEmail: string;
  userName: string;
  category: string;
  message: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return; // No admin email configured, skip silently

  const categoryLabel = categoryLabels[category] ?? category;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
      <div style="background: #4f46e5; color: white; padding: 20px 28px;">
        <h2 style="margin: 0; font-size: 18px;">Nouveau feedback - ${APP_NAME}</h2>
      </div>
      <div style="padding: 28px; background: #f9fafb;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 13px; width: 110px;">Catégorie</td>
            <td style="padding: 8px 0; font-weight: bold; font-size: 14px;">${categoryLabel}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Utilisateur</td>
            <td style="padding: 8px 0; font-size: 14px;">${userName} &lt;<a href="mailto:${userEmail}">${userEmail}</a>&gt;</td>
          </tr>
        </table>
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</div>
      </div>
    </div>
  `;

  const config = useRuntimeConfig();
  const isProduction = process.env.NODE_ENV === 'production';

  try {
    if (!isProduction) {
      const transporter = nodemailer.createTransport({
        host: process.env.MAILHOG_HOST || 'mailhog',
        port: 1025,
        secure: false,
      });
      await transporter.sendMail({
        from: 'noreply@moldata.local',
        to: adminEmail,
        subject: `[Feedback] ${categoryLabel} de ${userName}`,
        html,
      });
      console.log('✅ [DEV] Feedback email sent via MailHog');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: config.mailerHost || process.env.MAILER_HOST,
      port: Number(config.mailerPort || process.env.MAILER_PORT || 587),
      secure: process.env.MAILER_SECURE === 'true',
      auth: {
        user: config.mailerUser || process.env.MAILER_USER,
        pass: config.mailerPassword || process.env.MAILER_PASSWORD,
      },
    });
    const from = config.mailerFrom || process.env.MAILER_FROM || 'noreply@moldata.fr';
    await transporter.sendMail({
      from,
      to: adminEmail,
      subject: `[Feedback] ${categoryLabel} de ${userName}`,
      html,
    });
    console.log('✅ [PROD] Feedback email sent to admin');
  } catch (error) {
    // Best-effort: don't fail the request if email fails
    console.error('❌ Feedback email error:', error);
  }
}
