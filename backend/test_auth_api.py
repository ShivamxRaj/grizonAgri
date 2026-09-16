"""
Test script for Grizon Agri Phone + OTP Auth Endpoints
"""
import requests

BASE_URL = "http://127.0.0.1:8000/api/v1/auth"

def test_auth_flow():
    print("--- 1. Requesting OTP ---")
    resp = requests.post(f"{BASE_URL}/request-otp", json={"phone_number": "9876543210"})
    print("Request OTP status:", resp.status_code, resp.json())
    assert resp.status_code == 200, "Request OTP failed"
    data = resp.json()
    phone = data["phone_number"]
    mock_otp = data["mock_otp"]

    print("\n--- 2. Verifying OTP ---")
    resp = requests.post(f"{BASE_URL}/verify-otp", json={"phone_number": phone, "otp": mock_otp})
    print("Verify OTP status:", resp.status_code, resp.json())
    assert resp.status_code == 200, "Verify OTP failed"
    verify_data = resp.json()
    farmer_id = verify_data["farmer"]["farmer_id"]

    print("\n--- 3. Updating Profile (Name, Language, District, Crops) ---")
    profile_payload = {
        "farmer_id": farmer_id,
        "name": "Gurpreet Singh",
        "preferred_language": "pa-IN",
        "district": "Ludhiana",
        "state": "Punjab",
        "primary_crops": ["Wheat", "Paddy", "Cotton"]
    }
    resp = requests.post(f"{BASE_URL}/profile", json=profile_payload)
    print("Update Profile status:", resp.status_code, resp.json())
    assert resp.status_code == 200, "Update Profile failed"

    print("\n--- 4. Fetching Current Farmer Profile ---")
    resp = requests.get(f"{BASE_URL}/me", params={"farmer_id": farmer_id})
    print("Fetch Profile status:", resp.status_code, resp.json())
    assert resp.status_code == 200, "Fetch Profile failed"

    print("\n✅ AUTH FLOW TEST PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_auth_flow()
