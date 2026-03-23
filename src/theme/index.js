import { createTheme } from "@mui/material";
import { colors } from "./colors";

const theme = createTheme({
  palette: {
    primary: {
      main: colors.primary,
    },
    secondary: {
      main: colors.secondary,
    },
  },
  typography: {
    fontFamily: "Montserrat",
    button: {
      textTransform: "normal",
    },
    h4: {
      fontFamily: "Montserrat",
      fontSize: 30,
      fontWeight: "600",
    },
    h6: {
      fontFamily: "Montserrat",
      fontWeight: "600",
    },
  },
});

export default theme;
