import { Resend } from "resend"

const FROM    = process.env.EMAIL_FROM ?? "Don Bosco Premier League <noreply@resend.dev>"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

let _resend: Resend | null = null
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  _resend ??= new Resend(process.env.RESEND_API_KEY)
  return _resend
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const resend = getResend()
  if (!resend) {
    console.log(`[EMAIL] To: ${to} | Subject: ${subject}`)
    return
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html })
  } catch (err) {
    console.error("[email]", err)
  }
}

export async function sendEmailToMany(emails: string[], subject: string, html: string): Promise<void> {
  if (emails.length === 0) return
  await Promise.allSettled(emails.map((to) => sendEmail(to, subject, html)))
}

// ── Template helpers ──────────────────────────────────────────────────────────

function base(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden">
        <tr>
          <td style="background:#18181b;padding:20px 32px">
            <p style="margin:0;color:#a1a1aa;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase">Don Bosco Premier League</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#18181b;line-height:1.3">${title}</h1>
            ${body}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;background:#fafafa;border-top:1px solid #f4f4f5">
            <p style="margin:0;font-size:12px;color:#a1a1aa">Don Bosco Premier League · Wiadomość automatyczna.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function btn(label: string, href: string): string {
  return `<p style="margin:24px 0 0">
    <a href="${href}" style="display:inline-block;background:#18181b;color:#ffffff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none">${label} →</a>
  </p>`
}

function infoTable(rows: [string, string][]): string {
  const cells = rows.map(
    ([k, v]) => `<tr>
      <td style="padding:5px 0;font-size:14px;color:#71717a;width:42%;vertical-align:top">${k}</td>
      <td style="padding:5px 0;font-size:14px;color:#18181b;font-weight:500">${v}</td>
    </tr>`
  ).join("")
  return `<table cellpadding="0" cellspacing="0" style="margin:16px 0;width:100%">${cells}</table>`
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
}
function fmtTime(d: Date): string {
  return d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })
}

// ── Email templates ───────────────────────────────────────────────────────────

export function newMatchEmail(match: {
  id: string
  homeTeam: { name: string }
  awayTeam: { name: string }
  scheduledAt: Date
  venue: string | null
  round: number | null
}): { subject: string; html: string } {
  const subject = `Nowy mecz: ${match.homeTeam.name} vs ${match.awayTeam.name} ⚽`
  const rows: [string, string][] = [
    ["Data", fmtDate(match.scheduledAt)],
    ["Godzina", fmtTime(match.scheduledAt)],
  ]
  if (match.round !== null) rows.unshift(["Kolejka", `${match.round}`])
  if (match.venue)          rows.push(["Miejsce", match.venue])

  return {
    subject,
    html: base(subject, `
      <p style="margin:0 0 16px;font-size:15px;color:#3f3f46">Zaplanowano nowy mecz. Sprawdź szczegóły i zapisz się!</p>
      <div style="background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;padding:20px 24px;margin:0 0 8px">
        ${match.round !== null ? `<p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.05em">Kolejka ${match.round}</p>` : ""}
        <p style="margin:0;font-size:22px;font-weight:700;color:#18181b">${match.homeTeam.name} <span style="color:#a1a1aa;font-weight:400">vs</span> ${match.awayTeam.name}</p>
      </div>
      ${infoTable(rows)}
      ${btn("Zapisz się na mecz", `${APP_URL}/mecze/${match.id}`)}
    `),
  }
}

export function matchReminderEmail(match: {
  id: string
  homeTeam: { name: string }
  awayTeam: { name: string }
  scheduledAt: Date
  venue: string | null
  round: number | null
}, registrationStatus: "CONFIRMED" | "WAITLIST"): { subject: string; html: string } {
  const subject = `Jutro mecz ⚽ ${match.homeTeam.name} vs ${match.awayTeam.name}`
  const statusBadge = registrationStatus === "CONFIRMED"
    ? `<span style="background:#dcfce7;color:#15803d;font-size:12px;font-weight:600;padding:3px 10px;border-radius:100px">Zapisany</span>`
    : `<span style="background:#fef9c3;color:#92400e;font-size:12px;font-weight:600;padding:3px 10px;border-radius:100px">Rezerwowy</span>`

  return {
    subject,
    html: base(subject, `
      <p style="margin:0 0 16px;font-size:15px;color:#3f3f46">Przypominamy o jutrzejszym meczu!</p>
      <div style="background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;padding:20px 24px">
        ${match.round !== null ? `<p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.05em">Kolejka ${match.round}</p>` : ""}
        <p style="margin:0 0 12px;font-size:22px;font-weight:700;color:#18181b">${match.homeTeam.name} <span style="color:#a1a1aa;font-weight:400">vs</span> ${match.awayTeam.name}</p>
        <p style="margin:0 0 8px;font-size:14px;color:#3f3f46">Godzina: <strong>${fmtTime(match.scheduledAt)}</strong>${match.venue ? ` · ${match.venue}` : ""}</p>
        <p style="margin:0">Status: ${statusBadge}</p>
      </div>
      ${btn("Szczegóły meczu", `${APP_URL}/mecze/${match.id}`)}
    `),
  }
}

export function matchResultEmail(match: {
  id: string
  homeTeam: { name: string }
  awayTeam: { name: string }
  homeScore: number
  awayScore: number
  round: number | null
  scheduledAt: Date
}, goals: Array<{
  scorer: string
  assister: string | null
  minute: number | null
  isOwnGoal: boolean
  isHome: boolean
}>): { subject: string; html: string } {
  const subject = `Wyniki: ${match.homeTeam.name} ${match.homeScore}:${match.awayScore} ${match.awayTeam.name}`

  function goalLine(g: { scorer: string; assister: string | null; minute: number | null; isOwnGoal: boolean }): string {
    const min  = g.minute != null ? `${g.minute}′ ` : ""
    const name = g.isOwnGoal ? `<s>${g.scorer}</s> (samobój)` : g.scorer
    const ast  = g.assister ? ` <span style="font-size:12px;color:#a1a1aa">as. ${g.assister}</span>` : ""
    return `<li style="margin:4px 0;font-size:14px;color:#3f3f46">${min}${name}${ast}</li>`
  }

  const homeGoals = goals.filter((g) => g.isHome)
  const awayGoals = goals.filter((g) => !g.isHome)

  const goalsSection = goals.length === 0 ? "" : `
    <hr style="margin:24px 0;border:none;border-top:1px solid #f4f4f5">
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="width:50%;padding-right:12px;vertical-align:top">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#18181b">${match.homeTeam.name}</p>
          ${homeGoals.length > 0 ? `<ul style="margin:0;padding-left:16px">${homeGoals.map(goalLine).join("")}</ul>` : `<p style="margin:0;font-size:13px;color:#a1a1aa">—</p>`}
        </td>
        <td style="width:50%;padding-left:12px;vertical-align:top">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#18181b">${match.awayTeam.name}</p>
          ${awayGoals.length > 0 ? `<ul style="margin:0;padding-left:16px">${awayGoals.map(goalLine).join("")}</ul>` : `<p style="margin:0;font-size:13px;color:#a1a1aa">—</p>`}
        </td>
      </tr>
    </table>
  `

  return {
    subject,
    html: base(subject, `
      <p style="margin:0 0 16px;font-size:15px;color:#3f3f46">${match.round !== null ? `Mecz kolejki ${match.round}` : "Mecz"} zakończony!</p>
      <div style="background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;padding:20px 24px;text-align:center">
        <p style="margin:0 0 4px;font-size:12px;color:#71717a">${fmtDate(match.scheduledAt)}</p>
        <p style="margin:8px 0;font-size:14px;font-weight:600;color:#18181b">${match.homeTeam.name}</p>
        <p style="margin:0;font-size:36px;font-weight:800;color:#18181b;letter-spacing:-1px">${match.homeScore} : ${match.awayScore}</p>
        <p style="margin:8px 0 0;font-size:14px;font-weight:600;color:#18181b">${match.awayTeam.name}</p>
      </div>
      ${goalsSection}
      ${btn("Zobacz pełne szczegóły", `${APP_URL}/mecze/${match.id}`)}
    `),
  }
}

export function paymentDueEmail(data: {
  matchId: string
  homeTeam: string
  awayTeam: string
  amount: number
  paymentTitle: string
}): { subject: string; html: string } {
  const subject = `Płatność za mecz — ${data.amount} zł 💳`
  return {
    subject,
    html: base("Prosimy o uregulowanie płatności", `
      <p style="margin:0 0 16px;font-size:15px;color:#3f3f46">Masz nieuregulowaną płatność za mecz <strong>${data.homeTeam} vs ${data.awayTeam}</strong>.</p>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:20px 24px">
        <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#92400e">Do zapłaty: ${data.amount} zł</p>
        ${infoTable([
          ["BLIK", "600 068 826"],
          ["Odbiorca", "Don Bosco Premier League"],
          ["Tytuł przelewu", `<code style="font-family:monospace;font-size:13px">${data.paymentTitle}</code>`],
        ])}
        <p style="margin:0;font-size:12px;color:#a1a1aa">Podaj dokładny tytuł, żeby ułatwić weryfikację.</p>
      </div>
      ${btn("Moje płatności", `${APP_URL}/moj-profil?tab=platnosci`)}
    `),
  }
}

export function paymentConfirmedEmail(data: {
  homeTeam: string
  awayTeam: string
  amount: number
}): { subject: string; html: string } {
  const subject = `Płatność potwierdzona ✓`
  return {
    subject,
    html: base("Twoja płatność została potwierdzona", `
      <p style="margin:0 0 16px;font-size:15px;color:#3f3f46">Organizator potwierdził Twoją wpłatę za mecz <strong>${data.homeTeam} vs ${data.awayTeam}</strong>.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px 24px">
        <p style="margin:0;font-size:16px;font-weight:700;color:#15803d">✓ Opłacono ${data.amount} zł</p>
      </div>
      ${btn("Moje płatności", `${APP_URL}/moj-profil?tab=platnosci`)}
    `),
  }
}

// Zachowana funkcja weryfikacji email ─────────────────────────────────────────

export async function sendVerificationEmail(to: string, firstName: string, token: string): Promise<void> {
  const verificationUrl = `${APP_URL}/weryfikacja?token=${token}`
  const html = base("Zweryfikuj swój adres email", `
    <p style="margin:0 0 16px;font-size:15px;color:#3f3f46">Cześć <strong>${firstName}</strong>! Kliknij poniższy przycisk, aby aktywować konto.</p>
    <p style="margin:0;font-size:13px;color:#71717a">Link wygaśnie po 24 godzinach.</p>
    ${btn("Zweryfikuj email", verificationUrl)}
  `)
  await sendEmail(to, "Weryfikacja adresu email — Don Bosco PL", html)
  console.log(`[EMAIL] Verification URL for ${to}: ${verificationUrl}`)
}
