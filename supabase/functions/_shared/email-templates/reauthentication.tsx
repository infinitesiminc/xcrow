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

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>🏰 Your verification rune for Xcrow.ai</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Img src="https://xtfubistkgodiksegtcx.supabase.co/storage/v1/object/public/email-assets/xcrow-logo.png" alt="Xcrow.ai" width="56" height="56" style={logoStyle} />
        </Section>
        <Hr style={divider} />
        <Heading style={h1}>Verification Rune</Heading>
        <Text style={text}>
          Speak the rune below to confirm your identity and proceed:
        </Text>
        <Section style={codeSection}>
          <Text style={codeStyle}>{token}</Text>
        </Section>
        <Hr style={divider} />
        <Text style={flavorText}>
          "Only the true champion knows the rune."
        </Text>
        <Text style={footer}>
          This rune will expire shortly. If you didn't request this, ignore this scroll.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = {
  padding: '40px 32px',
  maxWidth: '520px',
  margin: '0 auto',
  backgroundColor: '#1C1A17',
  borderRadius: '12px',
  border: '1px solid #3A3530',
}
const headerSection = { textAlign: 'center' as const, marginBottom: '8px' }
const logoStyle = { margin: '0 auto', borderRadius: '12px' }
const divider = { borderColor: '#3A3530', margin: '20px 0' }
const h1 = {
  fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif",
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#D4AF37',
  margin: '0 0 20px',
  textAlign: 'center' as const,
}
const text = {
  fontSize: '15px',
  color: '#C4BFB5',
  lineHeight: '1.7',
  margin: '0 0 18px',
  textAlign: 'center' as const,
}
const codeSection = {
  textAlign: 'center' as const,
  backgroundColor: '#2A2722',
  borderRadius: '8px',
  border: '1px solid #D4AF37',
  padding: '20px',
  margin: '24px 0',
}
const codeStyle = {
  fontFamily: "'Space Grotesk', Courier, monospace",
  fontSize: '32px',
  fontWeight: 'bold' as const,
  color: '#D4AF37',
  letterSpacing: '6px',
  margin: '0',
}
const flavorText = {
  fontSize: '13px',
  color: '#8B8579',
  fontStyle: 'italic' as const,
  textAlign: 'center' as const,
  margin: '0 0 20px',
}
const footer = { fontSize: '12px', color: '#6B6560', margin: '0' }
