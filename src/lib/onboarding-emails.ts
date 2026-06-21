/**
 * Automated onboarding email sequence for new clubs.
 *
 * Seven emails (steps 0-6) are drip-sent over the first 30 days after
 * registration. Step 0 fires immediately from the registration route handler;
 * steps 1-6 are dispatched by the daily cron at /api/cron/onboarding.
 *
 * Templates are bilingual (EN / ES), selected by the club's stored locale.
 * They are hard-coded here rather than using next-intl, because emails are
 * server-only and must render without request-scoped i18n context.
 */
import { sendEmail } from "./email";
import { BRAND, COLORS } from "./constants";

// ─── HTML helpers ────────────────────────────────────────────────────────────

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Branded email shell matching the style in email.ts. */
function layout(heading: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr><td style="background:${COLORS.navy};padding:24px 28px;">
            <span style="font-size:20px;font-weight:700;color:#ffffff;">Entrena<span style="color:${COLORS.gold};">Dojo</span></span>
          </td></tr>
          <tr><td style="padding:28px;">
            <h1 style="margin:0 0 16px;font-size:20px;color:${COLORS.navy};">${heading}</h1>
            ${bodyHtml}
          </td></tr>
          <tr><td style="padding:18px 28px;border-top:1px solid #e2e8f0;">
            <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">
              ${BRAND.name} &mdash; entrenadojo.es
            </p>
            <p style="margin:0;font-size:11px;color:#cbd5e1;">
              If you no longer wish to receive these emails, reply with "unsubscribe".
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

/** Teal CTA button. */
function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${COLORS.teal};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:10px;">${label}</a>`;
}

/** Shared inline styles for body paragraphs. */
const P = 'style="margin:0 0 16px;font-size:15px;line-height:1.6;"';
const P_LAST = 'style="margin:0;font-size:15px;line-height:1.6;"';
const LI = 'style="margin:0 0 6px;font-size:15px;line-height:1.5;"';
const SIG = 'style="margin:24px 0 0;font-size:14px;color:#64748b;"';

// ─── Email content by step ───────────────────────────────────────────────────

interface StepContent {
  subject: string;
  heading: string;
  body: string;
}

function getBaseUrl(): string {
  return BRAND.url;
}

function stepContent(
  step: number,
  clubName: string,
  locale: string,
): StepContent {
  const es = locale.startsWith("es");
  const base = getBaseUrl();
  const club = escapeHtml(clubName);

  switch (step) {
    // ── Day 0: Welcome ──────────────────────────────────────────────────────
    case 0:
      return es
        ? {
            subject: "Tu club ya esta activo en EntrenaDojo",
            heading: `Bienvenido, ${club}!`,
            body: `
              <p ${P}>Tu club ya esta listo en EntrenaDojo. Ahora tienes un panel de control completo para gestionar tu academia de artes marciales.</p>
              <p ${P}>Para aprovechar al maximo la plataforma, te recomendamos estos <strong>3 primeros pasos</strong>:</p>
              <ol style="margin:0 0 16px;padding-left:20px;">
                <li ${LI}><strong>Configura tu sistema de cinturones</strong> &mdash; define los rangos y requisitos de tu disciplina.</li>
                <li ${LI}><strong>Invita a tu primer alumno</strong> &mdash; solo necesitas su nombre y telefono.</li>
                <li ${LI}><strong>Crea tu horario de clases</strong> &mdash; organiza tus sesiones semanales.</li>
              </ol>
              <p ${P}>Estamos construyendo EntrenaDojo junto con academias como la tuya. Si necesitas algo, responde a este email directamente.</p>
              <p style="margin:0 0 24px;">${button(`${base}/dashboard`, "Ir al Panel de Control")}</p>
              <p ${SIG}>&mdash; Joel, fundador de EntrenaDojo</p>`,
          }
        : {
            subject: "Your club is live on EntrenaDojo",
            heading: `Welcome, ${club}!`,
            body: `
              <p ${P}>Your club is now live on EntrenaDojo. You have a complete dashboard to manage your martial arts academy.</p>
              <p ${P}>To get the most out of the platform, here are your <strong>3 first steps</strong>:</p>
              <ol style="margin:0 0 16px;padding-left:20px;">
                <li ${LI}><strong>Set up your belt system</strong> &mdash; define the ranks and requirements for your discipline.</li>
                <li ${LI}><strong>Invite your first student</strong> &mdash; all you need is their name and phone number.</li>
                <li ${LI}><strong>Create your class schedule</strong> &mdash; organize your weekly sessions.</li>
              </ol>
              <p ${P}>We are building EntrenaDojo alongside academies like yours. If you need anything, reply directly to this email.</p>
              <p style="margin:0 0 24px;">${button(`${base}/dashboard`, "Go to Dashboard")}</p>
              <p ${SIG}>&mdash; Joel, founder of EntrenaDojo</p>`,
          };

    // ── Day 1: Set Up Belts ─────────────────────────────────────────────────
    case 1:
      return es
        ? {
            subject: "Tu sistema de cinturones te espera",
            heading: "Configura tus cinturones",
            body: `
              <p ${P}>El seguimiento de cinturones es el corazon de EntrenaDojo. Ya tienes un sistema predeterminado cargado segun tu disciplina, pero puedes personalizarlo por completo:</p>
              <ul style="margin:0 0 16px;padding-left:20px;">
                <li ${LI}><strong>Anade o elimina niveles</strong> segun el curriculo de tu academia.</li>
                <li ${LI}><strong>Define requisitos</strong> para cada rango: tiempo, clases, tecnicas o personalizados.</li>
                <li ${LI}><strong>Establece umbrales</strong> para que el sistema calcule automaticamente quien esta listo para su proximo examen.</li>
              </ul>
              <p ${P}>Tus alumnos veran su <strong>barra de progreso</strong> en tiempo real. Todo el proceso lleva unos 5 minutos.</p>
              <p style="margin:0 0 24px;">${button(`${base}/dashboard/belts`, "Configurar Tus Cinturones")}</p>
              <p ${SIG}>&mdash; Joel</p>`,
          }
        : {
            subject: "Your belt system is waiting",
            heading: "Set up your belts",
            body: `
              <p ${P}>Belt tracking is the heart of EntrenaDojo. You already have a default system loaded based on your discipline, but you can fully customize it:</p>
              <ul style="margin:0 0 16px;padding-left:20px;">
                <li ${LI}><strong>Add or remove levels</strong> based on your academy's curriculum.</li>
                <li ${LI}><strong>Define requirements</strong> for each rank: time, classes, techniques, or custom criteria.</li>
                <li ${LI}><strong>Set thresholds</strong> so the system automatically calculates who is ready for their next exam.</li>
              </ul>
              <p ${P}>Your students will see their <strong>progress bar</strong> in real time. The whole setup takes about 5 minutes.</p>
              <p style="margin:0 0 24px;">${button(`${base}/dashboard/belts`, "Set Up Your Belts")}</p>
              <p ${SIG}>&mdash; Joel</p>`,
          };

    // ── Day 3: Invite First Student ─────────────────────────────────────────
    case 2:
      return es
        ? {
            subject: "Tu dojo necesita alumnos",
            heading: "Invita a tu primer alumno",
            body: `
              <p ${P}>Un club sin alumnos es solo un panel de control. Anadir tu primer alumno tarda <strong>30 segundos</strong>:</p>
              <ol style="margin:0 0 16px;padding-left:20px;">
                <li ${LI}>Ve a <strong>Alumnos</strong> en el menu lateral.</li>
                <li ${LI}>Haz clic en <strong>Anadir alumno</strong>.</li>
                <li ${LI}>Introduce su nombre y telefono.</li>
                <li ${LI}>Comparte el enlace de invitacion por WhatsApp.</li>
              </ol>
              <p ${P}>Los clubs que anaden su primer alumno en la primera semana tienen un <strong>80% mas de retencion</strong> a largo plazo.</p>
              <p style="margin:0 0 24px;">${button(`${base}/dashboard/students`, "Anadir Tu Primer Alumno")}</p>
              <p ${SIG}>&mdash; Joel</p>`,
          }
        : {
            subject: "Your dojo needs students",
            heading: "Invite your first student",
            body: `
              <p ${P}>A club without students is just a dashboard. Adding your first student takes <strong>30 seconds</strong>:</p>
              <ol style="margin:0 0 16px;padding-left:20px;">
                <li ${LI}>Go to <strong>Students</strong> in the sidebar.</li>
                <li ${LI}>Click <strong>Add Student</strong>.</li>
                <li ${LI}>Enter their name and phone number.</li>
                <li ${LI}>Share the invitation link via WhatsApp.</li>
              </ol>
              <p ${P}>Clubs that add their first student in the first week have <strong>80% higher long-term retention</strong>.</p>
              <p style="margin:0 0 24px;">${button(`${base}/dashboard/students`, "Add Your First Student")}</p>
              <p ${SIG}>&mdash; Joel</p>`,
          };

    // ── Day 5: Create Class Schedule ────────────────────────────────────────
    case 3:
      return es
        ? {
            subject: "Las clases empiezan aqui",
            heading: "Crea tu horario de clases",
            body: `
              <p ${P}>Ya tienes alumnos. Ahora organiza tus sesiones semanales creando tu horario de clases:</p>
              <ul style="margin:0 0 16px;padding-left:20px;">
                <li ${LI}>Elige <strong>dia y hora</strong> para cada clase.</li>
                <li ${LI}>Asigna <strong>disciplina, nivel</strong> e <strong>instructor</strong>.</li>
                <li ${LI}>Define la <strong>capacidad maxima</strong> de alumnos.</li>
              </ul>
              <p ${P}>Cada clase genera automaticamente un <strong>codigo QR</strong> que tus alumnos escanean para registrar su asistencia. Ademas, el horario aparece en tu <strong>pagina publica del club</strong>.</p>
              <p style="margin:0 0 24px;">${button(`${base}/dashboard/classes`, "Crear Tu Horario")}</p>
              <p ${SIG}>&mdash; Joel</p>`,
          }
        : {
            subject: "Classes start here",
            heading: "Create your class schedule",
            body: `
              <p ${P}>Your students are in. Now organize your weekly sessions by creating your class schedule:</p>
              <ul style="margin:0 0 16px;padding-left:20px;">
                <li ${LI}>Pick a <strong>day and time</strong> for each class.</li>
                <li ${LI}>Assign a <strong>discipline, level</strong>, and <strong>instructor</strong>.</li>
                <li ${LI}>Set the <strong>maximum capacity</strong>.</li>
              </ul>
              <p ${P}>Each class automatically generates a <strong>QR code</strong> your students scan to check in. The schedule also appears on your <strong>public club page</strong>.</p>
              <p style="margin:0 0 24px;">${button(`${base}/dashboard/classes`, "Create Your Schedule")}</p>
              <p ${SIG}>&mdash; Joel</p>`,
          };

    // ── Day 7: Set Up Payments ──────────────────────────────────────────────
    case 4:
      return es
        ? {
            subject: "Es hora de cobrar",
            heading: "Configura tus pagos",
            body: `
              <p ${P}>Llevas una semana con tu club en marcha. Es el momento perfecto para configurar los cobros:</p>
              <ol style="margin:0 0 16px;padding-left:20px;">
                <li ${LI}>Ve a <strong>Pagos</strong> en el menu lateral.</li>
                <li ${LI}>Crea un <strong>plan de pago</strong> (mensual, trimestral, anual o pago unico).</li>
                <li ${LI}>Define el <strong>importe</strong> y comparte el enlace con tus alumnos.</li>
              </ol>
              <p ${P}>Los pagos online se procesan a traves de <strong>Stripe</strong>, con deposito directo a tu cuenta. Tambien puedes registrar pagos en <strong>efectivo, Bizum o transferencia</strong> manualmente.</p>
              <p style="margin:0 0 24px;">${button(`${base}/dashboard/payments`, "Configurar Pagos")}</p>
              <p ${SIG}>&mdash; Joel</p>`,
          }
        : {
            subject: "Time to get paid",
            heading: "Set up your payments",
            body: `
              <p ${P}>You have been running your club for a week. It is the perfect time to set up billing:</p>
              <ol style="margin:0 0 16px;padding-left:20px;">
                <li ${LI}>Go to <strong>Payments</strong> in the sidebar.</li>
                <li ${LI}>Create a <strong>payment plan</strong> (monthly, quarterly, annual, or one-time).</li>
                <li ${LI}>Set the <strong>amount</strong> and share the link with your students.</li>
              </ol>
              <p ${P}>Online payments are processed through <strong>Stripe</strong>, with direct deposit to your account. You can also record <strong>cash, Bizum, or bank transfer</strong> payments manually.</p>
              <p style="margin:0 0 24px;">${button(`${base}/dashboard/payments`, "Set Up Payments")}</p>
              <p ${SIG}>&mdash; Joel</p>`,
          };

    // ── Day 14: How's It Going ──────────────────────────────────────────────
    case 5:
      return es
        ? {
            subject: "Llevas 2 semanas en marcha",
            heading: "Que tal va todo?",
            body: `
              <p ${P}>Han pasado dos semanas desde que creaste <strong>${club}</strong> en EntrenaDojo. Nos encantaria saber como te va.</p>
              <p ${P}>Si tienes alguna sugerencia, problema o simplemente quieres saludar, responde a este email. Leemos todos los mensajes.</p>
              <p ${P}>Por cierto, si estas en el <strong>plan Free</strong> (hasta 15 alumnos), recuerda que puedes pasarte a <strong>Pro</strong> en cualquier momento para desbloquear alumnos ilimitados, Stripe, seguimiento de cinturones completo y mucho mas.</p>
              <p style="margin:0 0 24px;">${button(`${base}/dashboard`, "Ir al Panel de Control")}</p>
              <p ${SIG}>&mdash; Joel</p>`,
          }
        : {
            subject: "You have been running for 2 weeks",
            heading: "How is it going?",
            body: `
              <p ${P}>It has been two weeks since you created <strong>${club}</strong> on EntrenaDojo. We would love to hear how things are going.</p>
              <p ${P}>If you have any feedback, issues, or just want to say hi, reply to this email. We read every message.</p>
              <p ${P}>By the way, if you are on the <strong>Free plan</strong> (up to 15 students), remember you can upgrade to <strong>Pro</strong> at any time to unlock unlimited students, Stripe payments, full belt tracking, and much more.</p>
              <p style="margin:0 0 24px;">${button(`${base}/dashboard`, "Go to Dashboard")}</p>
              <p ${SIG}>&mdash; Joel</p>`,
          };

    // ── Day 30: Upgrade to Pro ──────────────────────────────────────────────
    case 6:
      return es
        ? {
            subject: "Listo para crecer?",
            heading: "Lleva tu academia al siguiente nivel",
            body: `
              <p ${P}>Llevas un mes con <strong>${club}</strong> en EntrenaDojo. Si has llegado hasta aqui, es que esto va en serio.</p>
              <p ${P}>Con el plan <strong>Pro</strong> desbloqueas todo lo que necesitas para escalar tu academia:</p>
              <ul style="margin:0 0 16px;padding-left:20px;">
                <li ${LI}><strong>Alumnos ilimitados</strong> &mdash; sin topes.</li>
                <li ${LI}><strong>Seguimiento completo de cinturones</strong> &mdash; requisitos, examenes y progreso.</li>
                <li ${LI}><strong>Cobros con Stripe</strong> &mdash; pagos online con deposito directo.</li>
                <li ${LI}><strong>Asistencia por QR</strong> &mdash; tus alumnos escanean al llegar.</li>
                <li ${LI}><strong>Pagina publica del club</strong> &mdash; visible para nuevos alumnos.</li>
                <li ${LI}><strong>Sparring y emparejamiento</strong> &mdash; organiza combates justos.</li>
                <li ${LI}><strong>Soporte prioritario</strong> &mdash; respuesta en menos de 24h.</li>
              </ul>
              <p ${P}>Usa el codigo <strong style="color:${COLORS.teal};font-size:18px;">MVP3</strong> y consigue <strong>3 meses gratis</strong>. Despues: 19&nbsp;EUR/mes o 190&nbsp;EUR/ano.</p>
              <p style="margin:0 0 24px;">${button(`${base}/pricing?coupon=MVP3`, "Pasarse a Pro")}</p>
              <p ${SIG}>&mdash; Joel</p>`,
          }
        : {
            subject: "Ready to grow?",
            heading: "Take your academy to the next level",
            body: `
              <p ${P}>You have been running <strong>${club}</strong> on EntrenaDojo for a month. If you have made it this far, you are serious about this.</p>
              <p ${P}>With the <strong>Pro plan</strong>, you unlock everything you need to scale your academy:</p>
              <ul style="margin:0 0 16px;padding-left:20px;">
                <li ${LI}><strong>Unlimited students</strong> &mdash; no caps.</li>
                <li ${LI}><strong>Full belt tracking</strong> &mdash; requirements, exams, and progress.</li>
                <li ${LI}><strong>Stripe payments</strong> &mdash; online billing with direct deposit.</li>
                <li ${LI}><strong>QR attendance</strong> &mdash; students scan on arrival.</li>
                <li ${LI}><strong>Public club page</strong> &mdash; discoverable by new students.</li>
                <li ${LI}><strong>Sparring &amp; pairing</strong> &mdash; organize fair match-ups.</li>
                <li ${LI}><strong>Priority support</strong> &mdash; response within 24h.</li>
              </ul>
              <p ${P}>Use code <strong style="color:${COLORS.teal};font-size:18px;">MVP3</strong> to get <strong>3 months free</strong>. After that: 19&nbsp;EUR/month or 190&nbsp;EUR/year.</p>
              <p style="margin:0 0 24px;">${button(`${base}/pricing?coupon=MVP3`, "Upgrade to Pro")}</p>
              <p ${SIG}>&mdash; Joel</p>`,
          };

    default:
      throw new Error(`Unknown onboarding step: ${step}`);
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Compose and send a single onboarding email for the given step.
 *
 * @param clubId  - Club UUID (for logging / future analytics)
 * @param email   - Recipient address (club owner)
 * @param clubName - Human-readable club name, used in copy
 * @param step    - Sequence step 0-6
 * @param locale  - "es" for Spanish, anything else for English
 */
export async function sendOnboardingEmail(
  clubId: string,
  email: string,
  clubName: string,
  step: number,
  locale: string,
): Promise<void> {
  const content = stepContent(step, clubName, locale);
  const html = layout(content.heading, content.body);

  console.log(`[onboarding] sending step ${step} to ${email} (club ${clubId})`);

  await sendEmail({
    to: email,
    subject: content.subject,
    html,
  });
}
