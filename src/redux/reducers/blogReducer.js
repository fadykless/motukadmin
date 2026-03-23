const initialState = {
  loading: false,
};

export default (state = initialState, { type, payload }) => {
  switch (type) {
    case "ADD_ARTICLE_LOADING":
      return { ...state, loading: payload };
    case "ADD_ARTICLE_SUCCESS":
      return { ...state, loading: false };
    case "ADD_ARTICLE_ERROR":
      return { ...state, loading: false };

    case "EDIT_ARTICLE_LOADING":
      return { ...state, loading: payload };
    case "EDIT_ARTICLE_SUCCESS":
      return { ...state, loading: false };
    case "EDIT_ARTICLE_ERROR":
      return { ...state, loading: false };

    case "DELETE_ARTICLE_LOADING":
      return { ...state, loading: payload };
    case "DELETE_ARTICLE_SUCCESS":
      return { ...state, loading: false };
    case "DELETE_ARTICLE_ERROR":
      return { ...state, loading: false };
    default:
      return state;
  }
};
