const initialState = {
    loading: false,
};

export default (state = initialState, { type, payload }) => {
    switch (type) {
        case "ADD_EVENT_LOADING":
            return { ...state, loading: payload };
        case "ADD_EVENT_SUCCESS":
            return { ...state, loading: false };
        case "ADD_EVENT_ERROR":
            return { ...state, loading: false };

        case "EDIT_EVENT_LOADING":
            return { ...state, loading: payload };
        case "EDIT_EVENT_SUCCESS":
            return { ...state, loading: false };
        case "EDIT_EVENT_ERROR":
            return { ...state, loading: false };

        case "DELETE_EVENT_LOADING":
            return { ...state, loading: payload };
        case "DELETE_EVENT_SUCCESS":
            return { ...state, loading: false };
        case "DELETE_EVENT_ERROR":
            return { ...state, loading: false };
        default:
            return state;
    }
};
