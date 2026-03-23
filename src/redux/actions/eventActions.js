import { db } from "../../firebase";
import {
    addDoc,
    updateDoc,
    doc,
    deleteDoc,
    collection,
} from "firebase/firestore";
import {
    getDownloadURL,
    getStorage,
    ref,
    uploadBytesResumable,
} from "firebase/storage";

export const addEvent = (article, redirect) => {
    return (dispatch) => {
        const storage = getStorage();
        const storageRef = ref(storage, "images/" + article.image.name);
        const metadata = {
            contentType: "image/*",
        };

        const colRef = collection(db, "articles");
        const uploadTask = uploadBytesResumable(
            storageRef,
            article.image,
            metadata
        );

        dispatch({ type: "ADD_ARTICLE_LOADING", payload: true });

        uploadTask.on(
            "state_changed",
            (snapshot) => {
                // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                const progress =
                    (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log("Upload is " + progress + "% done");
                switch (snapshot.state) {
                    case "paused":
                        console.log("Upload is paused");
                        break;
                    case "running":
                        console.log("Upload is running");
                        break;
                }
            },
            (error) => {
                // A full list of error codes is available at
                // https://firebase.google.com/docs/storage/web/handle-errors
                switch (error.code) {
                    case "storage/unauthorized":
                        // User doesn't have permission to access the object
                        break;
                    case "storage/canceled":
                        // User canceled the upload
                        break;

                    // ...

                    case "storage/unknown":
                        // Unknown error occurred, inspect error.serverResponse
                        break;
                }
            },
            () => {
                // Upload completed successfully, now we can get the download URL
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    addDoc(colRef, {
                        ...article,
                        image: downloadURL,
                        createdAt: new Date().getTime(),
                    })
                        .then(() => {
                            dispatch({ type: "ADD_ARTICLE_SUCCESS" });
                            console.log("sucess");
                            return redirect();
                        })
                        .catch((err) => {
                            console.log(err.message);
                            dispatch({ type: "ADD_ARTICLE_ERROR", error: err.message });
                        });
                });
            }
        );
    };
};

export const editEvent = (articleID, data, redirect) => {
    return (dispatch) => {
        dispatch({ type: "EDIT_ARTICLE_LOADING", payload: true });

        const docRef = doc(db, "blog", articleID);

        updateDoc(docRef, {
            ...data,
        })
            .then(() => {
                dispatch({ type: "EDIT_ARTICLE_SUCCESS" });
                return redirect();
            })
            .catch((err) => {
                dispatch({ type: "EDIT_ARTICLE_ERROR" });
            });
    };
};

export const deleteEvent = (articleID, redirect) => {
    return (dispatch) => {
        dispatch({ type: "DELETE_ARTICLE_LOADING", payload: true });

        const docRef = doc(db, "blog", articleID);

        deleteDoc(docRef)
            .then(() => {
                dispatch({ type: "DELETE_ARTICLE_SUCCESS" });
                return redirect();
            })
            .catch((err) => {
                dispatch({ type: "DELETE_ARTICLE_ERROR" });
            });
    };
};
