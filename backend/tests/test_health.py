"""Foundation tests for the public API health contract."""

import unittest

from fastapi.testclient import TestClient

from app.main import app


class HealthEndpointTests(unittest.TestCase):
    def test_health_endpoint_returns_expected_contract(self) -> None:
        response = TestClient(app).get("/api/v1/health")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["status"], "healthy")
        self.assertEqual(payload["service"], "SAMANVAYSETU API")
        self.assertIn("timestamp", payload)
