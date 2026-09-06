/**
 * Local deterministic demo simulation adapter for SAMANVAYSETU.
 *
 * This adapter provides local deterministic fallbacks for the AI Studio preview
 * environment when the live FastAPI gateway or department microservices are unreachable.
 *
 * It mirrors the departmental seed data from:
 * - mock-services/identity
 * - mock-services/education
 * - mock-services/income
 * - mock-services/scholarship
 */

import type { HealthResponse } from "../types/health";

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

  /**
   * Deterministic simulated health response for Demo Mode.
   */
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
    return this.seedCitizens[citizenId.toUpperCase()] ?? null;
  }

  getStudent(studentId: string): SimulatedStudent | null {
    return this.seedStudents[studentId.toUpperCase()] ?? null;
  }

  getIncome(citizenId: string): SimulatedIncome | null {
    return this.seedIncome[citizenId.toUpperCase()] ?? null;
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
}

export const demoAdapter = new DemoSimulationAdapter();
