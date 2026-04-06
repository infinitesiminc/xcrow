/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as leadOutreach } from './lead-outreach.tsx'
import { template as welcomeSignup } from './welcome-signup.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'lead-outreach': leadOutreach,
  'welcome-signup': welcomeSignup,
}
