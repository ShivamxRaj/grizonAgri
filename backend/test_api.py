import sys
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import asyncio
from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)

def test_endpoints():
    print("Testing /health...")
    r = client.get("/health")
    assert r.status_code == 200, f"Health failed: {r.status_code}"
    print("Health response:", r.json())

    print("\nTesting /api/v1/chat/query (Scheme & CRAG Web Fallback)...")
    r = client.post("/api/v1/chat/query", json={"query": "PM ਕਿਸਾਨ ਯੋਜਨਾ ਦੀ ਕਿਸ਼ਤ ਕਦੋਂ ਆਵੇਗੀ?", "language": "pa-IN"})
    assert r.status_code == 200, f"Scheme query failed: {r.status_code}"
    print("Scheme query intent:", r.json().get("intent"))
    print("Evidence sources returned:", r.json().get("evidence_sources"))


    print("\nTesting /api/v1/disease/scan...")
    r = client.post("/api/v1/disease/scan", data={"crop": "Wheat", "language": "pa-IN"})
    assert r.status_code == 200, f"Disease scan failed: {r.status_code}"
    print("Disease diagnosed:", r.json().get("disease_name"))

    print("\nTesting /api/v1/mandi/prices...")
    r = client.get("/api/v1/mandi/prices?commodity=Wheat")
    assert r.status_code == 200, f"Mandi prices failed: {r.status_code}"
    print("Mandi items returned:", len(r.json()))

    print("\nTesting /api/v1/weather/forecast...")
    r = client.get("/api/v1/weather/forecast?district=Ludhiana&language=pa-IN")
    assert r.status_code == 200, f"Weather forecast failed: {r.status_code}"
    print("Weather today status:", r.json().get("today_status"))

    print("\nTesting /api/v1/planner/generate...")
    r = client.post("/api/v1/planner/generate", json={"crop": "Wheat", "acreage": 2.5, "sowing_date": "2025-11-10", "language": "pa-IN"})
    assert r.status_code == 200, f"Planner failed: {r.status_code}"
    print("Planner total stages:", r.json().get("total_stages"))

    print("\nTesting /api/v1/finance/estimate...")
    r = client.post("/api/v1/finance/estimate", json={"crop": "Wheat", "acreage": 5.0, "expected_yield_quintals_per_acre": 22.5, "mandi_price_per_quintal": 2275.0})
    assert r.status_code == 200, f"Finance failed: {r.status_code}"
    print("Finance ROI:", r.json().get("roi_percentage"), "%")

    print("\n✅ ALL 7 BACKEND API ENDPOINTS PASSED VERIFICATION!")

if __name__ == "__main__":
    test_endpoints()
