import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/router";
import { useEffect } from "react";

export const useAuth = () => {
    const { token, user, isAuthenticated, login, logout, updateUser, isHydrated } = useAuthStore()
    const router = useRouter()

    const handleLogin = (token: string, user: any) => {
        login(token, user)
        router.push('/')
    }

    const handleLogout = () => {
        logout()
        router.push('/login')
    }

    return {
        token,
        user,
        isAuthenticated,
        login: handleLogin,
        logout: handleLogout,
        updateUser,
        isHydrated
    }
}