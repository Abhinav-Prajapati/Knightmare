"use client"
import { createContext, ReactNode, useReducer } from "react";

interface User {
  // TODO: Define user properties here
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
  const [state, dispatch] = useReducer(authReducer, initialState);
  console.log("authcontext", state)

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  )
}
