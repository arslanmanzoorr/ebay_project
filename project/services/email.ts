import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_API_URL}/auth/reset-password?token=${token}`;
  const refId = `BS-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  console.log('🔗 Magic Link (Password Reset):', resetLink);

  const text = `BidSquire password reset — reference ${refId}

Open this link to set a new password:
${resetLink}

If you did not request this, ignore this email. Link expires in 1 hour.
`;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Bidsquire <noreply@bidsquire.com>',
      to: email,
      subject: 'Reset Your Password - Bidsquire',
      text,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <p style="margin:0 0 16px;font-size:14px;color:#374151;">Password reset reference: <strong>${refId}</strong></p>
          <h2>Reset Your Password</h2>
          <p>You requested to reset your password. Use the button or the link below:</p>
          <p>
            <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">
              Reset Password
            </a>
          </p>
          <p style="font-size:13px;color:#0070f3;word-break:break-all;margin:16px 0;">${resetLink}</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
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
