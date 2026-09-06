import sys
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).parents[1] / "education"))
from education_service.main import app  # noqa: E402


class EducationApiTests(unittest.TestCase):
    def test_nested_camel_case_contract(self) -> None:
        response = TestClient(app).get("/students/STU-5001")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["student"]["birthDate"], "14/07/2003")
        self.assertEqual(response.json()["verification"]["sourceSystem"], "EDU-SIS")

    def test_health(self) -> None:
        self.assertEqual(TestClient(app).get("/health").json()["service"], "education-department")
