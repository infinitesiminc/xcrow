import deptEngineering from '@/assets/dept-engineering.jpg';
import deptAiResearch from '@/assets/dept-ai-research.jpg';
import deptSales from '@/assets/dept-sales.jpg';
import deptData from '@/assets/dept-data.jpg';
import deptSecurity from '@/assets/dept-security.jpg';
import deptMarketing from '@/assets/dept-marketing.jpg';
import deptPeople from '@/assets/dept-people.jpg';
import deptFinance from '@/assets/dept-finance.jpg';
import deptLegal from '@/assets/dept-legal.jpg';
import deptCompliance from '@/assets/dept-compliance.jpg';
import deptOperations from '@/assets/dept-operations.jpg';
import deptCommunications from '@/assets/dept-communications.jpg';
import deptDefault from '@/assets/dept-default.jpg';

const DEPARTMENT_IMAGE_MAP: Record<string, string> = {
  engineering: deptEngineering,
  'ai/research': deptAiResearch,
  ai: deptAiResearch,
  research: deptAiResearch,
  sales: deptSales,
  data: deptData,
  analytics: deptData,
  security: deptSecurity,
  cybersecurity: deptSecurity,
  marketing: deptMarketing,
  people: deptPeople,
  hr: deptPeople,
  'human resources': deptPeople,
  finance: deptFinance,
  accounting: deptFinance,
  legal: deptLegal,
  compliance: deptCompliance,
  regulatory: deptCompliance,
  operations: deptOperations,
  'supply chain': deptOperations,
  logistics: deptOperations,
  communications: deptCommunications,
  pr: deptCommunications,
  'public relations': deptCommunications,
};

/**
 * Returns the appropriate department category image for a given department string.
 * Falls back to a default abstract image for unmapped departments.
 */
export function getDepartmentImage(department?: string | null): string {
  if (!department) return deptDefault;
  const key = department.toLowerCase().trim();
  return DEPARTMENT_IMAGE_MAP[key] ?? deptDefault;
}
