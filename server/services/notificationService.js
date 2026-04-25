const User = require('../models/User');
const { sendBulkEmail } = require('../utils/email');

const appName = () => process.env.APP_NAME || 'CampusCore';

const escapeHtml = (s) =>
  String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const formatDateTime = (d) => {
  try {
    const dt = new Date(d);
    if (!Number.isFinite(dt.getTime())) return '';
    return dt.toLocaleString();
  } catch {
    return '';
  }
};

const safeSendBulk = async (opts) => {
  try {
    return await sendBulkEmail(opts);
  } catch {
    return { sent: 0, error: true };
  }
};

async function notifyAllUsersNewEvent({ eventName, eventDate, clubName } = {}) {
  const name = String(eventName || '').trim();
  const when = formatDateTime(eventDate);
  if (!name || !when) return { sent: 0, skipped: true };

  const users = await User.find({ email: { $exists: true, $ne: '' } })
    .select('email')
    .lean();

  const emails = (users || []).map((u) => u.email).filter(Boolean);

  const subject = `${appName()}: New event — ${name}`;
  const clubPart = clubName ? `\nClub: ${clubName}` : '';
  const text = `A new event has been added.\n\nEvent: ${name}\nDate & Time: ${when}${clubPart}`;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2 style="margin:0 0 12px 0">New event added</h2>
      <div style="margin:0 0 6px 0"><strong>Event:</strong> ${escapeHtml(name)}</div>
      <div style="margin:0 0 6px 0"><strong>Date &amp; Time:</strong> ${escapeHtml(when)}</div>
      ${clubName ? `<div style="margin:0 0 6px 0"><strong>Club:</strong> ${escapeHtml(clubName)}</div>` : ''}
      <p style="margin:12px 0 0 0;color:#6b7280;font-size:12px">Sent by ${escapeHtml(appName())}</p>
    </div>
  `;

  return safeSendBulk({ subject, text, html, bcc: emails, chunkSize: 50 });
}

async function notifyClubMembersNewMeeting({ memberEmails = [], meetingTitle, meetingDate, clubName } = {}) {
  const title = String(meetingTitle || '').trim();
  const when = formatDateTime(meetingDate);
  if (!title || !when) return { sent: 0, skipped: true };

  const emails = (Array.isArray(memberEmails) ? memberEmails : [])
    .map((e) => String(e || '').trim())
    .filter(Boolean);

  if (!emails.length) return { sent: 0, skipped: true };

  const subject = `${appName()}: New meeting — ${title}`;
  const clubPart = clubName ? `\nClub: ${clubName}` : '';
  const text = `A new meeting has been scheduled.\n\nMeeting: ${title}\nTime: ${when}${clubPart}`;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2 style="margin:0 0 12px 0">New meeting scheduled</h2>
      <div style="margin:0 0 6px 0"><strong>Meeting:</strong> ${escapeHtml(title)}</div>
      <div style="margin:0 0 6px 0"><strong>Time:</strong> ${escapeHtml(when)}</div>
      ${clubName ? `<div style="margin:0 0 6px 0"><strong>Club:</strong> ${escapeHtml(clubName)}</div>` : ''}
      <p style="margin:12px 0 0 0;color:#6b7280;font-size:12px">This email was sent only to club members.</p>
    </div>
  `;

  return safeSendBulk({ subject, text, html, bcc: emails, chunkSize: 50 });
}

module.exports = {
  notifyAllUsersNewEvent,
  notifyClubMembersNewMeeting,
};
