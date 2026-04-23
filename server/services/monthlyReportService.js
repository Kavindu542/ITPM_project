const Club = require('../models/Club');
const Meeting = require('../models/Meeting');
const Event = require('../models/Event');
const Attendance = require('../models/attendanceModel');
const User = require('../models/User');
const { sendEmail } = require('../utils/email');

const pad2 = (n) => String(n).padStart(2, '0');

const formatMonthKey = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}`;
};

const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
const startOfNextMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);

const isFirstLocalDayOfMonth = (d) => {
  const dt = new Date(d);
  return dt.getDate() === 1;
};

const previousMonthDate = (d) => {
  const dt = new Date(d);
  // Day 0 of the current month is the last day of the previous month.
  return new Date(dt.getFullYear(), dt.getMonth(), 0);
};

const buildAttendanceIndex = async (attendanceRows) => {
  const uniqueStudentIds = [
    ...new Set(
      (attendanceRows || [])
        .map((r) => String(r.studentId || '').trim())
        .filter(Boolean)
        .map((sid) => sid.toUpperCase()),
    ),
  ];

  const users = uniqueStudentIds.length
    ? await User.find({ studentId: { $in: uniqueStudentIds } })
        .select('studentId name email')
        .lean()
    : [];

  const byStudentId = new Map(
    users.map((u) => [String(u.studentId || '').trim().toUpperCase(), u]),
  );

  return byStudentId;
};

const buildMonthlyReportData = async ({ clubId, start, end }) => {
  const now = new Date();
  const endClamped = end.getTime() > now.getTime() ? now : end;
  if (start.getTime() >= endClamped.getTime()) {
    return {
      start,
      end: endClamped,
      totals: {
        meetingsCount: 0,
        eventsCount: 0,
        totalAttendanceMarks: 0,
        averageAttendancePerMeeting: 0,
      },
      meetings: [],
      events: [],
    };
  }

  const meetingFilter = {
    club: clubId,
    date: { $gte: start, $lt: endClamped },
    $or: [
      { isDeleted: { $ne: true } },
      {
        $and: [
          { isDeleted: true },
          { deletedAt: { $ne: null } },
          { $expr: { $gte: ['$deletedAt', '$date'] } },
        ],
      },
    ],
  };

  const eventFilter = {
    club: clubId,
    date: { $gte: start, $lt: endClamped },
    $or: [
      { isDeleted: { $ne: true } },
      {
        $and: [
          { isDeleted: true },
          { deletedAt: { $ne: null } },
          { $expr: { $gte: ['$deletedAt', '$date'] } },
        ],
      },
    ],
  };

  const meetings = await Meeting.find(meetingFilter)
    .select('_id title date venue description')
    .sort({ date: 1 })
    .lean();

  const events = await Event.find(eventFilter)
    .select('_id name date venue type')
    .sort({ date: 1 })
    .lean();

  const meetingIds = meetings.map((m) => m._id);

  const attendanceRows = meetingIds.length
    ? await Attendance.find({ club: clubId, meeting: { $in: meetingIds } })
        .select('_id meeting studentId markedAt')
        .sort({ markedAt: 1 })
        .lean()
    : [];

  const groupedAttendance = new Map();
  for (const row of attendanceRows) {
    const key = String(row.meeting);
    if (!groupedAttendance.has(key)) groupedAttendance.set(key, []);
    groupedAttendance.get(key).push(row);
  }

  const byStudentId = await buildAttendanceIndex(attendanceRows);

  const meetingItems = meetings.map((m) => {
    const rows = groupedAttendance.get(String(m._id)) || [];
    const attendees = rows.map((r) => {
      const sid = String(r.studentId || '').trim().toUpperCase();
      const u = byStudentId.get(sid);
      return {
        studentId: sid,
        studentName: u?.name || null,
        studentEmail: u?.email || null,
        markedAt: r.markedAt,
      };
    });

    return {
      id: m._id,
      title: m.title,
      date: m.date,
      venue: m.venue || '',
      description: m.description || '',
      attendanceCount: attendees.length,
      attendees,
    };
  });

  const eventItems = (events || []).map((e) => ({
    id: e._id,
    name: e.name,
    date: e.date,
    venue: e.venue || '',
    type: e.type || 'Public',
  }));

  const totals = {
    meetingsCount: meetingItems.length,
    eventsCount: eventItems.length,
    totalAttendanceMarks: attendanceRows.length,
    averageAttendancePerMeeting: meetingItems.length
      ? attendanceRows.length / meetingItems.length
      : 0,
  };

  return {
    start,
    end: endClamped,
    totals,
    meetings: meetingItems,
    events: eventItems,
  };
};

const escapeHtml = (s) =>
  String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const monthName = (d) =>
  new Date(d).toLocaleString(undefined, { month: 'long', year: 'numeric' });

const formatPct = (count, denom) => {
  const c = Number(count);
  const d = Number(denom);
  if (!Number.isFinite(c) || !Number.isFinite(d) || d <= 0) return 'N/A';
  return `${((c / d) * 100).toFixed(0)}%`;
};

const buildMonthlyReportEmail = ({ clubName, leaderName, memberCount, monthLabel, report }) => {
  const meetingsRows = (report.meetings || [])
    .map((m) => {
      const dateStr = m.date ? new Date(m.date).toLocaleString() : '';
      return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(m.title)}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;white-space:nowrap;">${escapeHtml(dateStr)}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${m.attendanceCount ?? 0}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${escapeHtml(formatPct(m.attendanceCount ?? 0, memberCount))}</td>
        </tr>
      `;
    })
    .join('');

  const eventsRows = (report.events || [])
    .map((e) => {
      const dateStr = e.date ? new Date(e.date).toLocaleString() : '';
      return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(e.name)}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;white-space:nowrap;">${escapeHtml(dateStr)}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(e.venue || '')}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(e.type || '')}</td>
        </tr>
      `;
    })
    .join('');

  const avgCount = Number(report?.totals?.averageAttendancePerMeeting) || 0;
  const avgPct = formatPct(avgCount, memberCount);

  return {
    subject: `${clubName} monthly report (${monthLabel})`,
    text: `Monthly report for ${clubName} (${monthLabel}).`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5">
        <h2 style="margin:0 0 8px 0">${escapeHtml(clubName)} — Monthly Report</h2>
        <div style="color:#555;margin:0 0 14px 0">${escapeHtml(monthLabel)}${leaderName ? ` • Leader: ${escapeHtml(leaderName)}` : ''}</div>

        <div style="margin:0 0 16px 0;padding:12px;border:1px solid #e5e7eb;border-radius:12px;background:#f9fafb">
          <div><strong>Meetings:</strong> ${report?.totals?.meetingsCount ?? 0}</div>
          <div><strong>Events:</strong> ${report?.totals?.eventsCount ?? 0}</div>
          <div><strong>Total attendance marks:</strong> ${report?.totals?.totalAttendanceMarks ?? 0}</div>
          <div><strong>Member count:</strong> ${memberCount || 'N/A'}</div>
          <div><strong>Average attendance per meeting:</strong> ${avgCount.toFixed(1)} (${escapeHtml(avgPct)})</div>
        </div>

        <h3 style="margin:18px 0 8px 0">Meetings & Attendance</h3>
        ${(report.meetings || []).length ? `
          <table style="border-collapse:collapse;width:100%;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
            <thead>
              <tr style="background:#f3f4f6">
                <th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb;">Meeting</th>
                <th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb;">Date</th>
                <th style="text-align:right;padding:8px;border-bottom:1px solid #e5e7eb;">Attendance</th>
                <th style="text-align:right;padding:8px;border-bottom:1px solid #e5e7eb;">Attendance %</th>
              </tr>
            </thead>
            <tbody>${meetingsRows}</tbody>
          </table>
        ` : `<div style="color:#666">No meetings held in this month.</div>`}

        <h3 style="margin:18px 0 8px 0">Events Held</h3>
        ${(report.events || []).length ? `
          <table style="border-collapse:collapse;width:100%;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
            <thead>
              <tr style="background:#f3f4f6">
                <th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb;">Event</th>
                <th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb;">Date</th>
                <th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb;">Venue</th>
                <th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb;">Type</th>
              </tr>
            </thead>
            <tbody>${eventsRows}</tbody>
          </table>
        ` : `<div style="color:#666">No events held in this month.</div>`}

        <p style="margin:18px 0 0 0;color:#6b7280;font-size:12px">This report is generated automatically at the end of the month.</p>
      </div>
    `,
  };
};

const sendMonthlyReportForClub = async ({ club, now = new Date() } = {}) => {
  if (!club) return { sent: false, reason: 'club_missing' };
  if (!club.monthlyReportEmailEnabled) return { sent: false, reason: 'disabled' };

  const leader = club.leader;
  const leaderEmail = leader?.email;
  if (!leaderEmail) return { sent: false, reason: 'leader_email_missing' };

  const reportMonth = previousMonthDate(now);
  const monthKey = formatMonthKey(reportMonth);
  if (String(club.monthlyReportLastSentMonth || '') === monthKey) {
    return { sent: false, reason: 'already_sent' };
  }

  const monthStart = startOfMonth(reportMonth);
  const monthEnd = startOfNextMonth(reportMonth);
  const report = await buildMonthlyReportData({ clubId: club._id, start: monthStart, end: monthEnd });

  const memberCount = Array.isArray(club.members) ? club.members.length : 0;
  const monthLabel = monthName(monthStart);
  const email = buildMonthlyReportEmail({
    clubName: club.name,
    leaderName: leader?.name || '',
    memberCount,
    monthLabel,
    report,
  });

  await sendEmail({
    to: leaderEmail,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });

  await Club.updateOne(
    { _id: club._id },
    { $set: { monthlyReportLastSentMonth: monthKey, updatedAt: new Date() } },
  );

  return { sent: true };
};

const sendMonthlyReportsForAllEnabledClubs = async ({ now = new Date() } = {}) => {
  const clubs = await Club.find({ monthlyReportEmailEnabled: true, leader: { $ne: null } })
    .populate('leader', '_id name email')
    .select('_id name leader members monthlyReportEmailEnabled monthlyReportLastSentMonth')
    .lean();

  let sent = 0;
  let skipped = 0;

  for (const club of clubs) {
    try {
      const res = await sendMonthlyReportForClub({ club, now });
      if (res.sent) sent += 1;
      else skipped += 1;
    } catch {
      skipped += 1;
    }
  }

  return { sent, skipped, total: clubs.length };
};

const maybeSendMonthEndReports = async ({ now = new Date() } = {}) => {
  // Run on the 1st day of the month and send the previous month’s report.
  if (!isFirstLocalDayOfMonth(now)) return { ran: false };
  const res = await sendMonthlyReportsForAllEnabledClubs({ now });
  return { ran: true, ...res };
};

module.exports = {
  maybeSendMonthEndReports,
  sendMonthlyReportsForAllEnabledClubs,
};
