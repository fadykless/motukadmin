import { db } from "@/firebase";
import {
    updateDoc,
    doc,
    deleteDoc,
} from "firebase/firestore";


export const editProduct = (productID, data, redirect) => {
    return (dispatch) => {
        dispatch({ type: "EDIT_PRODUCT_LOADING", payload: true });

        const docRef = doc(db, "products", productID);

        updateDoc(docRef, {
            ...data,
        })
            .then(() => {
                dispatch({ type: "EDIT_PRODUCT_SUCCESS" });
                return redirect();
            })
            .catch((err) => {
                dispatch({ type: "EDIT_PRODUCT_ERROR" });
            });
    };
};

export const deleteProduct = (productID) => {
    return (dispatch) => {
        dispatch({ type: "DELETE_PRODUCT_LOADING", payload: true });

        const docRef = doc(db, "products", productID);

        deleteDoc(docRef)
            .then(() => {
                dispatch({ type: "DELETE_PRODUCT_SUCCESS" });
            })
            .catch((err) => {
                console.log(err.message)
                dispatch({ type: "DELETE_PRODUCT_ERROR" });
            });
    };
};
