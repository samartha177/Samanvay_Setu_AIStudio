import sys
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).parents[1] / "identity"))
from identity_service.main import app  # noqa: E402


class IdentityApiTests(unittest.TestCase):
    def test_seeded_citizen_contract(self) -> None:
        response = TestClient(app).get("/citizens/CIT-1001")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["full_name"], "Aarav Sharma")
        self.assertEqual(response.json()["dob"], "2003-07-14")

    def test_health(self) -> None:
        self.assertEqual(TestClient(app).get("/health").json()["simulated"], True)
