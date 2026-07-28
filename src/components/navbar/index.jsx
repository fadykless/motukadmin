"use client";

import * as React from "react";
import { styled } from "@mui/material/styles";
import MuiAppBar from "@mui/material/AppBar";
import {
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Badge,
  Tooltip,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";

import Sidebar from "./Sidebar";

import { useDispatch } from "react-redux";
import { logOut } from "@/redux/actions/authActions";
import { useRouter } from "next/navigation";

const drawerWidth = 270;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  background: "#fff",
  color: "#111",
  boxShadow: "0 1px 8px rgba(0,0,0,.06)",
  transition: theme.transitions.create(["width", "margin"]),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
  }),
}));

export default function Navbar() {

  const [open, setOpen] = React.useState(true);

  const dispatch = useDispatch();

  const router = useRouter();

  const toggleDrawer = () => setOpen(!open);

  const redirect = () => router.push("/");

  const handleLogOut = () => {

    if (
      window.confirm(
        "Êtes-vous sûr de vouloir vous déconnecter ?"
      )
    ) {

      dispatch(logOut(redirect));

    }

  };

  return (
    <>

      <AppBar
        position="fixed"
        elevation={0}
        open={open}
      >

        <Toolbar>

          {!open && (

            <IconButton
              onClick={toggleDrawer}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>

          )}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexGrow: 1,
            }}
          >

            {/* <img
              src="/logo_motuka.png"
              alt="Motuka"
              height={38}
            /> */}

            <Box>

              <Typography
                fontWeight={700}
                fontSize={18}
              >
                MOTUKA Admin
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                Tableau de bord
              </Typography>

            </Box>

          </Box>

          <Tooltip title="Notifications">

            <IconButton>

              <Badge
                badgeContent={3}
                color="error"
              >
                <NotificationsOutlinedIcon />
              </Badge>

            </IconButton>

          </Tooltip>

          <Tooltip title="Administrateur">

            <IconButton sx={{ ml: 1 }}>

              <Avatar
                src="/avatar.png"
                sx={{
                  width: 38,
                  height: 38,
                }}
              />

            </IconButton>

          </Tooltip>

          <Tooltip title="Déconnexion">

            <IconButton
              onClick={handleLogOut}
              color="error"
            >

              <LogoutRoundedIcon />

            </IconButton>

          </Tooltip>

        </Toolbar>

      </AppBar>

      <Sidebar
        open={open}
        setOpen={setOpen}
        toggleDrawer={toggleDrawer}
      />

    </>

  );

}