import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeDateOfBirth,
  normalizeIdentityRecord,
  normalizeEducationRecord,
  normalizeIncomeRecord,
  evaluateScholarshipEligibility,
} from "../services/normalizer.ts";
import { demoAdapter } from "../services/demoAdapter.ts";
import { DEFAULT_SCHOLARSHIP_POLICY } from "../types/canonical.ts";
import type { ConsentGrant } from "../types/canonical.ts";

const validConsent: ConsentGrant = {
  consent_id: "CNS-TEST-01",
  citizen_id: "CIT-1001",
  purpose: "Verification of identity, education, and income for scholarship",
  departments: ["IDENTITY", "EDUCATION", "INCOME"],
  data_categories: ["Demographics", "Enrollment", "Income"],
  granted_at: new Date().toISOString(),
  explicit_approval: true,
};

// 1. Successful complete workflow test
test("1. Successful complete workflow in Demo Mode with eligible applicant (Aarav Sharma)", async () => {
  const stepsRecorded: string[] = [];
  const app = await demoAdapter.executeScholarshipWorkflow("CIT-1001", "STU-5001", validConsent, {
    stepDelayMs: 0,
    onStepUpdate: (steps) => {
      steps.forEach((s) => {
        if (s.status === "success" && !stepsRecorded.includes(s.label)) {
          stepsRecorded.push(s.label);
        }
      });
    },
  });

  assert.ok(app.application_id.startsWith("SCH-"));
  assert.equal(app.applicant_name, "Aarav Sharma");
  assert.equal(app.eligibility_status, "ELIGIBLE");
  assert.equal(app.workflow_status, "SUBMITTED");
  assert.equal(app.records_verified.identity, true);
  assert.equal(app.records_verified.education, true);
  assert.equal(app.records_verified.income, true);
  assert.ok(app.departments_contacted.includes("IDENTITY"));
  assert.ok(app.departments_contacted.includes("EDUCATION"));
  assert.ok(app.departments_contacted.includes("INCOME"));
  assert.ok(app.departments_contacted.includes("SCHOLARSHIP"));
  assert.ok(app.audit_events.length >= 6);

  // All 9 steps should be recorded
  assert.equal(stepsRecorded.length, 9);
});

// 2. Consent required before data access test
test("2. Workflow fails immediately if explicit consent is not approved", async () => {
  const invalidConsent: ConsentGrant = {
    ...validConsent,
    explicit_approval: false,
  };

  await assert.rejects(
    async () => {
      await demoAdapter.executeScholarshipWorkflow("CIT-1001", "STU-5001", invalidConsent, {
        stepDelayMs: 0,
      });
    },
    {
      message: /Explicit citizen consent is required before accessing departmental records/,
    },
  );
});

// 3. Income eligibility failure test
test("3. Income eligibility failure test with higher-income applicant (Diya Verma)", async () => {
  const app = await demoAdapter.executeScholarshipWorkflow("CIT-1002", "STU-5002", validConsent, {
    stepDelayMs: 0,
    policy: DEFAULT_SCHOLARSHIP_POLICY, // limit is 300,000 INR, Diya has 315,000 INR
  });

  assert.equal(app.applicant_name, "Diya Verma");
  assert.equal(app.annual_income, 315000);
  assert.equal(app.eligibility_status, "INELIGIBLE");
  assert.equal(app.workflow_status, "REJECTED");

  // Verify explanation is present and clear
  const incomeCrit = app.eligibility_details.criteria.find((c) => c.id === "INCOME_CEILING");
  assert.ok(incomeCrit);
  assert.equal(incomeCrit.passed, false);
  assert.match(incomeCrit.explanation, /exceeds the threshold/);
});

// 4. Department service failure and retry test
test("4. Department service failure stops workflow with clear error", async () => {
  let failedStepLabel = "";
  let failureError = "";

  await assert.rejects(
    async () => {
      await demoAdapter.executeScholarshipWorkflow("CIT-1001", "STU-5001", validConsent, {
        stepDelayMs: 0,
        simulatedFailures: { education: true },
        onStepUpdate: (steps) => {
          const failed = steps.find((s) => s.status === "failed");
          if (failed) {
            failedStepLabel = failed.label;
            failureError = failed.error || "";
          }
        },
      });
    },
    {
      message: /Education Department service unavailable/,
    },
  );

  assert.equal(failedStepLabel, "Education record retrieved");
  assert.match(failureError, /Education Department service unavailable/);

  // Now retry without failure and verify it succeeds
  const recoveredApp = await demoAdapter.executeScholarshipWorkflow("CIT-1001", "STU-5001", validConsent, {
    stepDelayMs: 0,
    simulatedFailures: { education: false },
  });
  assert.equal(recoveredApp.workflow_status, "SUBMITTED");
});

// 5. Deterministic schema normalization test
test("5. Deterministic schema normalization handles disparate source shapes", () => {
  // Date normalization: DD/MM/YYYY -> YYYY-MM-DD
  assert.equal(normalizeDateOfBirth("14/07/2003"), "2003-07-14");
  assert.equal(normalizeDateOfBirth("2003-07-14"), "2003-07-14");

  // Raw Identity snake_case
  const rawIdentity = { citizen_id: "cit-1001", full_name: "  Aarav Sharma  ", dob: "2003-07-14", mobile: "9999999999" };
  const canonIdentity = normalizeIdentityRecord(rawIdentity, "CIT-1001");
  assert.equal(canonIdentity.full_name, "Aarav Sharma");
  assert.equal(canonIdentity.date_of_birth, "2003-07-14");

  // Raw Education nested camelCase
  const rawEducation = {
    student: {
      studentId: "stu-5001",
      studentName: " Aarav Sharma ",
      birthDate: "14/07/2003",
      courseName: "B.Tech Computer Engineering",
      institutionName: "Innovexa Institute",
    },
    verification: {
      recordStatus: "ACTIVE",
      sourceSystem: "EDU-SIS",
    },
  };
  const canonEdu = normalizeEducationRecord(rawEducation, "CIT-1001");
  assert.equal(canonEdu.student_name, "Aarav Sharma");
  assert.equal(canonEdu.date_of_birth, "2003-07-14");
  assert.equal(canonEdu.course_name, "B.Tech Computer Engineering");
  assert.equal(canonEdu.enrollment_status, "ACTIVE");

  // Raw Income nested envelope
  const rawIncome = {
    income_record: {
      applicant_name: "Aarav Sharma",
      annual_income: 240000,
      financial_year: "FY 2025/26",
    },
    query: { lookupKey: "CIT-1001", registry: "ITR-DEMO" },
  };
  const canonIncome = normalizeIncomeRecord(rawIncome, "CIT-1001");
  assert.equal(canonIncome.annual_income, 240000);
  assert.equal(canonIncome.applicant_name, "Aarav Sharma");
});

// 6. Demo Mode workflow persistence
test("6. Demo Mode persists applications and allows retrieval", async () => {
  const app = await demoAdapter.executeScholarshipWorkflow("CIT-1001", "STU-5001", validConsent, {
    stepDelayMs: 0,
  });

  const retrieved = demoAdapter.getApplicationById(app.application_id);
  assert.ok(retrieved);
  assert.equal(retrieved.application_id, app.application_id);
  assert.equal(retrieved.applicant_name, "Aarav Sharma");

  const list = demoAdapter.getApplications();
  assert.ok(list.some((a) => a.application_id === app.application_id));
});
