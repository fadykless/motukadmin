import { createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    primary: {
      main: "#fed336",
    },
    secondary: {
      main: "#ff0000",
    },
  },
  typography: {
    fontFamily: "Montserrat",
    button: {
      textTransform: "normal",
    },
    h3: {
      fontWeight: "700",
    },
  },
});

export default theme;
