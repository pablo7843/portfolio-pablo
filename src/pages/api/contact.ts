import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

const resend = new Resend(import.meta.env.RESEND_API_KEY);

interface RateLimitMap {
  [key: string]: { timestamp: number }[];
}

const rateLimitMap: RateLimitMap = {};
const RATE_LIMIT_WINDOW = 5 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

// Trust only the left-most IP from the proxy chain (Vercel sets these).
function getClientIP(request: Request): string {
  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

// Best-effort rate limit. NOTE: in-memory map is per-lambda and resets on cold
// start, so it is not a hard guarantee. For strong limits use Vercel KV / Upstash.
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  if (!rateLimitMap[ip]) {
    rateLimitMap[ip] = [];
  }

  rateLimitMap[ip] = rateLimitMap[ip].filter((entry) => entry.timestamp > windowStart);

  if (rateLimitMap[ip].length >= RATE_LIMIT_MAX) {
    return false;
  }

  rateLimitMap[ip].push({ timestamp: now });
  return true;
}

// Escape every HTML-significant char so values cannot break out of the
// surrounding markup or attributes when embedded in the email body.
function escapeHTML(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .trim();
}

// Stricter than before: bounded local + domain charset, no quotes/spaces.
function validateEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;
  return typeof email === 'string' && email.length <= 100 && emailRegex.test(email);
}

function validateInput(value: string | undefined | null, minLength: number, maxLength: number): boolean {
  return typeof value === 'string' && value.length >= minLength && value.length <= maxLength;
}

// Reject cross-site POSTs: the request must originate from our own site.
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // non-browser / same-origin fetches may omit it
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export const POST: APIRoute = async (context) => {
  try {
    const request = context.request;

    if (!isSameOrigin(request)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const bodyText = await request.text();
    if (!bodyText) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
    }

    let body;
    try {
      body = JSON.parse(bodyText);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
    }

    const { name, email, subject, message, honeypot, lang } = body;

    const clientIP = getClientIP(request);

    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please wait 5 minutes.' }),
        { status: 429 }
      );
    }

    if (honeypot && honeypot.length > 0) {
      return new Response(JSON.stringify({ error: 'Spam detected' }), { status: 400 });
    }

    if (
      !validateInput(name, 2, 60) ||
      !validateEmail(email) ||
      !validateInput(subject, 3, 100) ||
      !validateInput(message, 10, 2000)
    ) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 });
    }

    const safeName = escapeHTML(name);
    const safeEmail = escapeHTML(email);
    const safeSubject = escapeHTML(subject);
    const safeMessage = escapeHTML(message);
    const safeIP = escapeHTML(clientIP);
    const safeLang = lang === 'es' ? 'ESPAÑOL' : 'ENGLISH';

    const emailHTML = `
      <div style="background-color: #0c0c1a; color: #00ff00; font-family: 'Courier New', monospace; padding: 20px; border: 1px solid rgba(0, 255, 0, 0.3); border-radius: 4px;">
        <h2 style="color: #00ff00; margin-top: 0; border-bottom: 1px solid rgba(0, 255, 0, 0.3); padding-bottom: 10px;">
          > NUEVO_MENSAJE_DE_CONTACTO
        </h2>
        <div style="margin: 15px 0; font-size: 14px; line-height: 1.6;">
          <p><strong style="color: #00ff00;">NOMBRE:</strong> <code>${safeName}</code></p>
          <p><strong style="color: #00ff00;">EMAIL:</strong> <code>${safeEmail}</code></p>
          <p><strong style="color: #00ff00;">ASUNTO:</strong> <code>${safeSubject}</code></p>
          <p><strong style="color: #00ff00;">IDIOMA:</strong> <code>${safeLang}</code></p>
          <p><strong style="color: #00ff00;">IP_DEL_CLIENTE:</strong> <code>${safeIP}</code></p>
          <hr style="border: none; border-top: 1px solid rgba(0, 255, 0, 0.2); margin: 20px 0;">
          <p><strong style="color: #00ff00;">MENSAJE:</strong></p>
          <pre style="background-color: rgba(0, 255, 0, 0.05); padding: 10px; border-left: 2px solid #00ff00; overflow-x: auto; white-space: pre-wrap;">${safeMessage}</pre>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: import.meta.env.CONTACT_EMAIL,
      replyTo: safeEmail,
      subject: `[PORTFOLIO] ${safeSubject}`,
      html: emailHTML,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    // Log internally only; never leak error details to the client.
    console.error('Contact endpoint error:', error instanceof Error ? error.message : 'unknown');
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};
