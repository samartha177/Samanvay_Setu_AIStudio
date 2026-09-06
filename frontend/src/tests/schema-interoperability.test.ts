import test from "node:test";
import assert from "node:assert/strict";

import {
  MAPPING_REGISTRY_VERSION,
  DEFAULT_IDENTITY_PAYLOAD,
  DEFAULT_EDUCATION_PAYLOAD,
  DEFAULT_INCOME_PAYLOAD,
  DEFAULT_IDENTITY_PAYLOAD_DIYA,
  DEFAULT_EDUCATION_PAYLOAD_DIYA,
  DEFAULT_INCOME_PAYLOAD_DIYA,
  normalizeIdentityWithRegistry,
  normalizeEducationWithRegistry,
  normalizeIncomeWithRegistry,
  getAiMapperStatus,
} from "../services/mappingRegistry.ts";
import { demoAdapter } from "../services/demoAdapter.ts";
import type { ConsentGrant } from "../types/canonical.ts";

const validConsent: ConsentGrant = {
  consent_id: "CNS-TEST-INTEROP-01",
  citizen_id: "CIT-1001",
  purpose: "Verification of identity, education, and income for scholarship",
  departments: ["IDENTITY", "EDUCATION", "INCOME"],
  data_categories: ["Demographics", "Enrollment", "Income"],
  granted_at: new Date().toISOString(),
  explicit_approval: true,
};

// 1. Identity schema normalization with exact prompt payload
test("1. Identity schema normalization transforms aadhaar_name to canonical CitizenProfile", () => {
  const result = normalizeIdentityWithRegistry(DEFAULT_IDENTITY_PAYLOAD);

  assert.equal(result.mappingVersion, MAPPING_REGISTRY_VERSION);
  assert.equal(result.engineUsed, "deterministic");
  assert.equal(result.canonical.name, "Aarav Sharma");
  assert.equal(result.canonical.full_name, "Aarav Sharma");
  assert.equal(result.canonical.date_of_birth, "2003-07-14");
  assert.equal(result.canonical.citizen_id, "CIT-1001");
  assert.equal(result.issues.length, 0);

  // Field-level transformation traces
  const nameTrace = result.traces.find((t) => t.sourceField === "aadhaar_name");
  assert.ok(nameTrace);
  assert.equal(nameTrace.canonicalModel, "CitizenProfile");
  assert.equal(nameTrace.canonicalField, "name");
  assert.equal(nameTrace.transformedValue, "Aarav Sharma");
});

// 2. Education schema normalization with exact prompt payload
test("2. Education schema normalization maps studentName, course, institution, enrollment_status to EducationRecord", () => {
  const result = normalizeEducationWithRegistry(DEFAULT_EDUCATION_PAYLOAD, "CIT-1001");

  assert.equal(result.mappingVersion, MAPPING_REGISTRY_VERSION);
  assert.equal(result.canonical.student_name, "Aarav Sharma");
  assert.equal(result.canonical.date_of_birth, "2003-07-14");
  assert.equal(result.canonical.course, "B.Tech Computer Engineering");
  assert.equal(result.canonical.course_name, "B.Tech Computer Engineering");
  assert.equal(result.canonical.enrollment_status, "ACTIVE");
  assert.equal(result.canonical.institution, "Innovexa Institute");
  assert.equal(result.canonical.institution_name, "Innovexa Institute");
  assert.equal(result.canonical.student_id, "STU-5001");
  assert.equal(result.issues.length, 0);

  const courseTrace = result.traces.find((t) => t.sourceField === "course");
  assert.ok(courseTrace);
  assert.equal(courseTrace.canonicalModel, "EducationRecord");
  assert.equal(courseTrace.transformedValue, "B.Tech Computer Engineering");
});

// 3. Income schema normalization with exact prompt payload
test("3. Income schema normalization maps annual_family_income and certificate_number to IncomeRecord", () => {
  const result = normalizeIncomeWithRegistry(DEFAULT_INCOME_PAYLOAD, "CIT-1001");

  assert.equal(result.mappingVersion, MAPPING_REGISTRY_VERSION);
  assert.equal(result.canonical.annual_family_income, 240000);
  assert.equal(result.canonical.annual_income, 240000);
  assert.equal(result.canonical.certificate_number, "INC-5001");
  assert.equal(result.canonical.income_certificate_no, "INC-5001");
  assert.equal(result.canonical.financial_year, "FY 2025/26");
  assert.equal(result.issues.length, 0);

  const incomeTrace = result.traces.find((t) => t.sourceField === "annual_family_income");
  assert.ok(incomeTrace);
  assert.equal(incomeTrace.canonicalModel, "IncomeRecord");
});

// 4. mapping-registry-v1 version identifier check
test("4. mapping-registry-v1 is visibly reported as authoritative version", () => {
  assert.equal(MAPPING_REGISTRY_VERSION, "mapping-registry-v1");
});

// 5. Missing source field handling
test("5. Missing mandatory field emits clear error warning without crash", () => {
  const incompleteIdentity = {
    dob: "2003-07-14",
    citizen_id: "CIT-1001",
    // missing aadhaar_name
  };

  const result = normalizeIdentityWithRegistry(incompleteIdentity);
  const missingIssue = result.issues.find((i) => i.type === "missing_field");
  assert.ok(missingIssue);
  assert.equal(missingIssue.fieldName, "aadhaar_name");
  assert.equal(missingIssue.severity, "error");
  assert.match(missingIssue.message, /Mandatory source field 'aadhaar_name' was missing/);

  // Strict mode check
  assert.throws(
    () => normalizeIdentityWithRegistry(incompleteIdentity, { strict: true }),
    /Identity schema normalization failed/,
  );
});

// 6. Unknown source field handling
test("6. Unknown source fields are identified and preserved with a warning", () => {
  const payloadWithUnknown = {
    ...DEFAULT_IDENTITY_PAYLOAD,
    biometric_device_hash: "SHA256:abcd1234efgh5678",
  };

  const result = normalizeIdentityWithRegistry(payloadWithUnknown);
  const unknownIssue = result.issues.find((i) => i.type === "unknown_field");
  assert.ok(unknownIssue);
  assert.equal(unknownIssue.fieldName, "biometric_device_hash");
  assert.equal(unknownIssue.severity, "warning");
  assert.match(unknownIssue.message, /not registered in mapping-registry-v1/);

  // Canonical record is still safely produced
  assert.equal(result.canonical.name, "Aarav Sharma");
});

// 7. Unmapped field handling in Education and Income
test("7. Unmapped fields in Education and Income payloads generate transparent audit issues", () => {
  const eduPayload = {
    ...DEFAULT_EDUCATION_PAYLOAD,
    legacy_hostel_code: "HOSTEL-B2",
  };

  const eduResult = normalizeEducationWithRegistry(eduPayload, "CIT-1001");
  const unmappedEduIssue = eduResult.issues.find((i) => i.fieldName === "legacy_hostel_code");
  assert.ok(unmappedEduIssue);
  assert.equal(unmappedEduIssue.type, "unknown_field");

  const incPayload = {
    ...DEFAULT_INCOME_PAYLOAD,
    unmapped_ration_category: "BPL_RURAL",
  };

  const incResult = normalizeIncomeWithRegistry(incPayload, "CIT-1001");
  const unmappedIncIssue = incResult.issues.find((i) => i.fieldName === "unmapped_ration_category");
  assert.ok(unmappedIncIssue);
  assert.equal(unmappedIncIssue.type, "unknown_field");
});

// 8. Deterministic fallback without AI credentials
test("8. Deterministic fallback executes reliably without any AI API key", () => {
  const status = getAiMapperStatus();

  // In standard preview environment without AI_SCHEMA_MAPPER_API_KEY
  assert.equal(status.activeMode, "deterministic");
  assert.equal(status.label, "Deterministic Mapping (Active)");
  assert.ok(status.reason.includes("mapping-registry-v1"));

  // Results should function 100% deterministically
  const idResult = normalizeIdentityWithRegistry(DEFAULT_IDENTITY_PAYLOAD);
  assert.equal(idResult.engineUsed, "deterministic");
  assert.equal(idResult.canonical.name, "Aarav Sharma");
});

// 9. Canonical output matches expected models
test("9. Canonical output conforms cleanly to canonical domain contracts", () => {
  const id = normalizeIdentityWithRegistry(DEFAULT_IDENTITY_PAYLOAD_DIYA);
  const edu = normalizeEducationWithRegistry(DEFAULT_EDUCATION_PAYLOAD_DIYA, "CIT-1002");
  const inc = normalizeIncomeWithRegistry(DEFAULT_INCOME_PAYLOAD_DIYA, "CIT-1002");

  assert.equal(id.canonical.name, "Diya Verma");
  assert.equal(edu.canonical.course, "B.Sc Data Science");
  assert.equal(inc.canonical.annual_family_income, 315000);
});

// 10. Existing scholarship workflow compatibility verified
test("10. Existing scholarship workflow operates seamlessly for both presets", async () => {
  // Preset A: Aarav Sharma (Eligible)
  const appAarav = await demoAdapter.executeScholarshipWorkflow("CIT-1001", "STU-5001", validConsent, {
    stepDelayMs: 0,
  });
  assert.equal(appAarav.applicant_name, "Aarav Sharma");
  assert.equal(appAarav.eligibility_status, "ELIGIBLE");
  assert.equal(appAarav.workflow_status, "SUBMITTED");

  // Preset B: Diya Verma (Ineligible)
  const appDiya = await demoAdapter.executeScholarshipWorkflow("CIT-1002", "STU-5002", validConsent, {
    stepDelayMs: 0,
  });
  assert.equal(appDiya.applicant_name, "Diya Verma");
  assert.equal(appDiya.eligibility_status, "INELIGIBLE");
  assert.equal(appDiya.workflow_status, "REJECTED");
});
