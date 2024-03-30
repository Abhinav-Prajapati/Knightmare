import { AuthContext } from "@/context/AuthContext";
import { useContext } from "react";

export const useAuthContext = () => {
    const { state, dispatch } = useContext(AuthContext);

    if (!state || !dispatch) {
        throw new Error("useAuthContext must be used within AuthContextProvider");
    }

    return { state, dispatch };
}
