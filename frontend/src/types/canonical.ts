/**
 * Canonical data models and workflow contracts for SAMANVAYSETU.
 *
 * In accordance with the canonical-data boundary architecture:
 * Adapters transform department-specific raw envelopes into these canonical shapes.
 * Department-specific schemas never leak to workflow decisions or the UI.
 */

export interface CitizenProfile {
  citizen_id: string;
  full_name: string;
  name?: string; // alias for display
  date_of_birth: string; // ISO 8601 YYYY-MM-DD
  mobile?: string;
}

export interface EducationRecord {
  citizen_id: string;
  student_id: string;
  student_name: string;
  date_of_birth: string; // ISO 8601 YYYY-MM-DD
  course_name: string;
  course?: string; // alias for display
  institution_name: string;
  institution?: string; // alias for display
  enrollment_status: string; // e.g., "ACTIVE"
}

export interface IncomeRecord {
  citizen_id: string;
  applicant_name: string;
  annual_income: number;
  annual_family_income?: number; // alias for display
  certificate_number?: string;
  income_certificate_no?: string;
  financial_year: string;
}

export interface FieldMappingRule {
  sourceField: string;
  sourceType: string;
  canonicalModel: "CitizenProfile" | "EducationRecord" | "IncomeRecord";
  canonicalField: string;
  transformDescription?: string;
  required?: boolean;
}

export interface MappingIssue {
  type: "missing_field" | "unknown_field" | "unmapped_field";
  department: string;
  fieldName: string;
  message: string;
  severity: "error" | "warning";
}

export interface FieldTransformationTrace {
  department: string;
  sourceField: string;
  mappingVersion: string;
  canonicalModel: string;
  canonicalField: string;
  sourceValue: unknown;
  transformedValue: unknown;
}

export interface SchemaNormalizationResult<T> {
  canonical: T;
  issues: MappingIssue[];
  traces: FieldTransformationTrace[];
  mappingVersion: string;
  engineUsed: "deterministic" | "ai-assisted";
}

export interface EligibilityCriterion {
  id: string;
  name: string;
  requirement: string;
  actual: string;
  passed: boolean;
  explanation: string;
}

export interface EligibilityEvaluation {
  is_eligible: boolean;
  criteria: EligibilityCriterion[];
  summary: string;
  evaluated_at: string;
}

export interface ScholarshipEligibilityPolicy {
  maxAnnualIncome: number;
  currency: string;
  eligibleCourseKeywords: string[];
  eligibleEnrollmentStatuses: string[];
}

export const DEFAULT_SCHOLARSHIP_POLICY: ScholarshipEligibilityPolicy = {
  maxAnnualIncome: 300000,
  currency: "INR (₹)",
  eligibleCourseKeywords: ["Engineering", "Science", "Technology", "Degree", "B.Tech", "B.Sc", "M.Sc", "Computer"],
  eligibleEnrollmentStatuses: ["ACTIVE", "ENROLLED"],
};

export interface ConsentGrant {
  consent_id: string;
  citizen_id: string;
  purpose: string;
  departments: string[];
  data_categories: string[];
  granted_at: string;
  explicit_approval: boolean;
}

export type StepState = "pending" | "running" | "success" | "failed";

export interface WorkflowStep {
  id: string;
  stepNumber: number;
  label: string;
  department?: string;
  status: StepState;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  details?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  event_type:
    | "consent_granted"
    | "department_requested"
    | "department_response_received"
    | "normalization_completed"
    | "eligibility_evaluated"
    | "application_submitted"
    | "step_failed"
    | "step_retried";
  department?: string;
  details: Record<string, unknown>;
}

export interface CanonicalScholarshipApplication {
  application_id: string;
  application_reference: string;
  citizen_id: string;
  student_id: string;
  applicant_name: string;
  date_of_birth: string;
  course_name: string;
  institution_name: string;
  annual_income: number;
  financial_year: string;
  eligibility_status: "ELIGIBLE" | "INELIGIBLE";
  workflow_status: "DRAFT" | "PROCESSING" | "SUBMITTED" | "FAILED" | "REJECTED";
  eligibility_details: EligibilityEvaluation;
  records_verified: {
    identity: boolean;
    education: boolean;
    income: boolean;
  };
  departments_contacted: string[];
  submission_receipt?: {
    application_id: string;
    application_reference: string;
    status: string;
    received_at: string;
    source: string;
  };
  audit_events: AuditEvent[];
  created_at: string;
  completed_at?: string;
  mode: "real" | "demo";
}
