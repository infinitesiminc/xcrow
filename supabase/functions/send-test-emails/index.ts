import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { SignupEmail } from '../_shared/email-templates/signup.tsx'
import { InviteEmail } from '../_shared/email-templates/invite.tsx'
import { MagicLinkEmail } from '../_shared/email-templates/magic-link.tsx'
import { RecoveryEmail } from '../_shared/email-templates/recovery.tsx'
import { EmailChangeEmail } from '../_shared/email-templates/email-change.tsx'
import { ReauthenticationEmail } from '../_shared/email-templates/reauthentication.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_NAME = 'infinitesimulation'
const SITE_URL = 'https://infinitesim.co'
const SENDER_DOMAIN = 'notify.infinitesim.co'
const FROM = `${SITE_NAME} <noreply@${SENDER_DOMAIN}>`

const templates = [
  {
    key: 'signup',
    subject: 'Confirm your email (TEST)',
    Component: SignupEmail,
    props: { siteName: SITE_NAME, siteUrl: SITE_URL, recipient: '', confirmationUrl: SITE_URL },
  },
  {
    key: 'recovery',
    subject: 'Reset your password (TEST)',
    Component: RecoveryEmail,
    props: { siteName: SITE_NAME, confirmationUrl: SITE_URL },
  },
  {
    key: 'magiclink',
    subject: 'Your login link (TEST)',
    Component: MagicLinkEmail,
    props: { siteName: SITE_NAME, confirmationUrl: SITE_URL },
  },
  {
    key: 'invite',
    subject: "You've been invited (TEST)",
    Component: InviteEmail,
    props: { siteName: SITE_NAME, siteUrl: SITE_URL, confirmationUrl: SITE_URL },
  },
  {
    key: 'email_change',
    subject: 'Confirm your new email (TEST)',
    Component: EmailChangeEmail,
    props: { siteName: SITE_NAME, email: '', newEmail: 'newemail@example.com', confirmationUrl: SITE_URL },
  },
  {
    key: 'reauthentication',
    subject: 'Your verification code (TEST)',
    Component: ReauthenticationEmail,
    props: { token: '482901' },
  },
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { to } = await req.json()

    if (!to) {
      return new Response(JSON.stringify({ error: 'Missing "to" field' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const results: { key: string; success: boolean; error?: string }[] = []

    for (const tpl of templates) {
      const props = { ...tpl.props }
      // Fill in recipient email where needed
      if ('recipient' in props) (props as any).recipient = to
      if ('email' in props && tpl.key === 'email_change') (props as any).email = to

      const html = await renderAsync(React.createElement(tpl.Component, props))
      const text = await renderAsync(React.createElement(tpl.Component, props), { plainText: true })

      const messageId = crypto.randomUUID()

      await supabase.from('email_send_log').insert({
        message_id: messageId,
        template_name: tpl.key,
        recipient_email: to,
        status: 'pending',
      })

      const { error } = await supabase.rpc('enqueue_email', {
        queue_name: 'transactional_emails',
        payload: {
          run_id: `test-${messageId}`,
          message_id: messageId,
          to,
          from: FROM,
          sender_domain: SENDER_DOMAIN,
          subject: tpl.subject,
          html,
          text,
          purpose: 'transactional',
          label: `test_${tpl.key}`,
          queued_at: new Date().toISOString(),
        },
      })

      results.push({ key: tpl.key, success: !error, error: error?.message })
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
