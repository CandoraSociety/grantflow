import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled calls (no user) or admin-only manual calls
    let isScheduled = false;
    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    } catch {
      // No authenticated user — this is a scheduled/system call, allow it
      isScheduled = true;
    }

    // Create a new conversation with MoneyMan and ask him to research + populate the Funding Database
    const prompt = `Please do a proactive funding research session. Your tasks:
1. Search the web for new grant opportunities, government funding programs, and foundation grants relevant to a Canadian nonprofit organization.
2. Focus on federal and provincial (Alberta) funders, as well as major Canadian foundations.
3. Add any new FundingSource and FundingStream records you find that aren't already in the database.
4. Also check for any new PotentialFunder prospects worth adding to the pipeline.
5. Be thorough and add as much detail as possible including deadlines, award amounts, eligibility, and application URLs.

This is an automated research run. Please proceed without waiting for further input.`;

    const conversation = await base44.asServiceRole.agents.createConversation({
      agent_name: 'MoneyMan',
      metadata: {
        name: `Automated Research Run - ${new Date().toISOString().split('T')[0]}`,
        description: 'Scheduled funding database auto-population',
      },
    });

    await base44.asServiceRole.agents.addMessage(conversation, {
      role: 'user',
      content: prompt,
    });

    return Response.json({
      success: true,
      message: 'MoneyMan research session started',
      conversation_id: conversation.id,
      scheduled: isScheduled,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});