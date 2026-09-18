import nodemailer from 'nodemailer';

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  return transporter;
}

export async function sendEmergencyAlert({ staffId, recipientEmails, role, patient, reason }) {
  if (!recipientEmails || recipientEmails.length === 0) {
    console.warn('Emergency email not sent: no admin email addresses are configured.');
    return false;
  }

  await getTransporter().sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: recipientEmails,
    subject: `Emergency access alert: ${patient.name}`,
    text: [
      'An emergency patient-record access event has been recorded.',
      '',
      `Staff: ${staffId} (${role})`,
      `Patient: ${patient.name} (${patient.id})`,
      `Ward: ${patient.ward_name}`,
      `Reason: ${reason}`,
      `Time: ${new Date().toISOString()}`
    ].join('\n')
  });

  return true;
}