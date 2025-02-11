import requests
import json

BASE_URL = "http://localhost:3000" 

user_1 = "test_user_1"

USER_DATA = {
    "email": f"{user_1}@gmail.com",
    "user_name": f"{user_1}",
    "name": f"{user_1}",
    "password_hash": "1234"
}

SIGNIN_DATA = {
    "username": f"{user_1}",
    "password": "1234"
}

SIGNIN_DATA_INVALID = {
    "username": f"{user_1}",
    "password": "wrongpassword"
}

SIGNIN_DATA_NON_EXISTENT_USER = {
    "username": "nonexistent_user",
    "password": "1234"
}

def test_signup():
    # Valid Sign-Up
    response = requests.post(f"{BASE_URL}/user/signup", json=USER_DATA)
    if response.status_code == 201:
        response_json = response.json()
        assert response_json["user_name"] == USER_DATA["user_name"]
        assert response_json["email"] == USER_DATA["email"]
        print("[✅] Signup successful")
        return response_json["id"]
    
    elif response.status_code == 409:
        print("[✅] Signup failed: Username already taken")
        return None
    
    else:
        raise Exception(f"Unexpected error: {response.status_code} - {response.text}")

    # Invalid Email Format
    response = requests.post(f"{BASE_URL}/user/signup", json=USER_DATA_INVALID_EMAIL)
    if response.status_code == 400:
        print("[⚠️] Signup failed: Invalid email format")

def test_signin():
    # Valid Sign-In
    response = requests.get(f"{BASE_URL}/user/signin", json=SIGNIN_DATA)
    if response.status_code == 200:
        response_json = response.json()
        assert "token" in response_json, "Token missing in response"
        
        token = response_json["token"]
        with open(f"tokens/{user_1}.token.txt", "w") as token_file:
            token_file.write(token)
        
        print("[✅] Sign-in successful")
        return token
    
    # Invalid Password
    response = requests.get(f"{BASE_URL}/user/signin", json=SIGNIN_DATA_INVALID)
    if response.status_code == 401:
        print("[❌] Sign-in failed: Incorrect password")
    
    # Non-Existent User
    response = requests.get(f"{BASE_URL}/user/signin", json=SIGNIN_DATA_NON_EXISTENT_USER)
    if response.status_code == 404:
        print("[❌] Sign-in failed: User not found")

def test_get_profile(token):
    # Get Profile with valid token
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    response = requests.get(f"{BASE_URL}/user/profile", headers=headers)
    
    if response.status_code == 200:
        response_json = response.json()
        assert "user_name" in response_json, "Username not found in profile"
        assert response_json["user_name"] == user_1, "Username mismatch"
        print("[✅] Profile retrieved successfully when send valid user token")
    else:
        print("[❌] Profile retrieved failed when send valid user token")
    
    invalid_token = "invalid_token_123"
    headers = {
        "Authorization": f"Bearer {invalid_token}"
    }
    
    response = requests.get(f"{BASE_URL}/user/profile", headers=headers)
    if response.status_code == 401:
        print("[✅] Profile retrieval failed when send Invalid token")

def run_tests():
    test_signup()
    
    token = test_signin()
    if token:
        test_get_profile(token)
    
    print("All tests completed!")

if __name__ == "__main__":
    run_tests()
