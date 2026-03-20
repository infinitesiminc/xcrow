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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email for Crowy.ai</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://xtfubistkgodiksegtcx.supabase.co/storage/v1/object/public/email-assets/logo.png" alt="Crowy.ai" width="140" height="auto" style={{ marginBottom: '30px' }} />
        <Heading style={h1}>Welcome to Crowy.ai</Heading>
        <Text style={text}>
          Thanks for signing up! Confirm your email address (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) to get started analyzing how AI impacts your role.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Get Started
        </Button>
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
