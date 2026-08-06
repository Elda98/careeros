from fastapi.testclient import TestClient

from app.main import app


def test_health() -> None:
    with TestClient(app) as client:
        response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_metrics_exposes_uptime_and_counts() -> None:
    with TestClient(app) as client:
        response = client.get("/metrics")
    assert response.status_code == 200
    body = response.json()
    assert "uptime_seconds" in body
    assert "counts" in body
    assert isinstance(body["counts"], dict)
