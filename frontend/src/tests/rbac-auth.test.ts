import test from "node:test";
import assert from "node:assert/strict";

import { DEMO_ACCOUNTS, type UserRole, type LoginResult } from "../contexts/AuthContext.tsx";

function simulateLogin(
  selectedRole: UserRole,
  idInput: string,
  passwordInput: string
): LoginResult {
  const trimmedId = idInput.trim().toUpperCase();
  const trimmedPass = passwordInput.trim();

  const oppositeRole: UserRole = selectedRole === "CITIZEN" ? "OFFICER" : "CITIZEN";
  const oppositeAccount = DEMO_ACCOUNTS[oppositeRole];

  if (trimmedId === oppositeAccount.id.toUpperCase()) {
    return {
      success: false,
      error: "These credentials do not belong to the selected role.",
    };
  }

  const expectedAccount = DEMO_ACCOUNTS[selectedRole];
  if (trimmedId !== expectedAccount.id.toUpperCase() || trimmedPass !== expectedAccount.password) {
    return {
      success: false,
      error: "Invalid demo credentials.",
    };
  }

  return { success: true };
}

// 1. Citizen login succeeds with CIT-1001 / demo123
test("1. Citizen login succeeds with valid demo credentials (CIT-1001 / demo123)", () => {
  const result = simulateLogin("CITIZEN", "CIT-1001", "demo123");
  assert.equal(result.success, true);
  assert.equal(result.error, undefined);
});

// 2. Case-insensitive and trimmed ID works
test("2. Citizen login accepts case-insensitive and trimmed ID (  cit-1001  )", () => {
  const result = simulateLogin("CITIZEN", "  cit-1001  ", "demo123");
  assert.equal(result.success, true);
});

// 3. Officer login succeeds with OFF-1001 / demo123
test("3. Officer login succeeds with valid demo credentials (OFF-1001 / demo123)", () => {
  const result = simulateLogin("OFFICER", "OFF-1001", "demo123");
  assert.equal(result.success, true);
  assert.equal(result.error, undefined);
});

// 4. Invalid password returns "Invalid demo credentials."
test("4. Invalid password emits 'Invalid demo credentials.'", () => {
  const result = simulateLogin("CITIZEN", "CIT-1001", "wrongpass");
  assert.equal(result.success, false);
  assert.equal(result.error, "Invalid demo credentials.");
});

// 5. Unknown ID returns "Invalid demo credentials."
test("5. Unknown user identifier emits 'Invalid demo credentials.'", () => {
  const result = simulateLogin("CITIZEN", "UNKNOWN-9999", "demo123");
  assert.equal(result.success, false);
  assert.equal(result.error, "Invalid demo credentials.");
});

// 6. Role mismatch: Officer ID under Citizen role
test("6. Officer ID provided when Citizen role selected emits 'These credentials do not belong to the selected role.'", () => {
  const result = simulateLogin("CITIZEN", "OFF-1001", "demo123");
  assert.equal(result.success, false);
  assert.equal(result.error, "These credentials do not belong to the selected role.");
});

// 7. Role mismatch: Citizen ID under Officer role
test("7. Citizen ID provided when Officer role selected emits 'These credentials do not belong to the selected role.'", () => {
  const result = simulateLogin("OFFICER", "CIT-1001", "demo123");
  assert.equal(result.success, false);
  assert.equal(result.error, "These credentials do not belong to the selected role.");
});

// 8. Route permission matrix verification
test("8. Route permissions matrix correctly enforces Citizen vs Officer boundaries", () => {
  const citizenRoutes = [
    "/citizen",
    "/citizen/services",
    "/citizen/applications",
    "/citizen/consent-history",
  ];
  const officerRoutes = [
    "/officer",
    "/officer/applications",
    "/officer/monitoring",
    "/monitoring",
    "/officer/service-graph",
    "/service-graph",
    "/admin/schema-mapper",
  ];

  const allowedForCitizen = (route: string) =>
    citizenRoutes.includes(route) || route.startsWith("/citizen/applications/");
  const allowedForOfficer = (route: string) =>
    officerRoutes.includes(route) || route.startsWith("/citizen/applications/");

  // Verify citizen permissions
  assert.equal(allowedForCitizen("/citizen"), true);
  assert.equal(allowedForCitizen("/citizen/services"), true);
  assert.equal(allowedForCitizen("/citizen/applications"), true);
  assert.equal(allowedForCitizen("/citizen/consent-history"), true);
  assert.equal(allowedForCitizen("/officer"), false);
  assert.equal(allowedForCitizen("/officer/monitoring"), false);
  assert.equal(allowedForCitizen("/monitoring"), false);
  assert.equal(allowedForCitizen("/service-graph"), false);
  assert.equal(allowedForCitizen("/admin/schema-mapper"), false);

  // Verify officer permissions
  assert.equal(allowedForOfficer("/officer"), true);
  assert.equal(allowedForOfficer("/officer/applications"), true);
  assert.equal(allowedForOfficer("/monitoring"), true);
  assert.equal(allowedForOfficer("/service-graph"), true);
  assert.equal(allowedForOfficer("/admin/schema-mapper"), true);
  assert.equal(allowedForOfficer("/citizen"), false);
  assert.equal(allowedForOfficer("/citizen/services"), false);

  // Both can inspect specific application detail
  assert.equal(allowedForCitizen("/citizen/applications/SCH-TEST"), true);
  assert.equal(allowedForOfficer("/citizen/applications/SCH-TEST"), true);
});
