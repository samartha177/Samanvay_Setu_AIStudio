/**
 * SAMANVAYSETU Versioned Schema Mapping Registry (mapping-registry-v1).
 *
 * Provides authoritative, deterministic field transformation between heterogeneous
 * departmental schemas and the canonical government data models.
 */

import type {
  CitizenProfile,
  EducationRecord,
  FieldMappingRule,
  FieldTransformationTrace,
  IncomeRecord,
  MappingIssue,
  SchemaNormalizationResult,
} from "../types/canonical";
import { normalizeDateOfBirth } from "./normalizer";

export const MAPPING_REGISTRY_VERSION = "mapping-registry-v1";

// Simulated source departmental payloads as specified
export const DEFAULT_IDENTITY_PAYLOAD = {
  aadhaar_name: "Aarav Sharma",
  dob: "2003-07-14",
  citizen_id: "CIT-1001",
};

export const DEFAULT_EDUCATION_PAYLOAD = {
  studentName: "Aarav Sharma",
  dateOfBirth: "2003-07-14",
  course: "B.Tech Computer Engineering",
  enrollment_status: "ACTIVE",
  institution: "Innovexa Institute",
  student_id: "STU-5001",
};

export const DEFAULT_INCOME_PAYLOAD = {
  annual_family_income: 240000,
  income_certificate_no: "INC-5001",
  financial_year: "2025/26",
};

export const DEFAULT_IDENTITY_PAYLOAD_DIYA = {
  aadhaar_name: "Diya Verma",
  dob: "2004-11-02",
  citizen_id: "CIT-1002",
};

export const DEFAULT_EDUCATION_PAYLOAD_DIYA = {
  studentName: "Diya Verma",
  dateOfBirth: "2004-11-02",
  course: "B.Sc Data Science",
  enrollment_status: "ACTIVE",
  institution: "Innovexa Institute",
  student_id: "STU-5002",
};

export const DEFAULT_INCOME_PAYLOAD_DIYA = {
  annual_family_income: 315000,
  income_certificate_no: "INC-5002",
  financial_year: "2025/26",
};

// Registered field mapping rules in mapping-registry-v1
export const IDENTITY_MAPPING_RULES: FieldMappingRule[] = [
  {
    sourceField: "aadhaar_name",
    sourceType: "string",
    canonicalModel: "CitizenProfile",
    canonicalField: "name",
    transformDescription: "Trim whitespace; sanitize title prefixes",
    required: true,
  },
  {
    sourceField: "dob",
    sourceType: "string (YYYY-MM-DD or DD/MM/YYYY)",
    canonicalModel: "CitizenProfile",
    canonicalField: "date_of_birth",
    transformDescription: "Normalize date string to ISO 8601 YYYY-MM-DD",
    required: true,
  },
  {
    sourceField: "citizen_id",
    sourceType: "string",
    canonicalModel: "CitizenProfile",
    canonicalField: "citizen_id",
    transformDescription: "Uppercase trimmed alphanumeric identifier",
    required: true,
  },
];

export const EDUCATION_MAPPING_RULES: FieldMappingRule[] = [
  {
    sourceField: "studentName",
    sourceType: "string",
    canonicalModel: "EducationRecord",
    canonicalField: "student_name",
    transformDescription: "Trim and normalize casing",
    required: true,
  },
  {
    sourceField: "dateOfBirth",
    sourceType: "string",
    canonicalModel: "EducationRecord",
    canonicalField: "date_of_birth",
    transformDescription: "Parse to ISO 8601 format",
    required: true,
  },
  {
    sourceField: "course",
    sourceType: "string",
    canonicalModel: "EducationRecord",
    canonicalField: "course",
    transformDescription: "Canonical academic program title",
    required: true,
  },
  {
    sourceField: "enrollment_status",
    sourceType: "string",
    canonicalModel: "EducationRecord",
    canonicalField: "enrollment_status",
    transformDescription: "Enforce uppercase standard status (e.g. ACTIVE)",
    required: true,
  },
  {
    sourceField: "institution",
    sourceType: "string",
    canonicalModel: "EducationRecord",
    canonicalField: "institution",
    transformDescription: "Accredited educational institute name",
    required: true,
  },
  {
    sourceField: "student_id",
    sourceType: "string",
    canonicalModel: "EducationRecord",
    canonicalField: "student_id",
    transformDescription: "Institute enrollment registration roll number",
    required: true,
  },
];

export const INCOME_MAPPING_RULES: FieldMappingRule[] = [
  {
    sourceField: "annual_family_income",
    sourceType: "number",
    canonicalModel: "IncomeRecord",
    canonicalField: "annual_family_income",
    transformDescription: "Cast to integer INR (₹) figure",
    required: true,
  },
  {
    sourceField: "income_certificate_no",
    sourceType: "string",
    canonicalModel: "IncomeRecord",
    canonicalField: "certificate_number",
    transformDescription: "Revenue authority certificate identifier",
    required: false,
  },
  {
    sourceField: "financial_year",
    sourceType: "string",
    canonicalModel: "IncomeRecord",
    canonicalField: "financial_year",
    transformDescription: "Assessment tax year code (e.g. 2025/26)",
    required: true,
  },
];

/**
 * Normalizes Identity Department source payload according to mapping-registry-v1.
 */
export function normalizeIdentityWithRegistry(
  raw: Record<string, any>,
  options: { strict?: boolean; aiAssisted?: boolean } = {},
): SchemaNormalizationResult<CitizenProfile> {
  const issues: MappingIssue[] = [];
  const traces: FieldTransformationTrace[] = [];

  // Known source fields for Identity
  const knownFields = new Set(["aadhaar_name", "dob", "citizen_id", "full_name", "name", "mobile"]);
  Object.keys(raw || {}).forEach((key) => {
    if (!knownFields.has(key)) {
      issues.push({
        type: "unknown_field",
        department: "Identity Department",
        fieldName: key,
        message: `Field "${key}" is not registered in ${MAPPING_REGISTRY_VERSION} and was preserved in metadata.`,
        severity: "warning",
      });
    }
  });

  // Extract source values (supporting both explicit aadhaar_name and full_name)
  const sourceName = raw?.aadhaar_name ?? raw?.full_name ?? raw?.name;
  const sourceDob = raw?.dob ?? raw?.date_of_birth ?? raw?.birthDate;
  const sourceId = raw?.citizen_id ?? raw?.citizenId;

  if (!sourceName) {
    issues.push({
      type: "missing_field",
      department: "Identity Department",
      fieldName: "aadhaar_name",
      message: "Mandatory source field 'aadhaar_name' was missing or empty in payload.",
      severity: "error",
    });
  }

  if (!sourceDob) {
    issues.push({
      type: "missing_field",
      department: "Identity Department",
      fieldName: "dob",
      message: "Mandatory source field 'dob' was missing in payload.",
      severity: "error",
    });
  }

  if (!sourceId) {
    issues.push({
      type: "missing_field",
      department: "Identity Department",
      fieldName: "citizen_id",
      message: "Mandatory source field 'citizen_id' was missing in payload.",
      severity: "error",
    });
  }

  if (options.strict && issues.some((i) => i.severity === "error")) {
    throw new Error(
      `Identity schema normalization failed: ${issues.map((i) => i.message).join("; ")}`,
    );
  }

  const normalizedName = String(sourceName || "UNKNOWN").trim();
  const normalizedDob = sourceDob ? normalizeDateOfBirth(String(sourceDob)) : "UNKNOWN";
  const normalizedId = String(sourceId || "UNKNOWN").trim().toUpperCase();

  // Record field transformation traces
  traces.push({
    department: "Identity Department",
    sourceField: "aadhaar_name",
    mappingVersion: MAPPING_REGISTRY_VERSION,
    canonicalModel: "CitizenProfile",
    canonicalField: "name",
    sourceValue: raw?.aadhaar_name ?? sourceName,
    transformedValue: normalizedName,
  });

  traces.push({
    department: "Identity Department",
    sourceField: "dob",
    mappingVersion: MAPPING_REGISTRY_VERSION,
    canonicalModel: "CitizenProfile",
    canonicalField: "date_of_birth",
    sourceValue: raw?.dob ?? sourceDob,
    transformedValue: normalizedDob,
  });

  traces.push({
    department: "Identity Department",
    sourceField: "citizen_id",
    mappingVersion: MAPPING_REGISTRY_VERSION,
    canonicalModel: "CitizenProfile",
    canonicalField: "citizen_id",
    sourceValue: raw?.citizen_id ?? sourceId,
    transformedValue: normalizedId,
  });

  const canonical: CitizenProfile = {
    citizen_id: normalizedId,
    full_name: normalizedName,
    name: normalizedName,
    date_of_birth: normalizedDob,
    mobile: raw?.mobile ? String(raw.mobile).trim() : undefined,
  };

  return {
    canonical,
    issues,
    traces,
    mappingVersion: MAPPING_REGISTRY_VERSION,
    engineUsed: options.aiAssisted ? "ai-assisted" : "deterministic",
  };
}

/**
 * Normalizes Education Department source payload according to mapping-registry-v1.
 */
export function normalizeEducationWithRegistry(
  raw: Record<string, any>,
  citizenId: string,
  options: { strict?: boolean; aiAssisted?: boolean } = {},
): SchemaNormalizationResult<EducationRecord> {
  const issues: MappingIssue[] = [];
  const traces: FieldTransformationTrace[] = [];

  const student = raw?.student || raw;
  const knownFields = new Set([
    "studentName",
    "dateOfBirth",
    "course",
    "enrollment_status",
    "institution",
    "student_id",
    "studentId",
    "courseName",
    "institutionName",
    "birthDate",
    "verification",
  ]);

  Object.keys(raw || {}).forEach((key) => {
    if (!knownFields.has(key)) {
      issues.push({
        type: "unknown_field",
        department: "Education Department",
        fieldName: key,
        message: `Field "${key}" is not registered in ${MAPPING_REGISTRY_VERSION}.`,
        severity: "warning",
      });
    }
  });

  const sourceStudentName = student?.studentName ?? student?.student_name ?? student?.name;
  const sourceDob = student?.dateOfBirth ?? student?.birthDate ?? student?.dob;
  const sourceCourse = student?.course ?? student?.courseName ?? student?.course_name;
  const sourceStatus =
    student?.enrollment_status ?? raw?.verification?.recordStatus ?? student?.status ?? "ACTIVE";
  const sourceInstitution = student?.institution ?? student?.institutionName ?? student?.institution_name;
  const sourceStudentId = student?.student_id ?? student?.studentId ?? student?.id;

  if (!sourceStudentName) {
    issues.push({
      type: "missing_field",
      department: "Education Department",
      fieldName: "studentName",
      message: "Mandatory source field 'studentName' was missing in payload.",
      severity: "error",
    });
  }

  if (!sourceCourse) {
    issues.push({
      type: "missing_field",
      department: "Education Department",
      fieldName: "course",
      message: "Mandatory source field 'course' was missing in payload.",
      severity: "error",
    });
  }

  if (options.strict && issues.some((i) => i.severity === "error")) {
    throw new Error(
      `Education schema normalization failed: ${issues.map((i) => i.message).join("; ")}`,
    );
  }

  const studentName = String(sourceStudentName || "UNKNOWN").trim();
  const dob = sourceDob ? normalizeDateOfBirth(String(sourceDob)) : "UNKNOWN";
  const course = String(sourceCourse || "UNKNOWN").trim();
  const enrollmentStatus = String(sourceStatus || "ACTIVE").toUpperCase().trim();
  const institution = String(sourceInstitution || "Unknown Institution").trim();
  const studentId = String(sourceStudentId || "UNKNOWN").trim();

  // Record traces
  traces.push({
    department: "Education Department",
    sourceField: "studentName",
    mappingVersion: MAPPING_REGISTRY_VERSION,
    canonicalModel: "EducationRecord",
    canonicalField: "student_name",
    sourceValue: sourceStudentName,
    transformedValue: studentName,
  });

  traces.push({
    department: "Education Department",
    sourceField: "dateOfBirth",
    mappingVersion: MAPPING_REGISTRY_VERSION,
    canonicalModel: "EducationRecord",
    canonicalField: "date_of_birth",
    sourceValue: sourceDob,
    transformedValue: dob,
  });

  traces.push({
    department: "Education Department",
    sourceField: "course",
    mappingVersion: MAPPING_REGISTRY_VERSION,
    canonicalModel: "EducationRecord",
    canonicalField: "course",
    sourceValue: sourceCourse,
    transformedValue: course,
  });

  traces.push({
    department: "Education Department",
    sourceField: "enrollment_status",
    mappingVersion: MAPPING_REGISTRY_VERSION,
    canonicalModel: "EducationRecord",
    canonicalField: "enrollment_status",
    sourceValue: sourceStatus,
    transformedValue: enrollmentStatus,
  });

  traces.push({
    department: "Education Department",
    sourceField: "institution",
    mappingVersion: MAPPING_REGISTRY_VERSION,
    canonicalModel: "EducationRecord",
    canonicalField: "institution",
    sourceValue: sourceInstitution,
    transformedValue: institution,
  });

  traces.push({
    department: "Education Department",
    sourceField: "student_id",
    mappingVersion: MAPPING_REGISTRY_VERSION,
    canonicalModel: "EducationRecord",
    canonicalField: "student_id",
    sourceValue: sourceStudentId,
    transformedValue: studentId,
  });

  const canonical: EducationRecord = {
    citizen_id: citizenId.trim(),
    student_id: studentId,
    student_name: studentName,
    date_of_birth: dob,
    course_name: course,
    course: course,
    institution_name: institution,
    institution: institution,
    enrollment_status: enrollmentStatus,
  };

  return {
    canonical,
    issues,
    traces,
    mappingVersion: MAPPING_REGISTRY_VERSION,
    engineUsed: options.aiAssisted ? "ai-assisted" : "deterministic",
  };
}

/**
 * Normalizes Income Department source payload according to mapping-registry-v1.
 */
export function normalizeIncomeWithRegistry(
  raw: Record<string, any>,
  citizenId: string,
  options: { strict?: boolean; aiAssisted?: boolean } = {},
): SchemaNormalizationResult<IncomeRecord> {
  const issues: MappingIssue[] = [];
  const traces: FieldTransformationTrace[] = [];

  const record = raw?.income_record || raw;
  const knownFields = new Set([
    "annual_family_income",
    "income_certificate_no",
    "financial_year",
    "annual_income",
    "applicant_name",
    "query",
  ]);

  Object.keys(raw || {}).forEach((key) => {
    if (!knownFields.has(key)) {
      issues.push({
        type: "unknown_field",
        department: "Income Department",
        fieldName: key,
        message: `Field "${key}" is not registered in ${MAPPING_REGISTRY_VERSION}.`,
        severity: "warning",
      });
    }
  });

  const sourceIncome = record?.annual_family_income ?? record?.annual_income ?? record?.income;
  const sourceCert = record?.income_certificate_no ?? record?.certificate_number ?? record?.cert_no;
  const sourceFy = record?.financial_year ?? record?.financialYear ?? "2025/26";
  const sourceName = record?.applicant_name ?? record?.name ?? "";

  if (sourceIncome === undefined || sourceIncome === null) {
    issues.push({
      type: "missing_field",
      department: "Income Department",
      fieldName: "annual_family_income",
      message: "Mandatory source field 'annual_family_income' was missing in payload.",
      severity: "error",
    });
  }

  const numericIncome = Number(sourceIncome);
  if (isNaN(numericIncome)) {
    issues.push({
      type: "missing_field",
      department: "Income Department",
      fieldName: "annual_family_income",
      message: `Value '${sourceIncome}' could not be transformed to numeric income.`,
      severity: "error",
    });
  }

  if (options.strict && issues.some((i) => i.severity === "error")) {
    throw new Error(
      `Income schema normalization failed: ${issues.map((i) => i.message).join("; ")}`,
    );
  }

  const formattedFy = String(sourceFy).startsWith("FY ") ? String(sourceFy) : `FY ${sourceFy}`;

  traces.push({
    department: "Income Department",
    sourceField: "annual_family_income",
    mappingVersion: MAPPING_REGISTRY_VERSION,
    canonicalModel: "IncomeRecord",
    canonicalField: "annual_family_income",
    sourceValue: sourceIncome,
    transformedValue: new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(numericIncome || 0),
  });

  traces.push({
    department: "Income Department",
    sourceField: "income_certificate_no",
    mappingVersion: MAPPING_REGISTRY_VERSION,
    canonicalModel: "IncomeRecord",
    canonicalField: "certificate_number",
    sourceValue: sourceCert,
    transformedValue: sourceCert || "N/A",
  });

  traces.push({
    department: "Income Department",
    sourceField: "financial_year",
    mappingVersion: MAPPING_REGISTRY_VERSION,
    canonicalModel: "IncomeRecord",
    canonicalField: "financial_year",
    sourceValue: sourceFy,
    transformedValue: formattedFy,
  });

  const canonical: IncomeRecord = {
    citizen_id: citizenId.trim(),
    applicant_name: String(sourceName).trim(),
    annual_income: isNaN(numericIncome) ? 0 : numericIncome,
    annual_family_income: isNaN(numericIncome) ? 0 : numericIncome,
    certificate_number: sourceCert ? String(sourceCert).trim() : undefined,
    income_certificate_no: sourceCert ? String(sourceCert).trim() : undefined,
    financial_year: formattedFy,
  };

  return {
    canonical,
    issues,
    traces,
    mappingVersion: MAPPING_REGISTRY_VERSION,
    engineUsed: options.aiAssisted ? "ai-assisted" : "deterministic",
  };
}

/**
 * Checks AI schema mapper configuration status.
 * By design, application functions 100% deterministically without requiring any API key.
 */
export function getAiMapperStatus(): {
  isConfigured: boolean;
  activeMode: "deterministic" | "ai-assisted";
  label: string;
  reason: string;
} {
  // Check optional environment variable safely across Node and Vite browser runtimes
  const globalObj = typeof globalThis !== "undefined" ? (globalThis as any) : undefined;
  const envKey = globalObj?.process?.env?.AI_SCHEMA_MAPPER_API_KEY ||
    (typeof import.meta !== "undefined" ? (import.meta as any).env?.VITE_AI_SCHEMA_MAPPER_API_KEY : undefined);
  const hasKey = Boolean(envKey);
  if (hasKey) {
    return {
      isConfigured: true,
      activeMode: "ai-assisted",
      label: "AI Schema Assistant (Connected)",
      reason: "AI suggestions enabled; deterministic mapping remains authoritative.",
    };
  }
  return {
    isConfigured: false,
    activeMode: "deterministic",
    label: "Deterministic Mapping (Active)",
    reason: "Running authoritative mapping-registry-v1 rules without external AI dependencies.",
  };
}
