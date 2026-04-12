import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Section, Img,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Xcrow"
const STORAGE = 'https://xtfubistkgodiksegtcx.supabase.co/storage/v1/object/public'
const LOGO = `${STORAGE}/email-assets/xcrow-logo.png`

interface LeadOutreachProps {
  recipientName?: string
  senderName?: string
  senderCompany?: string
  senderTitle?: string
  emailBody?: string
  ctaText?: string
  ctaUrl?: string
}

const LeadOutreachEmail = ({
  recipientName,
  senderName,
  senderCompany,
  emailBody,
  ctaText,
  ctaUrl,
}: LeadOutreachProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      {recipientName
        ? `Hi ${recipientName}, a quick note from ${senderCompany || SITE_NAME}`
        : `A quick note from ${senderCompany || SITE_NAME}`}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO} alt="Xcrow" width="40" height="40" style={logoStyle} />
        </Section>

        {recipientName ? (
          <Heading style={h1}>Hi {recipientName},</Heading>
        ) : (
          <Heading style={h1}>Hello,</Heading>
        )}

        {emailBody ? (
          emailBody.split('\n').map((line, i) => (
            <Text key={i} style={text}>{line}</Text>
          ))
        ) : (
          <Text style={text}>
            I wanted to reach out and introduce myself. I believe we could work well together.
          </Text>
        )}

        {ctaText && ctaUrl && (
          <Button style={button} href={ctaUrl}>
            {ctaText}
          </Button>
        )}

        <Hr style={hr} />

        <Text style={footer}>
          {senderName && `${senderName}`}
          {senderCompany && ` · ${senderCompany}`}
        </Text>
        <Text style={footerSmall}>
          Sent via {SITE_NAME}
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: LeadOutreachEmail,
  subject: (data: Record<string, any>) =>
    data.subject || `Quick note from ${data.senderCompany || SITE_NAME}`,
  displayName: 'Lead outreach',
  previewData: {
    recipientName: 'Jane',
    senderName: 'Alex',
    senderCompany: 'Kangaroo Notary',
    emailBody: 'I noticed your firm handles a high volume of closings and wanted to introduce our 24/7 mobile notary service. We specialize in fast, reliable document authentication across Los Angeles.\n\nWould you be open to a quick call this week?',
    subject: 'Mobile notary services for your firm',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '520px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '24px' }
const logoStyle = { margin: '0 auto', borderRadius: '10px' }
const h1 = { fontSize: '20px', fontWeight: '600' as const, color: '#1a1a2e', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 12px' }
const button = {
  backgroundColor: 'hsl(270, 70%, 55%)',
  color: '#ffffff',
  borderRadius: '0.75rem',
  padding: '12px 24px',
  fontSize: '14px',
  fontWeight: '600' as const,
  textDecoration: 'none' as const,
  display: 'inline-block' as const,
  margin: '16px 0',
}
const hr = { borderColor: '#e5e5e5', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#333', margin: '0 0 4px', fontWeight: '500' as const }
const footerSmall = { fontSize: '11px', color: '#999', margin: '0' }
