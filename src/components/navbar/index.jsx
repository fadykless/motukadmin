'use client'
import * as React from "react";
import { styled } from "@mui/material/styles";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Sidebar from "./Sidebar";
import ExitToApp from "@mui/icons-material/ExitToApp";
import { useDispatch } from "react-redux";
import { logOut } from "@/redux/actions/authActions";
import { useRouter } from "next/navigation";
import { Alert } from "@mui/material";

const drawerWidth = 240;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

export default function Navbar() {
  const [open, setOpen] = React.useState(true);
  const dispatch = useDispatch()
  const router = useRouter()
  const toggleDrawer = () => {
    setOpen(!open);
  };

  const redirect = () => router.push("/");

  const handleLogOut = () => {
    const isConfirmed = window.confirm("Êtes-vous sûr de vouloir vous déconnecter?");

    if (isConfirmed) {
      dispatch(logOut(redirect))
    }
  };

  return (
    <React.Fragment>
      <AppBar
        elevation={0}
        sx={{ backgroundColor: "#fff" }}
        position="absolute"
        open={open}
      >
        <Toolbar
          sx={{
            pr: "24px", // keep right padding when drawer closed
          }}
        >
          <IconButton
            edge="start"
            color="primary"
            aria-label="open drawer"
            onClick={toggleDrawer}
            sx={{
              marginRight: "36px",
              ...(open && { display: "none" }),
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            component="h1"
            variant="h6"
            color="primary"
            noWrap
            sx={{ flexGrow: 1 }}
          >
            MOTUKA
          </Typography>
          <IconButton
            component='a'
            onClick={handleLogOut}
          >
            <ExitToApp />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Sidebar open={open} setOpen={setOpen} toggleDrawer={toggleDrawer} />
    </React.Fragment>
  );
}
