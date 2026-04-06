/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'

const STORAGE = 'https://xtfubistkgodiksegtcx.supabase.co/storage/v1/object/public'
const LOGO = `${STORAGE}/email-assets/xcrow-logo.png`

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Xcrow verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO} alt="Xcrow" width="40" height="40" style={logoStyle} />
        </Section>
        <Heading style={h1}>Verification Code</Heading>
        <Text style={text}>
          Use the code below to verify your identity:
        </Text>
        <Text style={codeStyle}>{token}</Text>
        <Hr style={divider} />
        <Text style={footer}>
          This code will expire shortly. If you didn't request this, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
const text = {
  fontSize: '14px',
  color: '#55575d',
  lineHeight: '1.6',
  margin: '0 0 14px',
}
const codeStyle = {
  fontFamily: "'SF Mono', 'Fira Code', Courier, monospace",
  fontSize: '32px',
  fontWeight: 'bold' as const,
  color: 'hsl(270, 70%, 55%)',
  margin: '8px 0 24px',
  textAlign: 'center' as const,
  letterSpacing: '6px',
}
const divider = { borderColor: '#e5e5e5', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999', margin: '0' }
