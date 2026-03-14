import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const SENDER_DOMAIN = 'notify.infinitesim.co'
const FROM_DOMAIN = 'notify.infinitesim.co'
const SITE_NAME = 'infinitesimulation'
const RECIPIENT = 'jackson@infinitesim.co'

function buildContactHtml(data: {
  name: string
  email: string
  subject?: string
  message?: string
  company?: string
  teamSize?: string
  formType: string
}) {
  const rows = [
    `<tr><td style="padding:8px 12px;font-weight:600;color:#666;width:120px">Name</td><td style="padding:8px 12px">${escapeHtml(data.name)}</td></tr>`,
    `<tr><td style="padding:8px 12px;font-weight:600;color:#666">Email</td><td style="padding:8px 12px"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td></tr>`,
  ]
  if (data.company) rows.push(`<tr><td style="padding:8px 12px;font-weight:600;color:#666">Company</td><td style="padding:8px 12px">${escapeHtml(data.company)}</td></tr>`)
  if (data.teamSize) rows.push(`<tr><td style="padding:8px 12px;font-weight:600;color:#666">Team Size</td><td style="padding:8px 12px">${escapeHtml(data.teamSize)}</td></tr>`)
  if (data.subject) rows.push(`<tr><td style="padding:8px 12px;font-weight:600;color:#666">Subject</td><td style="padding:8px 12px">${escapeHtml(data.subject)}</td></tr>`)
  if (data.message) rows.push(`<tr><td style="padding:8px 12px;font-weight:600;color:#666">Message</td><td style="padding:8px 12px;white-space:pre-wrap">${escapeHtml(data.message)}</td></tr>`)

  return `<!DOCTYPE html><html><body style="font-family:sans-serif;color:#1a1a1a;padding:24px">
<h2 style="margin:0 0 16px">New ${data.formType === 'org' ? 'Organization Inquiry' : 'Contact Message'}</h2>
<table style="border-collapse:collapse;width:100%;max-width:500px">${rows.join('')}</table>
<p style="margin-top:24px;color:#999;font-size:12px">Sent from infinitesimulation.lovable.app</p>
</body></html>`
}

function buildPlainText(data: Record<string, string | undefined>, formType: string) {
  const lines = [`New ${formType === 'org' ? 'Organization Inquiry' : 'Contact Message'}`, '']
  if (data.name) lines.push(`Name: ${data.name}`)
  if (data.email) lines.push(`Email: ${data.email}`)
  if (data.company) lines.push(`Company: ${data.company}`)
  if (data.teamSize) lines.push(`Team Size: ${data.teamSize}`)
  if (data.subject) lines.push(`Subject: ${data.subject}`)
  if (data.message) lines.push(`\nMessage:\n${data.message}`)
  return lines.join('\n')
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { name, email, subject, message, company, teamSize, formType = 'general' } = await req.json()

    if (!name || !email) {
      return new Response(JSON.stringify({ error: 'Name and email are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const messageId = `contact-${crypto.randomUUID()}`
    const html = buildContactHtml({ name, email, subject, message, company, teamSize, formType })
    const text = buildPlainText({ name, email, subject, message, company, teamSize }, formType)
    const emailSubject = formType === 'org'
      ? `[Org Inquiry] ${company || name}`
      : `[Contact] ${subject || 'General inquiry'} — ${name}`

    // Log pending
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: 'contact_form',
      recipient_email: RECIPIENT,
      status: 'pending',
      metadata: { sender_name: name, sender_email: email, form_type: formType },
    })

    // Enqueue
    const { error: enqueueError } = await supabase.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload: {
        message_id: messageId,
        to: RECIPIENT,
        reply_to: email,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject: emailSubject,
        html,
        text,
        purpose: 'transactional',
        label: 'contact_form',
        queued_at: new Date().toISOString(),
      },
    })

    if (enqueueError) {
      console.error('Failed to enqueue contact email', enqueueError)
      await supabase.from('email_send_log').insert({
        message_id: messageId,
        template_name: 'contact_form',
        recipient_email: RECIPIENT,
        status: 'failed',
        error_message: 'Failed to enqueue email',
      })
      return new Response(JSON.stringify({ error: 'Failed to send message' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Contact email error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
