import type { HealthResponse, PlatformMode } from "../types/health";
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
