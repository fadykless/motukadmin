import { toast } from "react-toastify";

const initialState = {
    loading: false,
};

export default (state = initialState, { type, payload }) => {
    switch (type) {

        case "EDIT_PRODUCT_LOADING":
            return { ...state, loading: payload };
        case "EDIT_PRODUCT_SUCCESS":
            return { ...state, loading: false };
        case "EDIT_PRODUCT_ERROR":

            return { ...state, loading: false };

        case "DELETE_PRODUT_LOADING":
            return { ...state, loading: payload };
        case "DELETE_PRODUCT_SUCCESS":
            toast.success("Suppression réussie")
            return { ...state, loading: false };
        case "DELETE_PRODUCT_ERROR":
            return { ...state, loading: false };
        default:
            return state;
    }
};
