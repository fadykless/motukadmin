import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import { Grid, MenuItem, TextField, useTheme } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { TimePicker } from "@mui/x-date-pickers";
import { LoadingButton } from "@mui/lab";
import { useDispatch, useSelector } from "react-redux";
import { makeBooking } from "../../redux/actions/rentalActions";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "80%", md: 400 },
  bgcolor: "white",
  boxShadow: 24,
  borderRadius: 6,
  p: 5,
  overflow: "scroll",
};

const mapState = ({ rental }) => ({
  loading: rental.loading,
});

export default function BookingModal({ car, open, setOpen }) {
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const theme = useTheme();
  const dispatch = useDispatch();
  const [booking, setBooking] = React.useState({
    carImage: car.image,
    price: car.price,
    carName: car.name,
  });
  const { loading } = useSelector(mapState);
  const currentUser = localStorage.getItem("userID");
  const [user, setUser] = React.useState({});

  React.useEffect(() => {
    const docRef = doc(db, "users", currentUser || "1");
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.data()) {
          setUser({ ...snapshot.data(), id: snapshot.id });
        }
      },
      (err) => {
        console.log(err.message);
      }
    );
    return () => unsubscribe();
  }, [currentUser]);

  const handleChange = (e) =>
    setBooking({ ...booking, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(makeBooking(booking, user && user));
  };

  return (
    <React.Fragment>
      <Button
        disableElevation
        variant="contained"
        sx={{
          backgroundColor: "black",
          color: theme.palette.primary.main,
          borderRadius: 10,
          px: 4,
          width: "100%",
        }}
        onClick={handleOpen}
      >
        Réserver
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="motif"
                  label="Motif de location"
                  required
                  select
                  fullWidth
                  onChange={handleChange}
                >
                  <MenuItem value="Course">Course</MenuItem>
                  <MenuItem value="Séjours">Séjours</MenuItem>
                  <MenuItem value="Evénement">Evénement</MenuItem>
                  <MenuItem value="Business">Business</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="quantity"
                  label="Nombre de véhicules"
                  required
                  fullWidth
                  type="number"
                  onChange={handleChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="daysNumber"
                  label="Nombre de jours"
                  required
                  fullWidth
                  type="number"
                  onChange={handleChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DatePicker
                    name="bookingDate"
                    onChange={handleChange}
                    label="Date"
                    sx={{ width: "48%" }}
                  />
                  <TimePicker
                    name="bookingTime"
                    label="Heure"
                    sx={{ width: "48%", ml: 2 }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="addresse"
                  label="Adresse de prise en charge"
                  required
                  fullWidth
                  multiline
                  rows={2}
                  onChange={handleChange}
                />
              </Grid>
              {user & user.phoneNumber && (
                <Grid item xs={12}>
                  <LoadingButton
                    sx={{ borderRadius: 10 }}
                    disableElevation
                    fullWidth
                    variant="contained"
                    loading={loading}
                  >
                    Valider
                  </LoadingButton>
                </Grid>
              )}
            </Grid>
          </form>
        </Box>
      </Modal>
    </React.Fragment>
  );
}
