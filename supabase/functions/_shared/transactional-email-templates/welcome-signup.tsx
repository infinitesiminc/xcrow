import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Section, Img,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Xcrow"
const STORAGE = 'https://xtfubistkgodiksegtcx.supabase.co/storage/v1/object/public'
const LOGO = `${STORAGE}/email-assets/xcrow-logo.png`
const APP_URL = 'https://xcrow.lovable.app'

interface WelcomeSignupProps {
  displayName?: string
  websiteUrl?: string
  nichesFound?: number
  leadsFound?: number
  companySummary?: string
  icpSummary?: string
}

const WelcomeSignupEmail = ({
  displayName,
  websiteUrl,
  nichesFound,
  leadsFound,
  companySummary,
  icpSummary,
}: WelcomeSignupProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      {websiteUrl
        ? `Your workspace for ${websiteUrl} is ready — ${leadsFound || 0} leads found`
        : `Welcome to ${SITE_NAME} — your lead gen machine is ready`}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO} alt="Xcrow" width="40" height="40" style={logoImgStyle} />
        </Section>

        <Heading style={h1}>
          {displayName ? `Welcome, ${displayName}!` : `Welcome to ${SITE_NAME}!`}
        </Heading>

        <Text style={text}>
          Your account is set up and ready to go. Here's a summary of what we found:
        </Text>

        {websiteUrl && (
          <Section style={workspaceCard}>
            <Text style={cardLabel}>WORKSPACE</Text>
            <Text style={cardValue}>{websiteUrl}</Text>

            {companySummary && (
              <>
                <Text style={cardLabel}>COMPANY INSIGHT</Text>
                <Text style={cardDetail}>{companySummary}</Text>
              </>
            )}

            {icpSummary && (
              <>
                <Text style={cardLabel}>ICP SUMMARY</Text>
                <Text style={cardDetail}>{icpSummary}</Text>
              </>
            )}

            <Section style={statsRow}>
              {nichesFound != null && (
                <Text style={statItem}>
                  <span style={statNumber}>{nichesFound}</span> niches mapped
                </Text>
              )}
              {leadsFound != null && (
                <Text style={statItem}>
                  <span style={statNumber}>{leadsFound}</span> leads discovered
                </Text>
              )}
            </Section>
          </Section>
        )}

        <Button style={button} href={`${APP_URL}/leadgen`}>
          Continue Hunting Leads →
        </Button>

        <Hr style={hr} />

        <Text style={footerText}>
          You signed up on {SITE_NAME}, the fastest B2B lead gen machine. 
          Reply to this email if you need any help getting started.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeSignupEmail,
  subject: (data: Record<string, any>) =>
    data.websiteUrl
      ? `Your ${data.websiteUrl} workspace is ready — ${data.leadsFound || 0} leads found`
      : `Welcome to ${SITE_NAME} — your lead gen machine is ready`,
  displayName: 'Welcome signup',
  previewData: {
    displayName: 'Jackson',
    websiteUrl: 'hairobotics.com',
    nichesFound: 5,
    leadsFound: 12,
    companySummary: 'AI-powered hair restoration robotics company targeting medical clinics.',
    icpSummary: 'Dermatology clinics, hair transplant surgeons, and med-spa chains with 10-50 employees.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }

const logoSection = { textAlign: 'center' as const, marginBottom: '24px' }
const logoImgStyle = { margin: '0 auto', borderRadius: '10px' }

const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#1a1a2e', margin: '24px 0 12px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }

const workspaceCard = {
  backgroundColor: '#f8f7ff',
  border: '1px solid #e8e5f0',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 24px',
}
const cardLabel = {
  fontSize: '10px',
  fontWeight: '700' as const,
  color: 'hsl(270, 70%, 55%)',
  letterSpacing: '0.1em',
  margin: '0 0 4px',
  textTransform: 'uppercase' as const,
}
const cardValue = {
  fontSize: '16px',
  fontWeight: '600' as const,
  color: '#1a1a2e',
  margin: '0 0 16px',
}
const cardDetail = {
  fontSize: '13px',
  color: '#555',
  lineHeight: '1.5',
  margin: '0 0 16px',
}

const statsRow = { margin: '8px 0 0' }
const statItem = { fontSize: '14px', color: '#333', margin: '4px 0' }
const statNumber = { fontWeight: '700' as const, color: 'hsl(270, 70%, 55%)' }

const button = {
  backgroundColor: 'hsl(270, 70%, 55%)',
  color: '#ffffff',
  borderRadius: '0.75rem',
  padding: '14px 28px',
  fontSize: '14px',
  fontWeight: '600' as const,
  textDecoration: 'none' as const,
  display: 'inline-block' as const,
  margin: '0 0 24px',
}
const hr = { borderColor: '#e5e5e5', margin: '0 0 16px' }
const footerText = { fontSize: '12px', color: '#999', lineHeight: '1.5', margin: '0' }
