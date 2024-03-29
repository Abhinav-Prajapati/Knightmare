const SIGNUP_URL = 'http://localhost:8080/signup';  // TODO move to .env

export async function signup(username: string, email: string, password: string) {
  try {
    const response = await fetch(SIGNUP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });

    console.log("response from server", response)
    const data = await response.json();
    return data;
  } catch (error) {
    if (error === 'email already exists') {
      throw new Error('email already exists');
    }
    throw new Error('Signup failed');
  }
}
