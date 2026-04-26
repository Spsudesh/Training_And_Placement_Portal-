const nodemailer = require('nodemailer');

function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getMailConfig() {
  const service = String(process.env.MAIL_SERVICE || '').trim();
  const host = String(process.env.MAIL_HOST || '').trim();
  const port = toNumber(process.env.MAIL_PORT, service ? undefined : 587);
  const user = String(process.env.MAIL_USER || process.env.TPO_EMAIL || '').trim();
  const pass = String(process.env.MAIL_PASS || '').trim();
  const from = String(process.env.MAIL_FROM || user || process.env.TPO_EMAIL || '').trim();
  const secure = toBoolean(process.env.MAIL_SECURE, port === 465);

  return {
    service,
    host,
    port,
    secure,
    user,
    pass,
    from,
  };
}

function validateMailConfig(config) {
  if (!config.user || !config.pass || !config.from) {
    const error = new Error(
      'Mail is not configured. Set MAIL_USER, MAIL_PASS, and MAIL_FROM in the server environment.'
    );
    error.statusCode = 500;
    throw error;
  }

  if (!config.service && !config.host) {
    const error = new Error(
      'Mail is not configured. Set MAIL_SERVICE or MAIL_HOST in the server environment.'
    );
    error.statusCode = 500;
    throw error;
  }
}

function createTransporter(config) {
  validateMailConfig(config);

  if (config.service) {
    return nodemailer.createTransport({
      service: config.service,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

async function sendNoticeEmail({ recipients, subject, text, html, attachments = [] }) {
  const config = getMailConfig();
  const transporter = createTransporter(config);
  const cleanedRecipients = Array.isArray(recipients)
    ? recipients.map((item) => String(item || '').trim()).filter(Boolean)
    : [];

  if (!cleanedRecipients.length) {
    const error = new Error('No recipient emails were found for the selected audience.');
    error.statusCode = 400;
    throw error;
  }

  const result = await transporter.sendMail({
    from: config.from,
    to: config.from,
    bcc: cleanedRecipients,
    subject,
    text,
    html,
    attachments,
  });

  return {
    messageId: result.messageId,
    accepted: Array.isArray(result.accepted) ? result.accepted : [],
    rejected: Array.isArray(result.rejected) ? result.rejected : [],
  };
}

module.exports = {
  sendNoticeEmail,
};
