import type {
  CanonicalScholarshipApplication,
  ConsentGrant,
  ScholarshipEligibilityPolicy,
} from "../types/canonical";
import type { HealthResponse, PlatformMode } from "../types/health";
import type { WorkflowOptions } from "./demoAdapter";
import { demoAdapter } from "./demoAdapter";

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

/**
 * Real API client - directly communicates with FastAPI Gateway.
 */
export async function fetchApiHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch(`${apiBaseUrl}/health`, { signal });

  if (!response.ok) {
    throw new Error(`Gateway health request failed (${response.status}).`);
  }

  return response.json() as Promise<HealthResponse>;
}

export interface GatewayStatusResult {
  mode: PlatformMode;
  isGatewayOnline: boolean;
  isDemoMode: boolean;
  data: HealthResponse;
  error: string | null;
}

/**
 * Gateway status resolver with safe fallback to local simulation adapter.
 *
 * REAL MODE:
 * React → FastAPI Gateway → Department Services
 *
 * DEMO MODE:
 * React → Local Demo Adapter → Department Simulation
 */
export async function fetchGatewayStatus(signal?: AbortSignal): Promise<GatewayStatusResult> {
  try {
    const realData = await fetchApiHealth(signal);
    return {
      mode: "real",
      isGatewayOnline: true,
      isDemoMode: false,
      data: realData,
      error: null,
    };
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    // Live FastAPI gateway is unreachable in this preview environment.
    // Fall back to local demo adapter without pretending the live gateway is online.
    const simulatedData = demoAdapter.getSimulatedHealth();
    return {
      mode: "demo",
      isGatewayOnline: false,
      isDemoMode: true,
      data: simulatedData,
      error: "FastAPI Gateway is offline or unreachable in preview.",
    };
  }
}

export interface ScholarshipSubmitRequest {
  citizen_id: string;
  student_id: string;
  consent: ConsentGrant;
  policy?: ScholarshipEligibilityPolicy;
}

/**
 * Executes the complete scholarship application workflow.
 * Automatically delegates to Real Mode (FastAPI) or Demo Mode (Local Simulation).
 */
export async function submitScholarshipWorkflow(
  citizenId: string,
  studentId: string,
  consent: ConsentGrant,
  options: WorkflowOptions & { isGatewayOnline?: boolean } = {},
): Promise<CanonicalScholarshipApplication> {
  const { isGatewayOnline = false, ...adapterOptions } = options;

  if (isGatewayOnline) {
    try {
      options.onStepUpdate?.([
        { id: "step-1", stepNumber: 1, label: "Application submitted", status: "running" },
      ]);
      const res = await fetch(`${apiBaseUrl}/applications/scholarship`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          citizen_id: citizenId,
          student_id: studentId,
          consent,
          policy: options.policy,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.detail || `Gateway returned HTTP ${res.status}`);
      }

      const realApplication = (await res.json()) as CanonicalScholarshipApplication;
      demoAdapter.saveApplication(realApplication);
      return realApplication;
    } catch (err: any) {
      console.warn("Real Gateway submission failed, falling back to local simulation:", err);
      // If gateway request failed, fall through to demoAdapter
    }
  }

  // Demo mode simulation
  return demoAdapter.executeScholarshipWorkflow(citizenId, studentId, consent, adapterOptions);
}

export async function fetchApplicationsList(isGatewayOnline: boolean = false): Promise<CanonicalScholarshipApplication[]> {
  if (isGatewayOnline) {
    try {
      const res = await fetch(`${apiBaseUrl}/applications`);
      if (res.ok) {
        return (await res.json()) as CanonicalScholarshipApplication[];
      }
    } catch {
      // Fallback
    }
  }
  return demoAdapter.getApplications();
}

export async function fetchApplicationById(
  id: string,
  isGatewayOnline: boolean = false,
): Promise<CanonicalScholarshipApplication | null> {
  if (isGatewayOnline) {
    try {
      const res = await fetch(`${apiBaseUrl}/applications/${id}`);
      if (res.ok) {
        return (await res.json()) as CanonicalScholarshipApplication;
      }
    } catch {
      // Fallback
    }
  }
  return demoAdapter.getApplicationById(id);
}

