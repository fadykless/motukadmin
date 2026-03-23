const initialState = {
    loading: false
}

export default (state = initialState, { type, payload }) => {
    switch (type) {

        case 'ADD_VIDEO_LOADING':
            return { ...state, loading: payload }
        case 'ADD_VIDEO_SUCCESS':
            return { ...state, loading: false }
        case 'ADD_VIDEO_ERROR':
            return { ...state, loading: false }

        default:
            return state
    }
}
