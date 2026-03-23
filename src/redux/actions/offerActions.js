import { db } from "../../firebase";
import {
  addDoc,
  collection,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";

export const publishOffer = (offer, redirect) => {
  return (dispatch) => {
    dispatch({ type: "PUBLISH_OFFER_LOADING", payload: true });

    const colRef = collection(db, "offers");

    addDoc(colRef, {
      ...offer,
      createdAt: new Date().getTime(),
    })
      .then(() => {
        dispatch({ type: "PUBLISH_OFFER_SUCCESS" });
        return redirect();
      })
      .catch((err) => {
        dispatch({ type: "PUBLISH_OFFER_ERROR" });
      });
  };
};

export const editOffer = (offerID, data, redirect) => {
  return (dispatch) => {
    dispatch({ type: "EDIT_OFFER_LOADING", payload: true });

    const docRef = doc(db, "offers", offerID);

    updateDoc(docRef, {
      ...data,
      status: "validated",
    })
      .then(() => {
        dispatch({ type: "EDIT_OFFER_SUCCESS" });
        return redirect();
      })
      .catch((err) => {
        dispatch({ type: "EDIT_OFFER_ERROR" });
      });
  };
};

export const deleteOffer = (offerID) => {
  return (dispatch) => {
    dispatch({ type: "DELETE_OFFER_LOADING", payload: true });

    const docRef = doc(db, "offers", offerID);

    deleteDoc(docRef)
      .then(() => {
        dispatch({ type: "DELETE_OFFER_SUCCESS" });
      })
      .catch((err) => {
        dispatch({ type: "DELETE_OFFER_ERROR" });
      });
  };
};
