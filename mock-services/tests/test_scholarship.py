import sys
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).parents[1] / "scholarship"))
from scholarship_service.main import app  # noqa: E402


class ScholarshipApiTests(unittest.TestCase):
    def test_canonical_submission_contract(self) -> None:
        payload = {"application_reference": "SAM-2026-0001", "citizen_id": "CIT-1001", "applicant_name": "Aarav Sharma", "date_of_birth": "2003-07-14", "course_name": "B.Tech Computer Engineering", "institution_name": "Innovexa Institute", "annual_income": 240000, "financial_year": "2025-26"}
        response = TestClient(app).post("/applications", json=payload)
        self.assertEqual(response.status_code, 201)
        receipt = response.json()
        self.assertEqual(receipt["status"], "RECEIVED")
        self.assertEqual(TestClient(app).get(f"/applications/{receipt['application_id']}").status_code, 200)

    def test_health(self) -> None:
        self.assertEqual(TestClient(app).get("/health").json()["service"], "scholarship-department")
