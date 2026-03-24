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

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>🛡️ Confirm your new identity seal</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={`${STORAGE}/sim-images/skill-hero-ai-ethics-governance.png`} alt="" width="520" style={heroBanner} />
        <Section style={logoOverlay}>
          <Img src={`${STORAGE}/xcrow-logo.png`} alt="Xcrow.ai" width="48" height="48" style={logoStyle} />
        </Section>
        <Section style={content}>
          <Heading style={h1}>New Identity Seal</Heading>
          <Text style={text}>
            You've requested to change your identity seal from{' '}
            <Link href={`mailto:${email}`} style={link}>{email}</Link>
            {' '}to{' '}
            <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
          </Text>
          <Text style={text}>
            Confirm the change below to update your records in the realm.
          </Text>
          <Section style={buttonSection}>
            <Button style={button} href={confirmationUrl}>
              🛡️ Confirm Change
            </Button>
          </Section>
          <Hr style={divider} />
          <Text style={flavorText}>
            "Guard your identity as fiercely as your kingdom."
          </Text>
          <Text style={footer}>
            If you didn't request this change, secure your account immediately.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

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
const link = { color: '#D4AF37', textDecoration: 'underline' }
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
