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
  let personaTag: string | null = null
  try {
    const body = await req.json()
    lead = body.lead
    senderInfo = body.senderInfo || {}
    personaTag = body.personaTag || null
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

  const personaContext = personaTag
    ? `\nPERSONA CONTEXT: The recipient matches the "${personaTag}" buyer persona. Tailor the hook and value prop to resonate with this persona's priorities and pain points.`
    : '';

  const prompt = `You are an elite B2B cold outreach copywriter. Draft a concise, high-converting cold email.

SENDER:
- Name: ${senderInfo.name || 'the sender'}
- Company: ${senderInfo.company || 'our company'}
- What they sell: ${senderInfo.service || 'our services'}
- Website: ${senderInfo.website || ''}

RECIPIENT:
- Name: ${lead.name || 'the recipient'}
- Title: ${lead.title || 'decision-maker'}
- Company: ${lead.company || 'their company'}
- Context: ${lead.reason || lead.summary || 'potential customer'}
${personaContext}

FORMAT RULES (this will be pasted into an email client):
1. Use plain text with line breaks — NO HTML, NO markdown
2. Structure: Greeting → Hook → Value prop → Soft CTA → Sign-off
3. Keep it 4-6 sentences total
4. First line must reference something specific about THEIR company or role
5. Mention a concrete outcome or metric if possible
6. End with a low-friction ask (quick call, 15 min chat, reply)
7. Sign off with sender's first name only
8. Do NOT use brackets, placeholders, or generic filler
9. Subject: under 50 chars, curiosity-driven, lowercase style (no Title Case)
10. Tone: confident peer-to-peer, not salesy or sycophantic

Return JSON only: { "subject": "...", "body": "..." }`

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
          { role: 'system', content: 'You are an expert cold outreach copywriter. Return valid JSON only, no markdown fences.' },
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
                body: { type: 'string', description: 'Plain text email body with \\n line breaks' },
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
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const errText = await aiResp.text()
      console.error('AI gateway error:', aiResp.status, errText)
      return new Response(JSON.stringify({ error: 'Failed to generate email draft' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const aiData = await aiResp.json()
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0]
    let draft: any

    if (toolCall?.function?.arguments) {
      draft = JSON.parse(toolCall.function.arguments)
    } else {
      const content = aiData.choices?.[0]?.message?.content || ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        draft = JSON.parse(jsonMatch[0])
      } else {
        draft = { subject: 'Quick introduction', body: content }
      }
    }

    return new Response(JSON.stringify({ draft }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('Draft outreach error:', e)
    return new Response(JSON.stringify({ error: 'Failed to generate draft' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
