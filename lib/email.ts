export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.SMTP_HOST) {
    console.log(`[EMAIL] To: ${to} | Subject: ${subject}`)
    console.log(`[EMAIL] Body (HTML stripped): ${html.replace(/<[^>]+>/g, " ")}`)
    return
  }
  // TODO: nodemailer is not in package.json — add it or use another SMTP mechanism to send real emails.
  // For now, falling back to console.log even when SMTP_HOST is set.
  console.log(`[EMAIL] To: ${to} | Subject: ${subject}`)
  console.log(`[EMAIL] Body (HTML stripped): ${html.replace(/<[^>]+>/g, " ")}`)
}

export async function sendVerificationEmail(
  to: string,
  firstName: string,
  token: string
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const verificationUrl = `${appUrl}/weryfikacja?token=${token}`
  const html = `<p>Cześć ${firstName}!</p><p>Kliknij poniższy link, aby zweryfikować swój adres email:</p><p><a href="${verificationUrl}">${verificationUrl}</a></p><p>Link wygasa po 24 godzinach.</p>`
  await sendEmail(to, "Weryfikacja adresu email — Don Bosco Premier League", html)
  // Always log the URL for convenience (private app)
  console.log(`[EMAIL] Verification URL for ${to}: ${verificationUrl}`)
}
