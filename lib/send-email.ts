import nodemailer from "nodemailer";

/**
 * Generic email sender that handles dev (MailHog) and prod (SMTP) transports.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    const transporter = nodemailer.createTransport({
      host: process.env.MAILHOG_HOST || "mailhog",
      port: 1025,
      secure: false,
    });

    try {
      const info = await transporter.sendMail({
        from: "noreply@modelizeme.local",
        to,
        subject,
        html,
      });
      console.log("✅ [DEV] Email sent via MailHog:", info.messageId);
      return;
    } catch (error) {
      console.error("❌ [DEV] MailHog error:", error);
      throw error;
    }
  }

  const config = useRuntimeConfig();
  const transporter = nodemailer.createTransport({
    host: config.mailerHost || process.env.MAILER_HOST,
    port: Number(config.mailerPort || process.env.MAILER_PORT || 587),
    secure: process.env.MAILER_SECURE === "true",
    auth: {
      user: config.mailerUser || process.env.MAILER_USER,
      pass: config.mailerPassword || process.env.MAILER_PASSWORD,
    },
  });

  const from = config.mailerFrom || process.env.MAILER_FROM || "noreply@modelizeme.com";

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    console.log("✅ [PROD] Email sent:", info.messageId);
  } catch (error) {
    console.error("❌ [PROD] Email error:", error);
    throw error;
  }
}
