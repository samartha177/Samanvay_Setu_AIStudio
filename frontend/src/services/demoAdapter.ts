/**
 * Local deterministic demo simulation adapter for SAMANVAYSETU.
 *
 * This adapter provides local deterministic fallbacks for the AI Studio preview
 * environment when the live FastAPI gateway or department microservices are unreachable.
 *
 * It mirrors the departmental seed data and behavior from:
 * - mock-services/identity
 * - mock-services/education
 * - mock-services/income
 * - mock-services/scholarship
 */

import type {
  AuditEvent,
  CanonicalScholarshipApplication,
  CitizenProfile,
  ConsentGrant,
  EducationRecord,
  IncomeRecord,
  ScholarshipEligibilityPolicy,
  WorkflowStep,
} from "../types/canonical";
import { DEFAULT_SCHOLARSHIP_POLICY } from "../types/canonical";
import type { HealthResponse } from "../types/health";
import {
  evaluateScholarshipEligibility,
  normalizeEducationRecord,
  normalizeIdentityRecord,
  normalizeIncomeRecord,
} from "./normalizer";

export interface SimulatedCitizen {
  citizen_id: string;
  full_name: string;
  dob: string;
  mobile: string;
}

export interface SimulatedStudent {
  studentId: string;
  studentName: string;
  birthDate: string;
  courseName: string;
  institutionName: string;
  verification: {
    recordStatus: string;
    sourceSystem: string;
  };
}

export interface SimulatedIncome {
  applicant_name: string;
  annual_income: number;
  financial_year: string;
  query: {
    lookupKey: string;
    registry: string;
  };
}

export interface SimulatedScholarshipReceipt {
  application_id: string;
  application_reference: string;
  status: string;
  received_at: string;
  source: string;
}

export interface WorkflowOptions {
  simulatedFailures?: {
    identity?: boolean;
    education?: boolean;
    income?: boolean;
    scholarship?: boolean;
  };
  policy?: ScholarshipEligibilityPolicy;
  stepDelayMs?: number;
  onStepUpdate?: (steps: WorkflowStep[]) => void;
  onAuditEvent?: (event: AuditEvent) => void;
}

const STORAGE_KEY = "samanvaysetu_applications_v1";

export function createInitialWorkflowSteps(): WorkflowStep[] {
  return [
    { id: "step-1", stepNumber: 1, label: "Application submitted", status: "pending" },
    { id: "step-2", stepNumber: 2, label: "Consent verified", status: "pending" },
    { id: "step-3", stepNumber: 3, label: "Identity record retrieved", department: "Identity Department", status: "pending" },
    { id: "step-4", stepNumber: 4, label: "Education record retrieved", department: "Education Department", status: "pending" },
    { id: "step-5", stepNumber: 5, label: "Income record retrieved", department: "Income Department", status: "pending" },
    { id: "step-6", stepNumber: 6, label: "Records normalized", status: "pending" },
    { id: "step-7", stepNumber: 7, label: "Eligibility verified", status: "pending" },
    { id: "step-8", stepNumber: 8, label: "Scholarship application submitted", department: "Scholarship Department", status: "pending" },
    { id: "step-9", stepNumber: 9, label: "Final status", status: "pending" },
  ];
}

class DemoSimulationAdapter {
  private readonly seedCitizens: Record<string, SimulatedCitizen> = {
    "CIT-1001": {
      citizen_id: "CIT-1001",
      full_name: "Aarav Sharma",
      dob: "2003-07-14",
      mobile: "9999999999",
    },
    "CIT-1002": {
      citizen_id: "CIT-1002",
      full_name: "Diya Verma",
      dob: "2004-11-02",
      mobile: "9888888888",
    },
  };

  private readonly seedStudents: Record<string, SimulatedStudent> = {
    "STU-5001": {
      studentId: "STU-5001",
      studentName: "Aarav Sharma",
      birthDate: "14/07/2003",
      courseName: "B.Tech Computer Engineering",
      institutionName: "Innovexa Institute",
      verification: {
        recordStatus: "ACTIVE",
        sourceSystem: "EDU-SIS",
      },
    },
    "STU-5002": {
      studentId: "STU-5002",
      studentName: "Diya Verma",
      birthDate: "02/11/2004",
      courseName: "B.Sc Data Science",
      institutionName: "Innovexa Institute",
      verification: {
        recordStatus: "ACTIVE",
        sourceSystem: "EDU-SIS",
      },
    },
  };

  private readonly seedIncome: Record<string, SimulatedIncome> = {
    "CIT-1001": {
      applicant_name: "Aarav Sharma",
      annual_income: 240000,
      financial_year: "FY 2025/26",
      query: {
        lookupKey: "CIT-1001",
        registry: "ITR-DEMO",
      },
    },
    "CIT-1002": {
      applicant_name: "Diya Verma",
      annual_income: 315000,
      financial_year: "FY 2025/26",
      query: {
        lookupKey: "CIT-1002",
        registry: "ITR-DEMO",
      },
    },
  };

  private inMemoryApplications: CanonicalScholarshipApplication[] = [];

  constructor() {
    this.loadApplicationsFromStorage();
  }

  getSimulatedHealth(): HealthResponse {
    return {
      status: "healthy",
      service: "SAMANVAYSETU Gateway (Local Simulation)",
      version: "0.1.0-demo",
      environment: "local-simulation",
      timestamp: new Date().toISOString(),
    };
  }

  getCitizen(citizenId: string): SimulatedCitizen | null {
    return this.seedCitizens[citizenId.trim().toUpperCase()] ?? null;
  }

  getStudent(studentId: string): SimulatedStudent | null {
    return this.seedStudents[studentId.trim().toUpperCase()] ?? null;
  }

  getIncome(citizenId: string): SimulatedIncome | null {
    return this.seedIncome[citizenId.trim().toUpperCase()] ?? null;
  }

  submitScholarship(applicationReference: string): SimulatedScholarshipReceipt {
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    return {
      application_id: `SCH-DEMO-${randomSuffix}`,
      application_reference: applicationReference,
      status: "RECEIVED",
      received_at: new Date().toISOString(),
      source: "SCHOLARSHIP-LOCAL-SIMULATION",
    };
  }

  private loadApplicationsFromStorage(): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          this.inMemoryApplications = JSON.parse(raw);
        }
      }
    } catch {
      // Graceful fallback to in-memory
    }
  }

  saveApplication(app: CanonicalScholarshipApplication): void {
    const existingIndex = this.inMemoryApplications.findIndex((a) => a.application_id === app.application_id);
    if (existingIndex >= 0) {
      this.inMemoryApplications[existingIndex] = app;
    } else {
      this.inMemoryApplications.unshift(app);
    }

    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.inMemoryApplications));
      }
    } catch {
      // In-memory persistence remains active
    }
  }

  getApplications(): CanonicalScholarshipApplication[] {
    return [...this.inMemoryApplications];
  }

  getApplicationById(id: string): CanonicalScholarshipApplication | null {
    return this.inMemoryApplications.find((a) => a.application_id.toUpperCase() === id.toUpperCase()) ?? null;
  }

  /**
   * Orchestrates the 9-step scholarship application workflow deterministically.
   *
   * Enforces:
   * 1. Explicit consent verified before any departmental service call.
   * 2. Observable per-step status transitions.
   * 3. Heterogeneous payload retrieval and canonical normalization.
   * 4. Transparent deterministic eligibility check.
   * 5. Submission to Scholarship Department.
   * 6. Audit event logging.
   */
  async executeScholarshipWorkflow(
    citizenId: string,
    studentId: string,
    consent: ConsentGrant,
    options: WorkflowOptions = {},
  ): Promise<CanonicalScholarshipApplication> {
    const {
      simulatedFailures = {},
      policy = DEFAULT_SCHOLARSHIP_POLICY,
      stepDelayMs = 0,
      onStepUpdate,
      onAuditEvent,
    } = options;

    const steps = createInitialWorkflowSteps();
    const auditEvents: AuditEvent[] = [];
    const departmentsContacted: string[] = [];

    const delay = (ms: number) => (ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());

    const emitStep = (stepIndex: number, status: WorkflowStep["status"], error?: string, details?: string) => {
      steps[stepIndex].status = status;
      if (error) steps[stepIndex].error = error;
      if (details) steps[stepIndex].details = details;
      if (status === "running") steps[stepIndex].startedAt = new Date().toISOString();
      if (status === "success" || status === "failed") steps[stepIndex].completedAt = new Date().toISOString();
      onStepUpdate?.([...steps]);
    };

    const emitAudit = (
      event_type: AuditEvent["event_type"],
      details: Record<string, unknown>,
      department?: string,
    ) => {
      const event: AuditEvent = {
        id: `AUD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        event_type,
        department,
        details,
      };
      auditEvents.push(event);
      onAuditEvent?.(event);
    };

    const normalizedCitizenId = citizenId.trim().toUpperCase();
    const normalizedStudentId = studentId.trim().toUpperCase();
    const reference = `REF-SETU-${Date.now().toString().slice(-6)}-${normalizedCitizenId}`;

    // STEP 1: Application submitted
    emitStep(0, "running");
    await delay(stepDelayMs);
    emitStep(0, "success", undefined, `Application initialized with reference ${reference}`);
    emitAudit("department_requested", { reference, citizen_id: normalizedCitizenId, student_id: normalizedStudentId });

    // STEP 2: Consent verified
    emitStep(1, "running");
    await delay(stepDelayMs);

    if (!consent || !consent.explicit_approval) {
      const err = "Consent verification failed: Explicit citizen consent is required before accessing departmental records.";
      emitStep(1, "failed", err);
      emitAudit("step_failed", { reason: err, step: 2 });
      throw new Error(err);
    }

    emitStep(1, "success", undefined, `Consent verified for purposes: ${consent.purpose}`);
    emitAudit("consent_granted", {
      consent_id: consent.consent_id,
      purpose: consent.purpose,
      departments: consent.departments,
    });

    // STEP 3: Identity record retrieved
    emitStep(2, "running");
    await delay(stepDelayMs);
    departmentsContacted.push("IDENTITY");
    emitAudit("department_requested", { department: "IDENTITY", citizen_id: normalizedCitizenId }, "IDENTITY");

    if (simulatedFailures.identity) {
      const err = "Identity Department service unavailable (Simulated 503 / Timeout).";
      emitStep(2, "failed", err);
      emitAudit("step_failed", { department: "IDENTITY", error: err }, "IDENTITY");
      throw new Error(err);
    }

    const rawIdentity = this.getCitizen(normalizedCitizenId);
    if (!rawIdentity) {
      const err = `Identity Department record not found for Citizen ID "${normalizedCitizenId}".`;
      emitStep(2, "failed", err);
      emitAudit("step_failed", { department: "IDENTITY", error: err }, "IDENTITY");
      throw new Error(err);
    }

    emitStep(2, "success", undefined, `Identity verified for ${rawIdentity.full_name}`);
    emitAudit("department_response_received", { department: "IDENTITY", status: "200 OK", citizen_id: normalizedCitizenId }, "IDENTITY");

    // STEP 4: Education record retrieved
    emitStep(3, "running");
    await delay(stepDelayMs);
    departmentsContacted.push("EDUCATION");
    emitAudit("department_requested", { department: "EDUCATION", student_id: normalizedStudentId }, "EDUCATION");

    if (simulatedFailures.education) {
      const err = "Education Department service unavailable (Simulated 503 / Connection Refused).";
      emitStep(3, "failed", err);
      emitAudit("step_failed", { department: "EDUCATION", error: err }, "EDUCATION");
      throw new Error(err);
    }

    const rawEducation = this.getStudent(normalizedStudentId);
    if (!rawEducation) {
      const err = `Education Department record not found for Student ID "${normalizedStudentId}".`;
      emitStep(3, "failed", err);
      emitAudit("step_failed", { department: "EDUCATION", error: err }, "EDUCATION");
      throw new Error(err);
    }

    emitStep(3, "success", undefined, `Enrolled in ${rawEducation.courseName} at ${rawEducation.institutionName}`);
    emitAudit("department_response_received", { department: "EDUCATION", status: "200 OK", student_id: normalizedStudentId }, "EDUCATION");

    // STEP 5: Income record retrieved
    emitStep(4, "running");
    await delay(stepDelayMs);
    departmentsContacted.push("INCOME");
    emitAudit("department_requested", { department: "INCOME", citizen_id: normalizedCitizenId }, "INCOME");

    if (simulatedFailures.income) {
      const err = "Income Department service timeout (Simulated 504 Gateway Timeout).";
      emitStep(4, "failed", err);
      emitAudit("step_failed", { department: "INCOME", error: err }, "INCOME");
      throw new Error(err);
    }

    const rawIncome = this.getIncome(normalizedCitizenId);
    if (!rawIncome) {
      const err = `Income Department record not found for Citizen ID "${normalizedCitizenId}".`;
      emitStep(4, "failed", err);
      emitAudit("step_failed", { department: "INCOME", error: err }, "INCOME");
      throw new Error(err);
    }

    emitStep(4, "success", undefined, `Income record retrieved for ${rawIncome.applicant_name}`);
    emitAudit("department_response_received", { department: "INCOME", status: "200 OK", citizen_id: normalizedCitizenId }, "INCOME");

    // STEP 6: Records normalized
    emitStep(5, "running");
    await delay(stepDelayMs);

    let canonicalIdentity: CitizenProfile;
    let canonicalEducation: EducationRecord;
    let canonicalIncome: IncomeRecord;

    try {
      canonicalIdentity = normalizeIdentityRecord(rawIdentity, normalizedCitizenId);
      canonicalEducation = normalizeEducationRecord(rawEducation, normalizedCitizenId);
      canonicalIncome = normalizeIncomeRecord(rawIncome, normalizedCitizenId);
    } catch (normErr: any) {
      const err = `Canonical normalization failed: ${normErr.message}`;
      emitStep(5, "failed", err);
      emitAudit("step_failed", { step: 6, error: err });
      throw new Error(err);
    }

    emitStep(5, "success", undefined, "Normalized into CitizenProfile, EducationRecord, and IncomeRecord");
    emitAudit("normalization_completed", {
      models: ["CitizenProfile", "EducationRecord", "IncomeRecord"],
      citizen_name: canonicalIdentity.full_name,
      course_name: canonicalEducation.course_name,
      annual_income: canonicalIncome.annual_income,
    });

    // STEP 7: Eligibility verified
    emitStep(6, "running");
    await delay(stepDelayMs);

    const eligibility = evaluateScholarshipEligibility(
      canonicalIdentity,
      canonicalEducation,
      canonicalIncome,
      policy,
    );

    emitStep(
      6,
      "success",
      undefined,
      eligibility.is_eligible
        ? "Deterministic criteria satisfied: Eligible for scholarship"
        : `Ineligible: ${eligibility.summary}`,
    );
    emitAudit("eligibility_evaluated", {
      is_eligible: eligibility.is_eligible,
      criteria_count: eligibility.criteria.length,
      summary: eligibility.summary,
    });

    // STEP 8: Scholarship application submitted
    emitStep(7, "running");
    await delay(stepDelayMs);
    departmentsContacted.push("SCHOLARSHIP");

    if (simulatedFailures.scholarship) {
      const err = "Scholarship Department submission failed (Simulated 500 Internal Error).";
      emitStep(7, "failed", err);
      emitAudit("step_failed", { department: "SCHOLARSHIP", error: err }, "SCHOLARSHIP");
      throw new Error(err);
    }

    // Only submit to Scholarship Department if eligible
    let receipt: SimulatedScholarshipReceipt;
    let finalWorkflowStatus: CanonicalScholarshipApplication["workflow_status"];

    if (eligibility.is_eligible) {
      receipt = this.submitScholarship(reference);
      finalWorkflowStatus = "SUBMITTED";
      emitStep(7, "success", undefined, `Submitted to Scholarship registry with ID: ${receipt.application_id}`);
      emitAudit("application_submitted", {
        application_id: receipt.application_id,
        reference,
        status: "RECEIVED",
      }, "SCHOLARSHIP");
    } else {
      receipt = {
        application_id: `SCH-REJ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        application_reference: reference,
        status: "REJECTED_INELIGIBLE",
        received_at: new Date().toISOString(),
        source: "SAMANVAYSETU-VALIDATION-GATEWAY",
      };
      finalWorkflowStatus = "REJECTED";
      emitStep(7, "success", undefined, "Processed: Application marked as Ineligible per published rules");
    }

    // STEP 9: Final status
    emitStep(8, "running");
    await delay(stepDelayMs);
    emitStep(
      8,
      "success",
      undefined,
      eligibility.is_eligible
        ? `Application Approved and Submitted · ID: ${receipt.application_id}`
        : "Evaluation Complete: Application does not meet criteria",
    );

    const finalApplication: CanonicalScholarshipApplication = {
      application_id: receipt.application_id,
      application_reference: reference,
      citizen_id: normalizedCitizenId,
      student_id: normalizedStudentId,
      applicant_name: canonicalIdentity.full_name,
      date_of_birth: canonicalIdentity.date_of_birth,
      course_name: canonicalEducation.course_name,
      institution_name: canonicalEducation.institution_name,
      annual_income: canonicalIncome.annual_income,
      financial_year: canonicalIncome.financial_year,
      eligibility_status: eligibility.is_eligible ? "ELIGIBLE" : "INELIGIBLE",
      workflow_status: finalWorkflowStatus,
      eligibility_details: eligibility,
      records_verified: {
        identity: true,
        education: true,
        income: true,
      },
      departments_contacted: Array.from(new Set(departmentsContacted)),
      submission_receipt: receipt,
      audit_events: auditEvents,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      mode: "demo",
    };

    this.saveApplication(finalApplication);
    return finalApplication;
  }
}

export const demoAdapter = new DemoSimulationAdapter();
