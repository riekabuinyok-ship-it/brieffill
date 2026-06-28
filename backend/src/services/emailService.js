function generateClarificationEmail({ clientName, projectName, missingFields, clarificationQuestions, senderName }) {
  const questions = (missingFields || [])
    .filter((f) => f.status !== "present")
    .map((f) => f.question || `Could you provide more detail on ${f.name}?`);

  const allQuestions = questions.length > 0 ? questions : (clarificationQuestions || []);

  const subject = `Clarification needed: ${projectName}`;

  const bodyLines = [
    `Hi ${clientName},`,
    "",
    `Thank you for sharing the brief for "${projectName}". I have reviewed it and would like to gather a bit more detail to ensure full alignment before moving forward.`,
    "",
    "Could you please clarify the following?",
    "",
  ];

  allQuestions.forEach((q, i) => {
    bodyLines.push(`${i + 1}. ${q}`);
  });

  bodyLines.push(
    "",
    "Once I have these details, I can move forward confidently with the deliverables.",
    "",
    "Best regards,",
    senderName || "Your name",
    "",
    "---",
    "Reply with answers and I'll get started!"
  );

  const body = bodyLines.join("\n");

  const questionHtml = allQuestions
    .map(
      (q, i) =>
        `<tr><td style="padding:6px 0;color:#374151;font-size:14px;line-height:1.5">${i + 1}. ${escapeHtml(q)}</td></tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,Helvetica,sans-serif">
<table align="center" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin:24px auto">
<tr><td style="background:#ffffff;border-radius:8px;padding:32px">
  <h2 style="color:#2563eb;font-size:20px;margin:0 0 16px">Clarification needed: ${escapeHtml(projectName)}</h2>
  <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 12px">Hi ${escapeHtml(clientName)},</p>
  <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 12px">
    Thank you for sharing the brief for <strong>${escapeHtml(projectName)}</strong>.
    I have reviewed it and would like to gather a bit more detail to ensure full alignment before moving forward.
  </p>
  <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 12px">Could you please clarify the following?</p>
  <table cellpadding="0" cellspacing="0" style="margin:0 0 16px">${questionHtml}</table>
  <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 12px;font-style:italic">
    Once I have these details, I can move forward confidently with the deliverables.
  </p>
  <p style="color:#374151;font-size:14px;line-height:1.6;margin:0">Best regards,<br>${escapeHtml(senderName || "Your name")}</p>
</td></tr>
<tr><td style="padding:16px 32px;text-align:center">
  <p style="color:#6b7280;font-size:12px;margin:0">
    <strong>Reply with answers and I'll get started!</strong>
  </p>
</td></tr>
</table>
</body>
</html>`;

  return { subject, body, html };
}

function escapeHtml(text) {
  if (typeof text !== "string") return "";
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ============================================================
// Generic email transport
// ============================================================
// In dev (no SMTP configured) this logs to stdout so a developer can see
// what would have been sent. In production, swap this body for SendGrid /
// Mailgun / Postmark / SES using the env vars below.
async function sendEmail({ to, subject, body, html }) {
  const provider = (process.env.EMAIL_PROVIDER || "console").toLowerCase();
  if (provider === "console" || provider === "") {
    console.log("=== [email:console] ===");
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log("--- body ---");
    console.log(body || (html ? html.replace(/<[^>]+>/g, "") : ""));
    console.log("=== /[email:console] ===");
    return { ok: true, provider: "console" };
  }
  if (provider === "sendgrid") {
    const key = process.env.SENDGRID_API_KEY;
    if (!key) throw new Error("EMAIL_PROVIDER=sendgrid but SENDGRID_API_KEY is not set");
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: process.env.EMAIL_FROM || "no-reply@brieffill.app", name: "BriefFill" },
        subject,
        content: [
          { type: "text/plain", value: body || "" },
          ...(html ? [{ type: "text/html", value: html }] : []),
        ],
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`SendGrid failed: ${res.status} ${errText}`);
    }
    return { ok: true, provider: "sendgrid" };
  }
  throw new Error(`Unknown EMAIL_PROVIDER: ${provider}`);
}

module.exports = { generateClarificationEmail, sendEmail };
