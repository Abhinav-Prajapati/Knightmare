"use client"

const jwt = require('jsonwebtoken'); // update it more 
import { useCookies } from 'react-cookie';
import { createContext, ReactNode, useEffect, useReducer } from "react";

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthState {
  user: User | null;
}

type AuthAction = { type: "LOGIN", payload: User } | { type: "LOGOUT" };

const initialState: AuthState = {
  user: null
};

export const AuthContext = createContext<{ state: AuthState, dispatch: React.Dispatch<AuthAction> }>({ state: initialState, dispatch: () => { } });


export const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "LOGIN":
      return { user: action.payload };
    case "LOGOUT":
      return { user: null };
    default:
      return state;
  }
}

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {

  const [cookies, setCookie, removeCookie] = useCookies(['Token']);

  useEffect(() => {
    const token = cookies.Token
    if (token) {
      try {
        const user = jwt.decode(token) as User; // cast to user interface ??? what 
        console.log("(authContextProvider) looking for user info in cookies", user)
        dispatch({ type: "LOGIN", payload: user })
      } catch (error) {
        console.error("Error decoding token ", error)
      }
    }
  }, [])

  const [state, dispatch] = useReducer(authReducer, initialState);
  console.log("authcontext", state)

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  )
}
