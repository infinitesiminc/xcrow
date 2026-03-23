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

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>📜 You've been summoned — join the guild on Xcrow.ai</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Img src="https://xtfubistkgodiksegtcx.supabase.co/storage/v1/object/public/email-assets/xcrow-logo.png" alt="Xcrow.ai" width="56" height="56" style={logoStyle} />
        </Section>
        <Hr style={divider} />
        <Heading style={h1}>You've Been Summoned</Heading>
        <Text style={text}>
          A guild on{' '}
          <Link href={siteUrl} style={link}>
            <strong>Xcrow.ai</strong>
          </Link>{' '}
          has called for reinforcements. Accept the summons to join the ranks and begin conquering new territories together.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            📜 Accept the Summons
          </Button>
        </Section>
        <Hr style={divider} />
        <Text style={flavorText}>
          "Allies forge the strongest kingdoms."
        </Text>
        <Text style={footer}>
          If you weren't expecting this invitation, you can safely ignore this scroll.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

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
