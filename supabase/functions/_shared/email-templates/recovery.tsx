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
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'

const STORAGE = 'https://xtfubistkgodiksegtcx.supabase.co/storage/v1/object/public/email-assets'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>🔑 Reset your password — reclaim your stronghold</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={`${STORAGE}/castle-citadel.png`} alt="" width="520" style={heroBanner} />
        <Section style={logoOverlay}>
          <Img src={`${STORAGE}/xcrow-logo.png`} alt="Xcrow.ai" width="48" height="48" style={logoStyle} />
        </Section>
        <Section style={content}>
          <Heading style={h1}>Reclaim Your Stronghold</Heading>
          <Text style={text}>
            A request was made to reset your password. Use the seal below to forge a new one and regain access to your territories.
          </Text>
          <Section style={buttonSection}>
            <Button style={button} href={confirmationUrl}>
              🔑 Reset Password
            </Button>
          </Section>
          <Hr style={divider} />
          <Text style={flavorText}>
            "A true warrior never loses their way for long."
          </Text>
          <Text style={footer}>
            If you didn't request this, your defenses remain intact — ignore this scroll.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = {
  maxWidth: '520px',
  margin: '0 auto',
  backgroundColor: '#1C1A17',
  borderRadius: '12px',
  border: '1px solid #3A3530',
  overflow: 'hidden' as const,
}
const heroBanner = {
  width: '100%',
  height: '180px',
  objectFit: 'cover' as const,
  display: 'block' as const,
}
const logoOverlay = {
  textAlign: 'center' as const,
  marginTop: '-32px',
  marginBottom: '8px',
  position: 'relative' as const,
  zIndex: 1,
}
const logoStyle = {
  margin: '0 auto',
  borderRadius: '12px',
  border: '3px solid #D4AF37',
  backgroundColor: '#1C1A17',
}
const content = { padding: '8px 32px 40px' }
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
}
const buttonSection = { textAlign: 'center' as const, margin: '28px 0' }
const button = {
  backgroundColor: '#D4AF37',
  color: '#1C1A17',
  fontSize: '14px',
  fontWeight: '700' as const,
  fontFamily: "'Cinzel', Georgia, serif",
  borderRadius: '8px',
  padding: '14px 28px',
  textDecoration: 'none',
  letterSpacing: '0.5px',
}
const flavorText = {
  fontSize: '13px',
  color: '#8B8579',
  fontStyle: 'italic' as const,
  textAlign: 'center' as const,
  margin: '0 0 20px',
}
const footer = { fontSize: '12px', color: '#6B6560', margin: '0' }
