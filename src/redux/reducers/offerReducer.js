const initialState = {
  loading: false,
};

export default (state = initialState, { type, payload }) => {
  switch (type) {
    case "PUBLISH_OFFER_LOADING":
      return { ...state, loading: payload };
    case "PUBLISH_OFFER_SUCCESS":
      return { ...state, loading: false };
    case "PUBLISH_OFFER_ERROR":
      return { ...state, loading: false };

    case "EDIT_OFFER_LOADING":
      return { ...state, loading: payload };
    case "EDIT_OFFER_SUCCESS":
      return { ...state, loading: false };
    case "EDIT_OFFER_ERROR":
      return { ...state, loading: false };

    case "DELETE_OFFER_LOADING":
      return { ...state, loading: payload };
    case "DELETE_OFFER_SUCCESS":
      return { ...state, loading: false };
    case "DELETE_OFFER_ERROR":
      return { ...state, loading: false };

    default:
      return state;
  }
};
