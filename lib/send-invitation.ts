import nodemailer from 'nodemailer';

export async function sendOrganizationInvitation({
  email,
  invitedByUsername,
  invitedByEmail,
  teamName,
  inviteLink
}: {
  email: string,
  invitedByUsername: string,
  invitedByEmail: string,
  teamName: string,
  inviteLink: string
}) {
  // Compose a beautiful HTML email
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

  const transporter = nodemailer.createTransport({
    host: 'in-v3.mailjet.com',
    port: 587,
    auth: {
      user: 'c1e5fb67e5770d386b6d5c03776f35fc',
      pass: '1b468458e81e6b44423c228efb08bb3c',
    }
  });

  try {
    const info = await transporter.sendMail({
      from: 'faudel.hammoudi@outlook.fr',
      to: email,
      subject: `Invitation to join ${teamName} on ModelizeMe` ,
      html,
    });
    console.log('Invitation email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending invitation email:', error);
  }
} 