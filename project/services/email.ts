import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_API_URL}/auth/reset-password?token=${token}`;
  console.log('🔗 Magic Link (Password Reset):', resetLink);

  const text = `Reset your Bidsquire password using this link (valid 1 hour):

${resetLink}

If you did not request a password reset, you can ignore this email.
`;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Bidsquire <noreply@bidsquire.com>',
      to: email,
      subject: 'Reset Your Password - Bidsquire',
      text,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="margin-top:0;">Reset Your Password</h2>
          <p>You asked to reset your Bidsquire password. Click the button below.</p>
          <p>
            <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">
              Reset Password
            </a>
          </p>
          <p style="font-size: 13px; color: #4b5563; line-height: 1.5;">
            If the button does not work, copy and paste this link into your browser:<br />
            <span style="color: #0070f3; word-break: break-all;">${resetLink}</span>
          </p>
          <p style="font-size: 14px; color: #374151;">If you did not request this, you can safely ignore this email.</p>
          <p style="font-size: 14px; color: #374151;">This link expires in 1 hour.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send password reset email:', error);
      throw error;
    }

    console.log('Password reset email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};
