import nodemailer from "nodemailer";

// Create reusable transporter
const createTransporter = () => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("Email credentials not configured. Emails will not be sent.");
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationUrl: string
) {
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`[DEV MODE] Verification email would be sent to: ${email}`);
    console.log(`[DEV MODE] Verification URL: ${verificationUrl}`);
    return;
  }

  const mailOptions = {
    from: `"PulseOps" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Verify Your PulseOps Email Address",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to PulseOps!</h1>
          </div>
          
          <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${name},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Thank you for signing up for PulseOps! To complete your registration and start monitoring your services, please verify your email address.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background: #2563eb; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
                Verify Email Address
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
              Or copy and paste this link into your browser:
            </p>
            
            <p style="font-size: 14px; word-break: break-all; background: #f3f4f6; padding: 12px; border-radius: 6px; margin-bottom: 20px;">
              ${verificationUrl}
            </p>
            
            <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
                <strong>Important:</strong> This link will expire in 24 hours for security reasons.
              </p>
              
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
                If you didn't create an account with PulseOps, you can safely ignore this email.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="font-size: 14px; color: #9ca3af; margin: 0;">
                Need help? Contact us at support@pulseops.com
              </p>
              <p style="font-size: 14px; color: #9ca3af; margin: 10px 0 0 0;">
                © ${new Date().getFullYear()} PulseOps. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Hi ${name},

Thank you for signing up for PulseOps! To complete your registration and start monitoring your services, please verify your email address.

Click the link below to verify your email:
${verificationUrl}

This link will expire in 24 hours for security reasons.

If you didn't create an account with PulseOps, you can safely ignore this email.

Need help? Contact us at support@pulseops.com

© ${new Date().getFullYear()} PulseOps. All rights reserved.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to: ${email}`);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string
) {
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`[DEV MODE] Password reset email would be sent to: ${email}`);
    console.log(`[DEV MODE] Reset URL: ${resetUrl}`);
    return;
  }

  const mailOptions = {
    from: `"PulseOps" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Reset Your PulseOps Password",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Reset Your Password</h1>
          </div>
          
          <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${name},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              We received a request to reset your password for your PulseOps account. Click the button below to set a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #2563eb; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
                Reset Password
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
              Or copy and paste this link into your browser:
            </p>
            
            <p style="font-size: 14px; word-break: break-all; background: #f3f4f6; padding: 12px; border-radius: 6px; margin-bottom: 20px;">
              ${resetUrl}
            </p>
            
            <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
                <strong>Important:</strong> This link will expire in 1 hour for security reasons.
              </p>
              
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="font-size: 14px; color: #9ca3af; margin: 0;">
                Need help? Contact us at support@pulseops.com
              </p>
              <p style="font-size: 14px; color: #9ca3af; margin: 10px 0 0 0;">
                © ${new Date().getFullYear()} PulseOps. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Hi ${name},

We received a request to reset your password for your PulseOps account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

Need help? Contact us at support@pulseops.com

© ${new Date().getFullYear()} PulseOps. All rights reserved.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to: ${email}`);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
}

export async function sendIncidentAlert(
  email: string,
  monitorName: string,
  incidentDetails: string
) {
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`[DEV MODE] Incident alert would be sent to: ${email}`);
    return;
  }

  const mailOptions = {
    from: `"PulseOps Alerts" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `🚨 Alert: ${monitorName} is Down`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Monitor Alert</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">🚨 Monitor Alert</h1>
            </div>
            <div style="background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
              <h2 style="color: #dc2626;">${monitorName} is Down</h2>
              <p>${incidentDetails}</p>
              <p style="margin-top: 20px;">
                <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View Dashboard
                </a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending incident alert:", error);
  }
}
