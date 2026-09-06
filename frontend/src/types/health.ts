export type HealthResponse = {
  status: "healthy";
  service: string;
  version: string;
  environment: string;
  timestamp: string;
};

export type PlatformMode = "real" | "demo";
