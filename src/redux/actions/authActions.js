import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../../firebase";

export const login = (credentials, redirect) => {
  return (dispatch) => {
    dispatch({ type: "LOGIN_LOADING", payload: true });

    signInWithEmailAndPassword(auth, credentials.email, credentials.password)
      .then((result) => {
        localStorage.setItem("market1fluenceAdminID", result.user.uid);
        dispatch({ type: "LOGIN_SUCCESS" });
        return redirect();
      })
      .catch((err) => {
        dispatch({ type: "LOGIN_ERROR", payload: err.message });
      });
  };
};

export const logOut = (redirect) => {
  return (dispatch) => {
    auth
      .signOut()
      .then(() => {
        localStorage.clear();
        dispatch({ type: "LOGOUT_SUCCESS" });
        return redirect();
      })
      .catch((err) => {
        dispatch({ type: "LOGOUT_ERROR", err });
      });
  };
};
