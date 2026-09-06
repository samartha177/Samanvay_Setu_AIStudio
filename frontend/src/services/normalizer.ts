/**
 * Canonical normalizer and deterministic eligibility evaluator for SAMANVAYSETU.
 *
 * Implements deterministic schema normalization for incoming departmental responses,
 * translating diverse heterogeneous envelopes into clean canonical models.
 */

import type {
  CitizenProfile,
  EducationRecord,
  EligibilityEvaluation,
  IncomeRecord,
  ScholarshipEligibilityPolicy,
} from "../types/canonical";

/**
 * Normalizes disparate date strings (e.g. "14/07/2003" or "2003-07-14") to ISO 8601 (YYYY-MM-DD).
 */
export function normalizeDateOfBirth(rawDate: string): string {
  if (!rawDate || typeof rawDate !== "string") {
    throw new Error("Invalid or missing date of birth string.");
  }
  const clean = rawDate.trim();

  // Handle DD/MM/YYYY or DD-MM-YYYY format
  const ddmmyyyy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(clean);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Handle YYYY-MM-DD format
  const yyyymmdd = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/.exec(clean);
  if (yyyymmdd) {
    const [, year, month, day] = yyyymmdd;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return clean;
}

/**
 * Normalizes raw Identity Department API payload to canonical CitizenProfile.
 */
export function normalizeIdentityRecord(raw: any, citizenId: string): CitizenProfile {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid Identity Department response payload");
  }

  const rawId = raw.citizen_id || raw.citizenId || citizenId;
  const rawName = raw.full_name || raw.fullName || raw.name;
  const rawDob = raw.dob || raw.date_of_birth || raw.birthDate;

  if (!rawName) {
    throw new Error("Identity Department record missing person name.");
  }

  return {
    citizen_id: String(rawId).trim(),
    full_name: String(rawName).trim(),
    date_of_birth: normalizeDateOfBirth(String(rawDob)),
    mobile: raw.mobile ? String(raw.mobile).trim() : undefined,
  };
}

/**
 * Normalizes raw Education Department envelope to canonical EducationRecord.
 */
export function normalizeEducationRecord(raw: any, citizenId: string): EducationRecord {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid Education Department response payload");
  }

  const student = raw.student || raw;
  const verification = raw.verification || {};

  const studentId = student.studentId || student.student_id || student.id;
  const studentName = student.studentName || student.student_name || student.name;
  const birthDate = student.birthDate || student.dob || student.date_of_birth;
  const courseName = student.courseName || student.course_name || student.course;
  const institutionName = student.institutionName || student.institution_name || student.institution;
  const enrollmentStatus = verification.recordStatus || verification.status || student.status || "ACTIVE";

  if (!studentName || !courseName) {
    throw new Error("Education Department record missing student name or course information.");
  }

  return {
    citizen_id: citizenId.trim(),
    student_id: String(studentId || "UNKNOWN").trim(),
    student_name: String(studentName).trim(),
    date_of_birth: normalizeDateOfBirth(String(birthDate || "")),
    course_name: String(courseName).trim(),
    institution_name: String(institutionName || "Unknown Institution").trim(),
    enrollment_status: String(enrollmentStatus).toUpperCase().trim(),
  };
}

/**
 * Normalizes raw Income Department envelope to canonical IncomeRecord.
 */
export function normalizeIncomeRecord(raw: any, citizenId: string): IncomeRecord {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid Income Department response payload");
  }

  const record = raw.income_record || raw.record || raw;
  const applicantName = record.applicant_name || record.applicantName || record.name;
  const annualIncome = record.annual_income ?? record.annualIncome ?? record.income;
  const financialYear = record.financial_year || record.financialYear || record.fy || "FY 2025/26";

  if (annualIncome === undefined || annualIncome === null) {
    throw new Error("Income Department record missing annual income figure.");
  }

  const numericIncome = Number(annualIncome);
  if (isNaN(numericIncome)) {
    throw new Error(`Income value "${annualIncome}" is not a valid number.`);
  }

  return {
    citizen_id: citizenId.trim(),
    applicant_name: String(applicantName || "").trim(),
    annual_income: numericIncome,
    financial_year: String(financialYear).trim(),
  };
}

/**
 * Evaluates deterministic eligibility based on canonical records.
 * Rules are fully transparent, explainable, and configurable.
 */
export function evaluateScholarshipEligibility(
  identity: CitizenProfile,
  education: EducationRecord,
  income: IncomeRecord,
  policy: ScholarshipEligibilityPolicy,
): EligibilityEvaluation {
  const criteria = [];

  // 1. Enrollment status check
  const isEnrolled = policy.eligibleEnrollmentStatuses.includes(education.enrollment_status);
  criteria.push({
    id: "ENROLLMENT_STATUS",
    name: "Student Enrollment Status",
    requirement: `Status must be one of: ${policy.eligibleEnrollmentStatuses.join(", ")}`,
    actual: education.enrollment_status,
    passed: isEnrolled,
    explanation: isEnrolled
      ? `Student is actively enrolled (${education.enrollment_status}) at ${education.institution_name}.`
      : `Student record status is ${education.enrollment_status}; active enrollment required.`,
  });

  // 2. Course eligibility check
  const isCourseEligible = policy.eligibleCourseKeywords.some((kw) =>
    education.course_name.toLowerCase().includes(kw.toLowerCase()),
  );
  criteria.push({
    id: "COURSE_ELIGIBILITY",
    name: "Eligible Course / Discipline",
    requirement: `Course name must include an approved keyword (e.g. ${policy.eligibleCourseKeywords.slice(0, 4).join(", ")})`,
    actual: education.course_name,
    passed: isCourseEligible,
    explanation: isCourseEligible
      ? `Course "${education.course_name}" is recognized as an eligible higher education program.`
      : `Course "${education.course_name}" does not match the approved higher education catalog.`,
  });

  // 3. Family annual income limit
  const isIncomeEligible = income.annual_income <= policy.maxAnnualIncome;
  const formattedActual = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(income.annual_income);
  const formattedLimit = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(policy.maxAnnualIncome);

  criteria.push({
    id: "INCOME_CEILING",
    name: "Annual Family Income Ceiling",
    requirement: `Gross annual family income must be ≤ ${formattedLimit}`,
    actual: `${formattedActual} (${income.financial_year})`,
    passed: isIncomeEligible,
    explanation: isIncomeEligible
      ? `Reported annual income ${formattedActual} is within the threshold of ${formattedLimit}.`
      : `Reported annual income ${formattedActual} exceeds the threshold of ${formattedLimit}.`,
  });

  // 4. Cross-department name consistency check
  const name1 = identity.full_name.toLowerCase().replace(/\s+/g, "");
  const name2 = education.student_name.toLowerCase().replace(/\s+/g, "");
  const name3 = income.applicant_name.toLowerCase().replace(/\s+/g, "");
  const namesMatch = (name1 === name2 || name1.includes(name2) || name2.includes(name1)) &&
                     (name1 === name3 || name1.includes(name3) || name3.includes(name1));

  criteria.push({
    id: "IDENTITY_CONSISTENCY",
    name: "Cross-Department Identity Verification",
    requirement: "Applicant names across Identity, Education, and Income departments must correspond.",
    actual: `Identity: "${identity.full_name}" | Education: "${education.student_name}" | Income: "${income.applicant_name}"`,
    passed: namesMatch,
    explanation: namesMatch
      ? `Applicant identity confirmed consistent across all 3 participating departmental registries.`
      : `Potential name mismatch detected across participating department registries.`,
  });

  const is_eligible = criteria.every((c) => c.passed);

  const summary = is_eligible
    ? "All deterministic eligibility criteria met. Application is verified and approved for submission."
    : `Application is ineligible: ${criteria.filter((c) => !c.passed).map((c) => c.name).join(", ")} did not satisfy policy requirements.`;

  return {
    is_eligible,
    criteria,
    summary,
    evaluated_at: new Date().toISOString(),
  };
}
