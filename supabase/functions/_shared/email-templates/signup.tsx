/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'

const STORAGE = 'https://xtfubistkgodiksegtcx.supabase.co/storage/v1/object/public'
const LOGO = `${STORAGE}/email-assets/xcrow-logo.png`

interface WorkspaceInsight {
  company_name?: string
  company_summary?: string
  products?: { name: string; description: string }[]
  top_niches?: string[]
}

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
  workspace?: WorkspaceInsight | null
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
  workspace,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email to start finding leads on Xcrow</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO} alt="Xcrow" width="40" height="40" style={logoStyle} />
        </Section>
        <Heading style={h1}>Welcome to Xcrow</Heading>
        <Text style={text}>
          You're one step away from discovering high-quality leads for your business.
        </Text>
        <Text style={text}>
          Confirm your email (<Link href={`mailto:${recipient}`} style={link}>{recipient}</Link>) to get started.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            Confirm Email
          </Button>
        </Section>

        {workspace?.company_name && (
          <>
            <Hr style={divider} />
            <Heading style={h2}>Your Analysis is Ready 🎯</Heading>
            <Text style={text}>
              We analyzed <strong>{workspace.company_name}</strong> while you were signing up. Here's a preview of what's waiting for you:
            </Text>
            {workspace.company_summary && (
              <Text style={summaryText}>{workspace.company_summary}</Text>
            )}
            {workspace.products && workspace.products.length > 0 && (
              <Section style={insightBox}>
                <Text style={insightLabel}>Products Identified</Text>
                {workspace.products.slice(0, 3).map((p, i) => (
                  <Text key={i} style={insightItem}>
                    <strong>{p.name}</strong> — {p.description}
                  </Text>
                ))}
              </Section>
            )}
            {workspace.top_niches && workspace.top_niches.length > 0 && (
              <Section style={insightBox}>
                <Text style={insightLabel}>Top Lead Niches</Text>
                {workspace.top_niches.slice(0, 4).map((n, i) => (
                  <Text key={i} style={insightItem}>• {n}</Text>
                ))}
              </Section>
            )}
            <Text style={ctaText}>
              Confirm your email to unlock all your leads and start outreach.
            </Text>
          </>
        )}

        <Hr style={divider} />
        <Text style={footer}>
          If you didn't create an account on Xcrow, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#f4f4f5', fontFamily: "'Inter', Arial, sans-serif" }
const container = {
  maxWidth: '480px',
  margin: '40px auto',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '40px 32px',
}
const logoSection = { textAlign: 'center' as const, marginBottom: '24px' }
const logoStyle = { margin: '0 auto', borderRadius: '10px' }
const h1 = {
  fontSize: '22px',
  fontWeight: '700' as const,
  color: '#1a1a2e',
  margin: '0 0 16px',
  textAlign: 'center' as const,
}
const h2 = {
  fontSize: '18px',
  fontWeight: '600' as const,
  color: '#1a1a2e',
  margin: '0 0 12px',
}
const text = {
  fontSize: '14px',
  color: '#55575d',
  lineHeight: '1.6',
  margin: '0 0 14px',
}
const summaryText = {
  fontSize: '13px',
  color: '#6b6b78',
  lineHeight: '1.6',
  margin: '0 0 16px',
  fontStyle: 'italic' as const,
}
const ctaText = {
  fontSize: '14px',
  color: '#1a1a2e',
  fontWeight: '600' as const,
  margin: '16px 0 0',
}
const link = { color: 'hsl(270, 70%, 55%)', textDecoration: 'underline' }
const buttonSection = { textAlign: 'center' as const, margin: '24px 0' }
const button = {
  backgroundColor: 'hsl(270, 70%, 55%)',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600' as const,
  borderRadius: '0.75rem',
  padding: '12px 28px',
  textDecoration: 'none',
}
const divider = { borderColor: '#e5e5e5', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999', margin: '0' }
const insightBox = {
  backgroundColor: '#faf9ff',
  borderRadius: '8px',
  padding: '14px 16px',
  margin: '0 0 12px',
  border: '1px solid #ede8f5',
}
const insightLabel = {
  fontSize: '11px',
  fontWeight: '700' as const,
  color: 'hsl(270, 70%, 55%)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 8px',
}
const insightItem = {
  fontSize: '13px',
  color: '#55575d',
  lineHeight: '1.5',
  margin: '0 0 4px',
}
