'use client'
import { LoadingButton } from "@mui/lab";
import { Grid, TextField, Typography } from "@mui/material";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login } from "@/redux/actions/authActions";
import Logo from "../icons/Logo";
import { useEffect } from "react";
import { doc, onSnapshot, } from "firebase/firestore";
import { db } from "@/firebase";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const mapState = ({ auth }) => ({
  loading: auth.loading,
});

function LoginForm() {
  const dispatch = useDispatch();
  const router = useRouter()
  const [credentials, setCredentials] = useState({
    email: "",
  });
  const { loading } = useSelector(mapState);
  const [data, setData] = useState([]);

  useEffect(() => {
    const docRef = doc(db, "admin", "oHkYMjm6kddoEPAe5ZeyXM9dL8H3");

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.data()) {
          setData({ ...snapshot.data(), id: snapshot.id });
        }
      },
      (err) => {
        console.log(err.message);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const handleChange = (e) =>
    setCredentials({ ...credentials, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (data.email == credentials.email) {
      dispatch(login(credentials, () => router.push("/articles")));
    } else {
      toast.error("Identifiant ou mot de passe incorrect");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid size={12}>
          <Logo width={200} />
        </Grid>
        <Grid size={12}>
          <TextField
            name="email"
            label="E-mail"
            required
            fullWidth
            variant="outlined"
            type="email"
            onChange={handleChange}
          />
        </Grid>

        <Grid item size={12}>
          <TextField
            name="password"
            label="Mot de passe"
            fullWidth
            required
            variant="outlined"
            type="password"
            onChange={handleChange}
          />
        </Grid>

        <Grid item size={{ xs: 12, md: 6 }}>
          <LoadingButton
            type="submit"
            disableElevation
            loading={loading}
            variant="contained"
            sx={{ color: "#fff", borderRadius: 8, }}
            color="primary"
            fullWidth
          >
            Connexion
          </LoadingButton>
        </Grid>
      </Grid>
    </form>
  );
}

export default LoginForm;
