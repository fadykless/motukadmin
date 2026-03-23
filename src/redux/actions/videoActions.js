import { db } from "../../firebase";
import {
    addDoc,
    updateDoc,
    doc,
    deleteDoc,
    collection,
} from "firebase/firestore";

export const addVideo = (video, redirect) => {
    return (dispatch) => {

        const colRef = collection(db, "contents");

        dispatch({ type: "ADD_VIDEO_LOADING", payload: true });

        addDoc(colRef, {
            ...video,
            url: 'https://youtube.com/shorts/' + video.youtubeVideoID,
            createdAt: new Date().getTime(),
        })
            .then(() => {
                dispatch({ type: "ADD_VIDEO_SUCCESS" });
                return redirect();
            })
            .catch((err) => {
                console.log(err.message);
                dispatch({ type: "ADD_VIDEO_ERROR", error: err.message });
            });
    };
};

export const editVideo = (videoID, data, redirect) => {
    return (dispatch) => {
        dispatch({ type: "EDIT_VIDEO_LOADING", payload: true });

        const docRef = doc(db, "videos", videoID);

        updateDoc(docRef, {
            ...data,
        })
            .then(() => {
                dispatch({ type: "EDIT_VIDEO_SUCCESS" });
                return redirect();
            })
            .catch((err) => {
                dispatch({ type: "EDIT_VIDEO_ERROR" });
            });
    };
};

export const deleteVideo = (videoID, redirect) => {
    return (dispatch) => {
        dispatch({ type: "DELETE_VIDEO_LOADING", payload: true });

        const docRef = doc(db, "videos", videoID);

        deleteDoc(docRef)
            .then(() => {
                dispatch({ type: "DELETE_VIDEO_SUCCESS" });
                return redirect();
            })
            .catch((err) => {
                dispatch({ type: "DELETE_VIDEO_ERROR" });
            });
    };
};
