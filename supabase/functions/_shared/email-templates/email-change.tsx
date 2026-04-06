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
    <Preview>Confirm your new email address on Xcrow</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO} alt="Xcrow" width="40" height="40" style={logoStyle} />
        </Section>
        <Heading style={h1}>Confirm Email Change</Heading>
        <Text style={text}>
          You've requested to change your email from{' '}
          <Link href={`mailto:${email}`} style={link}>{email}</Link>
          {' '}to{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Text style={text}>
          Click the button below to confirm this change.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            Confirm Change
          </Button>
        </Section>
        <Hr style={divider} />
        <Text style={footer}>
          If you didn't request this change, please secure your account immediately.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

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
