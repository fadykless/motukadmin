import { toast } from "react-toastify";

const initState = {
  loading: false,
  authMessage: "",
};

export const authReducer = (state = initState, action) => {
  switch (action.type) {
    // LOGIN

    case "LOGIN_LOADING":
      return {
        ...state,
        loading: action.payload,
      };
    case "LOGIN_SUCCESS":
      toast.success("Bon retour");
      return {
        ...state,
        loading: false,
      };
    case "LOGIN_ERROR":
      toast.error(`Erreur de connexion: ${action.payload}`);
      return {
        ...state,
        loading: false,
      };

    // SOCIAL LOGIN

    case "LOGIN_WITH_FACEBOOK_SUCCESS":
      return state;
    case "LOGIN_WITH_FACEBOOK_ERROR":
      return {
        ...state,
        authMessage: "Erreur d'authentification",
      };
    case "LOGIN_WITH_GOOGLE_SUCCESS":
      return state;
    case "LOGIN_WITH_GOOGLE_ERROR":
      return {
        ...state,
        authMessage: "Erreur d'authentification",
      };

    // REGISTER EMAIL

    case "REGISTER_EMAIL_LOADING":
      return {
        ...state,
        loading: action.payload,
      };
    case "REGISTER_EMAIL_SUCCESS":
      toast.success(
        `Un mail a été envoyé à votre adresse: ${action.payload}. Veuillez clicker sur le lien envoyé pour finaliser votre inscription.`
      );
      window.localStorage.setItem("emailForRegistration", action.payload);
      return {
        ...state,
        loading: false,
      };
    case "REGISTER_EMAIL_ERROR":
      toast.error("Erreur : " + action.payload);
      return {
        ...state,
        loading: false,
      };

    // COMPLETE REGISTRATION

    case "COMPLETE_REGISTER_LOADING":
      return {
        ...state,
        loading: action.payload,
      };
    case "COMPLETE_REGISTER_SUCCESS":
      toast.success(
        "Felicitations! profitez de 5 expéditions gratuites en mode Freemium."
      );
      return {
        ...state,
        loading: false,
      };
    case "COMPLETE_REGISTER_ERROR":
      toast.error("Erreur : " + action.payload);
      return {
        ...state,
        loading: false,
      };

    // FORGOT

    case "FORGOT_LOADING":
      return {
        ...state,
        loading: action.payload,
      };
    case "FORGOT_SUCCESS":
      toast.success(
        "Retrouvez votre lien de reinitialisation de mot de passe dans votre boîte email."
      );
      return {
        ...state,
        loading: false,
      };
    case "FORGOT_ERROR":
      toast.error("Erreur : " + action.payload);
      return {
        ...state,
        loading: false,
      };

    case "LOGOUT_SUCCESS":
      toast.warning("Vous vous êtes deconnecté !");
      return state;
    case "LOGOUT_ERROR":
      return {
        ...state,
        authMessage: "Erreur de deconnexion",
      };
    default:
      return state;
  }
};
