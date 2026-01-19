/**
 * EMAIL SERVICE - MailerSend Integration
 *
 * EXPLICAȚIE:
 * Acest fișier gestionează trimiterea de email-uri transacționale:
 * - Email de confirmare la înregistrare
 * - Email pentru reset parolă
 *
 * PENTRU CURSANȚI:
 * MailerSend este un serviciu de email transacțional (alternative: SendGrid, Postmark)
 * Cost: 9.99$/lună pentru 12,500 emails (sau FREE tier: 3000 emails/lună)
 */

import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

// Verificăm că avem API key
const MAILERSEND_API_KEY = process.env.MAILERSEND_API_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

if (!MAILERSEND_API_KEY) {
  console.warn("⚠️  MAILERSEND_API_KEY not found in .env.local");
}

// Inițializăm clientul MailerSend
const mailerSend = new MailerSend({
  apiKey: MAILERSEND_API_KEY || "dummy-key-for-build",
});

/**
 * FUNCȚIE: Trimite email de confirmare
 *
 * FLOW:
 * 1. User se înregistrează
 * 2. Generăm token unic
 * 3. Trimitem email cu link: {APP_URL}/verify-email?token={token}
 * 4. User dă click → verificăm token → activăm cont
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationToken: string
) {
  try {
    const verificationUrl = `${APP_URL}/verify-email?token=${verificationToken}`;

    const sentFrom = new Sender("noreply@trial-3z0vklo6vvxg7qrx.mlsender.net", "Vibe Budget");
    const recipients = [new Recipient(email, name)];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject("✅ Confirmă-ți contul Vibe Budget")
      .setHtml(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Bine ai venit la Vibe Budget!</h1>
            </div>
            <div class="content">
              <p>Bună ${name},</p>
              <p>Mulțumim că te-ai înregistrat la <strong>Vibe Budget</strong> - aplicația ta de management financiar inteligent!</p>
              <p>Pentru a activa contul, te rugăm să confirmi adresa de email dând click pe butonul de mai jos:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">✅ Confirmă Email-ul</a>
              </div>
              <p style="color: #666; font-size: 14px;">Sau copiază și lipește acest link în browser:</p>
              <p style="background: #fff; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">${verificationUrl}</p>
              <p><strong>Link-ul expiră în 24 de ore.</strong></p>
              <p>Dacă nu te-ai înregistrat pe Vibe Budget, ignoră acest email.</p>
            </div>
            <div class="footer">
              <p>© 2024 Vibe Budget - Aplicație de Management Financiar</p>
              <p>Construit cu ❤️ pentru cursul de Claude Code</p>
            </div>
          </div>
        </body>
        </html>
      `)
      .setText(`
        Bună ${name},

        Mulțumim că te-ai înregistrat la Vibe Budget!

        Pentru a activa contul, accesează acest link:
        ${verificationUrl}

        Link-ul expiră în 24 de ore.

        Dacă nu te-ai înregistrat, ignoră acest email.

        © 2024 Vibe Budget
      `);

    await mailerSend.email.send(emailParams);

    console.log(`✅ Verification email sent to ${email}`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to send verification email:", error);
    return { success: false, error: error.message };
  }
}

/**
 * FUNCȚIE: Trimite email pentru reset parolă
 *
 * FLOW:
 * 1. User apasă "Forgot password"
 * 2. Introduce email-ul
 * 3. Generăm resetToken cu expirare (1h)
 * 4. Trimitem email cu link: {APP_URL}/reset-password?token={resetToken}
 * 5. User setează parolă nouă
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string
) {
  try {
    const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

    const sentFrom = new Sender("noreply@trial-3z0vklo6vvxg7qrx.mlsender.net", "Vibe Budget");
    const recipients = [new Recipient(email, name)];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject("🔑 Resetează-ți parola Vibe Budget")
      .setHtml(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔑 Resetează Parola</h1>
            </div>
            <div class="content">
              <p>Bună ${name},</p>
              <p>Am primit o cerere de resetare a parolei pentru contul tău Vibe Budget.</p>
              <p>Dă click pe butonul de mai jos pentru a seta o parolă nouă:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">🔑 Resetează Parola</a>
              </div>
              <p style="color: #666; font-size: 14px;">Sau copiază și lipește acest link în browser:</p>
              <p style="background: #fff; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">${resetUrl}</p>
              <div class="warning">
                <p><strong>⚠️ Important:</strong></p>
                <ul style="margin: 5px 0; padding-left: 20px;">
                  <li>Link-ul expiră în <strong>1 oră</strong></li>
                  <li>Poate fi folosit o singură dată</li>
                  <li>Dacă nu ai cerut resetarea, ignoră acest email</li>
                </ul>
              </div>
              <p>Dacă nu ai cerut resetarea parolei, contul tău este în siguranță și poți ignora acest mesaj.</p>
            </div>
            <div class="footer">
              <p>© 2024 Vibe Budget - Aplicație de Management Financiar</p>
              <p>Pentru suport: support@vibebudget.com</p>
            </div>
          </div>
        </body>
        </html>
      `)
      .setText(`
        Bună ${name},

        Am primit o cerere de resetare a parolei pentru contul tău Vibe Budget.

        Pentru a seta o parolă nouă, accesează acest link:
        ${resetUrl}

        IMPORTANT:
        - Link-ul expiră în 1 oră
        - Poate fi folosit o singură dată
        - Dacă nu ai cerut resetarea, ignoră acest email

        © 2024 Vibe Budget
      `);

    await mailerSend.email.send(emailParams);

    console.log(`✅ Password reset email sent to ${email}`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to send password reset email:", error);
    return { success: false, error: error.message };
  }
}

/**
 * PENTRU CURSANȚI - ALTERNATIVE:
 *
 * 1. SendGrid (cel mai popular)
 *    - Free tier: 100 emails/zi
 *    - npm install @sendgrid/mail
 *
 * 2. Postmark (cel mai rapid)
 *    - Free tier: 100 emails/lună
 *    - npm install postmark
 *
 * 3. Resend (modern, developer-friendly)
 *    - Free tier: 3000 emails/lună
 *    - npm install resend
 *
 * 4. Amazon SES (cel mai ieftin la scară)
 *    - $0.10 per 1000 emails
 *    - npm install @aws-sdk/client-ses
 */
