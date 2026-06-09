import { Resend } from 'resend';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const resend = new Resend("re_3RBBG2pM_8bHr5MFJp4yGXjx7sUToGFXm");
const rateLimitMap = {};
const RATE_LIMIT_WINDOW = 5 * 60 * 1e3;
const RATE_LIMIT_MAX = 3;
function getClientIP(request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "unknown";
}
function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  if (!rateLimitMap[ip]) {
    rateLimitMap[ip] = [];
  }
  rateLimitMap[ip] = rateLimitMap[ip].filter((entry) => entry.timestamp > windowStart);
  if (rateLimitMap[ip].length >= RATE_LIMIT_MAX) {
    return false;
  }
  rateLimitMap[ip].push({ count: 1, timestamp: now });
  return true;
}
function sanitizeHTML(input) {
  return input.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/javascript:/gi, "").replace(/on\w+\s*=/gi, "").trim();
}
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 100;
}
function validateInput(value, minLength, maxLength) {
  return typeof value === "string" && value.length >= minLength && value.length <= maxLength;
}
const POST = async (context) => {
  console.log("\n=== CONTACT ENDPOINT CALLED ===");
  try {
    const request = context.request;
    console.log("Request method:", request.method);
    console.log("Request URL:", request.url);
    console.log("Content-Length header:", request.headers.get("content-length"));
    console.log("All headers:");
    for (const [key, value] of request.headers) {
      console.log(`  ${key}: ${value}`);
    }
    console.log("\nAttempting to read body as text...");
    const bodyText = await request.text();
    console.log("Body text length:", bodyText.length);
    console.log("Body text first 200 chars:", bodyText.substring(0, 200));
    console.log("Body text (full):", bodyText);
    if (!bodyText || bodyText.length === 0) {
      console.error("Body is empty!");
      return new Response(
        JSON.stringify({ error: "Empty body received" }),
        { status: 400 }
      );
    }
    let body;
    try {
      body = JSON.parse(bodyText);
      console.log("✓ Parsed JSON successfully:", body);
    } catch (parseErr) {
      console.error("JSON parse failed:", parseErr);
      return new Response(
        JSON.stringify({ error: "JSON parse failed", details: String(parseErr) }),
        { status: 400 }
      );
    }
    const { name, email, subject, message, honeypot, lang } = body;
    console.log("Extracted fields - name:", name, "email:", email);
    const clientIP = getClientIP(request);
    console.log("Client IP:", clientIP);
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please wait 5 minutes." }),
        { status: 429 }
      );
    }
    if (honeypot && honeypot.length > 0) {
      console.log("Honeypot triggered!");
      return new Response(JSON.stringify({ error: "Spam detected" }), { status: 400 });
    }
    if (!validateInput(name, 2, 60) || !validateEmail(email) || !validateInput(subject, 3, 100) || !validateInput(message, 10, 2e3)) {
      console.log("Validation failed");
      return new Response(JSON.stringify({
        error: "Invalid input",
        details: {
          name: !validateInput(name, 2, 60) ? `Invalid name (len: ${name?.length || 0})` : null,
          email: !validateEmail(email) ? `Invalid email` : null,
          subject: !validateInput(subject, 3, 100) ? `Invalid subject (len: ${subject?.length || 0})` : null,
          message: !validateInput(message, 10, 2e3) ? `Invalid message (len: ${message?.length || 0})` : null
        }
      }), { status: 400 });
    }
    const sanitizedName = sanitizeHTML(name);
    const sanitizedEmail = sanitizeHTML(email);
    const sanitizedSubject = sanitizeHTML(subject);
    const sanitizedMessage = sanitizeHTML(message);
    const emailHTML = `
      <div style="background-color: #0c0c1a; color: #00ff00; font-family: 'Courier New', monospace; padding: 20px; border: 1px solid rgba(0, 255, 0, 0.3); border-radius: 4px;">
        <h2 style="color: #00ff00; margin-top: 0; border-bottom: 1px solid rgba(0, 255, 0, 0.3); padding-bottom: 10px;">
          > NUEVO_MENSAJE_DE_CONTACTO
        </h2>
        <div style="margin: 15px 0; font-size: 14px; line-height: 1.6;">
          <p><strong style="color: #00ff00;">NOMBRE:</strong> <code>${sanitizedName}</code></p>
          <p><strong style="color: #00ff00;">EMAIL:</strong> <code><a href="mailto:${sanitizedEmail}" style="color: #00ff00; text-decoration: none;">${sanitizedEmail}</a></code></p>
          <p><strong style="color: #00ff00;">ASUNTO:</strong> <code>${sanitizedSubject}</code></p>
          <p><strong style="color: #00ff00;">IDIOMA:</strong> <code>${lang === "es" ? "ESPAÑOL" : "ENGLISH"}</code></p>
          <p><strong style="color: #00ff00;">IP_DEL_CLIENTE:</strong> <code>${clientIP}</code></p>
          <hr style="border: none; border-top: 1px solid rgba(0, 255, 0, 0.2); margin: 20px 0;">
          <p><strong style="color: #00ff00;">MENSAJE:</strong></p>
          <pre style="background-color: rgba(0, 255, 0, 0.05); padding: 10px; border-left: 2px solid #00ff00; overflow-x: auto;">${sanitizedMessage}</pre>
        </div>
      </div>
    `;
    console.log("Sending email...");
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "pclimentsanfelix@gmail.com",
      subject: `[PORTFOLIO] ${sanitizedSubject}`,
      html: emailHTML
    });
    console.log("✓ Email sent successfully\n");
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("❌ Endpoint error:", error);
    console.error("Error stack:", error.stack);
    return new Response(
      JSON.stringify({ error: "Server error", details: String(error) }),
      { status: 500 }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
