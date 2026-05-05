import { combineReducers } from "redux";
import { authReducer } from "./authReducer";
import blogReducer from "./blogReducer";
import eventReducer from "./eventReducer";
import videoReducer from "./videoReducer";
import offerReducer from "./offerReducer";
import productReducer from "./productReducer";

export const rootReducer = combineReducers({
  auth: authReducer,
  blog: blogReducer,
  event: eventReducer,
  video: videoReducer,
  offer: offerReducer,
  product: productReducer
});
