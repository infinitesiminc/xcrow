import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let lead: any
  let senderInfo: any
  try {
    const body = await req.json()
    lead = body.lead
    senderInfo = body.senderInfo || {}
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!lead?.email && !lead?.name) {
    return new Response(JSON.stringify({ error: 'Lead info required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const prompt = `You are an expert cold outreach copywriter. Write a SHORT, personalized cold email (3-5 sentences max) for:

SENDER:
- Name: ${senderInfo.name || 'the sender'}
- Company: ${senderInfo.company || 'our company'}
- Service: ${senderInfo.service || 'our services'}
- Website: ${senderInfo.website || ''}

RECIPIENT:
- Name: ${lead.name || 'the recipient'}
- Title: ${lead.title || 'unknown'}
- Company: ${lead.company || 'their company'}
- Industry context: ${lead.reason || lead.summary || ''}

RULES:
1. Open with something specific about THEIR business (not generic)
2. Connect their need to the sender's service in 1 sentence
3. End with a soft CTA (quick call, coffee, etc.)
4. Tone: professional but warm, NOT salesy
5. Do NOT use placeholder brackets like [Name]
6. Return ONLY a JSON object with: { "subject": "...", "body": "...", "ctaText": "...", "ctaUrl": "" }
7. Subject line must be under 60 chars, intriguing but not clickbait`

  try {
    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are an expert cold outreach email copywriter. Always respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'draft_email',
            description: 'Return the drafted outreach email',
            parameters: {
              type: 'object',
              properties: {
                subject: { type: 'string', description: 'Email subject line' },
                body: { type: 'string', description: 'Email body text' },
                ctaText: { type: 'string', description: 'Call-to-action button text' },
                ctaUrl: { type: 'string', description: 'Call-to-action URL (can be empty)' },
              },
              required: ['subject', 'body'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'draft_email' } },
      }),
    })

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limited, please try again shortly.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const errText = await aiResp.text()
      console.error('AI gateway error:', aiResp.status, errText)
      return new Response(JSON.stringify({ error: 'Failed to generate email draft' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const aiData = await aiResp.json()
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0]
    let draft: any

    if (toolCall?.function?.arguments) {
      draft = JSON.parse(toolCall.function.arguments)
    } else {
      // Fallback: try parsing message content as JSON
      const content = aiData.choices?.[0]?.message?.content || ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        draft = JSON.parse(jsonMatch[0])
      } else {
        draft = { subject: 'Quick introduction', body: content, ctaText: '', ctaUrl: '' }
      }
    }

    return new Response(JSON.stringify({ draft }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('Draft outreach error:', e)
    return new Response(JSON.stringify({ error: 'Failed to generate draft' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
