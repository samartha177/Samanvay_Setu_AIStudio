"""Integration tests for the Scholarship Application endpoints."""

import unittest
from fastapi.testclient import TestClient

from app.main import app


class ScholarshipEndpointTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_scholarship_submission_eligible_citizen(self) -> None:
        payload = {
            "citizen_id": "CIT-1001",
            "student_id": "STU-5001",
            "consent": {
                "consent_id": "CNS-TEST-101",
                "citizen_id": "CIT-1001",
                "purpose": "Test scholarship eligibility verification",
                "departments": ["IDENTITY", "EDUCATION", "INCOME"],
                "data_categories": ["Demographics", "Enrollment", "Income"],
                "granted_at": "2026-09-06T12:00:00Z",
                "explicit_approval": True,
            },
        }
        response = self.client.post("/api/v1/applications/scholarship", json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()

        self.assertEqual(data["citizen_id"], "CIT-1001")
        self.assertEqual(data["applicant_name"], "Aarav Sharma")
        self.assertEqual(data["eligibility_status"], "ELIGIBLE")
        self.assertEqual(data["workflow_status"], "SUBMITTED")
        self.assertEqual(data["mode"], "real")
        self.assertTrue(data["eligibility_details"]["is_eligible"])
        self.assertEqual(data["submission_receipt"]["status"], "RECEIVED")
        self.assertEqual(len(data["audit_events"]), 7)

    def test_scholarship_submission_ineligible_due_to_income(self) -> None:
        payload = {
            "citizen_id": "CIT-1002",
            "student_id": "STU-5002",
            "consent": {
                "consent_id": "CNS-TEST-102",
                "citizen_id": "CIT-1002",
                "purpose": "Test scholarship eligibility verification",
                "departments": ["IDENTITY", "EDUCATION", "INCOME"],
                "data_categories": ["Demographics", "Enrollment", "Income"],
                "granted_at": "2026-09-06T12:00:00Z",
                "explicit_approval": True,
            },
        }
        response = self.client.post("/api/v1/applications/scholarship", json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()

        self.assertEqual(data["citizen_id"], "CIT-1002")
        self.assertEqual(data["applicant_name"], "Diya Verma")
        self.assertEqual(data["eligibility_status"], "INELIGIBLE")
        self.assertEqual(data["workflow_status"], "REJECTED")
        self.assertFalse(data["eligibility_details"]["is_eligible"])
        self.assertEqual(data["submission_receipt"]["status"], "REJECTED_INELIGIBLE")

    def test_scholarship_fails_without_consent(self) -> None:
        payload = {
            "citizen_id": "CIT-1001",
            "student_id": "STU-5001",
            "consent": {
                "consent_id": "CNS-TEST-103",
                "citizen_id": "CIT-1001",
                "purpose": "Test without consent",
                "departments": ["IDENTITY"],
                "data_categories": ["Demographics"],
                "granted_at": "2026-09-06T12:00:00Z",
                "explicit_approval": False,
            },
        }
        response = self.client.post("/api/v1/applications/scholarship", json=payload)
        self.assertEqual(response.status_code, 400)
        self.assertIn("Explicit citizen consent is required", response.json()["detail"])

    def test_list_and_get_applications(self) -> None:
        # Create an application first so list is populated
        payload = {
            "citizen_id": "CIT-1001",
            "student_id": "STU-5001",
            "consent": {
                "consent_id": "CNS-TEST-LIST",
                "citizen_id": "CIT-1001",
                "purpose": "Test list endpoint",
                "departments": ["IDENTITY", "EDUCATION", "INCOME"],
                "data_categories": ["Demographics"],
                "granted_at": "2026-09-06T12:00:00Z",
                "explicit_approval": True,
            },
        }
        create_res = self.client.post("/api/v1/applications/scholarship", json=payload)
        self.assertEqual(create_res.status_code, 201)
        created_app_id = create_res.json()["application_id"]

        # List applications
        response = self.client.get("/api/v1/applications")
        self.assertEqual(response.status_code, 200)
        apps = response.json()
        self.assertIsInstance(apps, list)
        self.assertGreaterEqual(len(apps), 1)

        # Get single application
        single_response = self.client.get(f"/api/v1/applications/{created_app_id}")
        self.assertEqual(single_response.status_code, 200)
        self.assertEqual(single_response.json()["application_id"], created_app_id)
