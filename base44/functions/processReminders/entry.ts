import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Allow both scheduled (no user) and manual calls (admin only)
  try {
    const user = await base44.auth.me();
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
  } catch (_) {
    // No user = called from scheduler, that's fine
  }

  const now = new Date().toISOString();

  // Fetch all pending reminders whose remind_at has passed
  const reminders = await base44.asServiceRole.entities.Reminder.filter({ status: 'pending' });
  const due = reminders.filter(r => r.remind_at <= now);

  let sent = 0;
  for (const reminder of due) {
    const label = reminder.reminder_type === 'submission_deadline' ? 'Submission Deadline' : 'Opens for Submissions';
    const subject = `Reminder: ${label} — ${reminder.project_title}`;
    const body = `
Hi,

This is a reminder that the <strong>${label}</strong> for the following proposal is approaching:

<strong>${reminder.project_title}</strong> (${reminder.funder_name})

Please log in to GrantFlow to review and take action.

— GrantFlow
    `.trim();

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: reminder.recipient_email,
      subject,
      body,
    });

    await base44.asServiceRole.entities.Reminder.update(reminder.id, { status: 'sent' });
    sent++;
  }

  return Response.json({ processed: due.length, sent });
});