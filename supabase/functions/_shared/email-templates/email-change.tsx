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
  Text,
} from 'npm:@react-email/components@0.0.22'

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
    <Preview>Confirm your email change for Infinite Sim</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://xtfubistkgodiksegtcx.supabase.co/storage/v1/object/public/email-assets/logo.png" alt="Infinite Sim" width="140" height="auto" style={{ marginBottom: '30px' }} />
        <Heading style={h1}>Confirm your email change</Heading>
        <Text style={text}>
          You requested to change your email from{' '}
          <Link href={`mailto:${email}`} style={link}>{email}</Link>{' '}
          to{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirm Email Change
        </Button>
        <Text style={footer}>
          If you didn't request this change, please secure your account immediately.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#F5F0E8', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '40px 32px', maxWidth: '480px', margin: '0 auto' }
const h1 = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#1C1A17',
  margin: '0 0 20px',
}
const text = {
  fontSize: '15px',
  color: '#757168',
  lineHeight: '1.6',
  margin: '0 0 28px',
}
const link = { color: '#1C1A17', textDecoration: 'underline' }
const button = {
  backgroundColor: '#1C1A17',
  color: '#F5F0E8',
  fontSize: '14px',
  fontWeight: '600' as const,
  borderRadius: '10px',
  padding: '14px 24px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#9E9A90', margin: '32px 0 0' }
