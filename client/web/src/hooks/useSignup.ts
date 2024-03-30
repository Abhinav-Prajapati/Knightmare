"use client"
import { useState } from "react";
import { useCookies } from 'react-cookie';
import { useAuthContext } from "./useAuthContext";
import { resolve } from "path";

interface SignUpResponse {
  signup: (email: string, username: string, password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const useSignUp = (): SignUpResponse => {
  const [error, setError] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cookies, setCookie, removeCookie] = useCookies(['Token']);
  const { dispatch } = useAuthContext();

  const signup = async (email: string, username: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8080/signup', {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password, username })
      });

      if (!response.ok) {
        const json = await response.json();
        console.log(response)
        throw new Error(json.error);
      } else {
        // Assuming json contains user info after successful signup
        const json = await response.json();
        console.log("signup hoook response ", json)
        setCookie('Token', json.Token, { path: '/' });
        dispatch({ type: "LOGIN", payload: json });
      }
    } catch (error) {
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }
  return { signup, isLoading, error };
}
