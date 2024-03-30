import { useCookies } from "react-cookie";
import { useAuthContext } from "./useAuthContext";
export const useLogout = () => {
    const { dispatch } = useAuthContext()
    const logout = () => {
        // const [cookies, setCookie, removeCookie] = useCookies(['Token']);
        // removeCookie('Token');
        dispatch({ type: "LOGOUT" });
    }

    return { logout };
}