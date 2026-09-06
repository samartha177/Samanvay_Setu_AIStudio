import sys
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).parents[1] / "income"))
from income_service.main import app  # noqa: E402


class IncomeApiTests(unittest.TestCase):
    def test_nested_income_contract(self) -> None:
        response = TestClient(app).get("/income/CIT-1001")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["income_record"]["annual_income"], 240000)
        self.assertEqual(response.json()["income_record"]["financial_year"], "FY 2025/26")

    def test_health(self) -> None:
        self.assertEqual(TestClient(app).get("/health").json()["service"], "income-department")
