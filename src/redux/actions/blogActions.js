import { db } from "../../firebase";
import {
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  collection,
} from "firebase/firestore";


export const editArticle = (articleID, data, redirect) => {
  return (dispatch) => {
    dispatch({ type: "EDIT_ARTICLE_LOADING", payload: true });

    const docRef = doc(db, "magazine", articleID);

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

export const deleteArticle = (articleID, redirect) => {
  return (dispatch) => {
    dispatch({ type: "DELETE_ARTICLE_LOADING", payload: true });

    const docRef = doc(db, "magazine", articleID);

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
