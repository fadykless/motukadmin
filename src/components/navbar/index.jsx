"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Sidebar from "./Sidebar";

import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Drawer,
  IconButton,
  InputBase,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";

import { useTheme } from "@mui/material/styles";

import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import { auth, db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";


const drawerWidth = 270;


export default function Navbar() {

  const theme = useTheme();

  const router = useRouter();

  const mobile = useMediaQuery(
    theme.breakpoints.down("lg")
  );


  const [open, setOpen] = useState(false);

  const [user, setUser] = useState(null);

  const [profile, setProfile] = useState(null);

  const [anchorEl, setAnchorEl] = useState(null);



  useEffect(() => {

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {

        if (currentUser) {

          setUser(currentUser);


          const userSnap = await getDoc(
            doc(db, "users", currentUser.uid)
          );


          if (userSnap.exists()) {

            setProfile(userSnap.data());

          }

        }

      }
    );


    return () => unsubscribe();

  }, []);



  const handleLogout = async () => {

    await signOut(auth);

    router.replace("/auth");

  };



  const handleMenu = (event) => {

    setAnchorEl(event.currentTarget);

  };


  const closeMenu = () => {

    setAnchorEl(null);

  };


  const username =
    profile?.name ||
    user?.displayName ||
    "Utilisateur";


  const avatar =
    profile?.avatar ||
    user?.photoURL ||
    "";



  return (

    <>

      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          borderBottom: "1px solid",
          borderColor: "divider",
          backgroundColor: '#000'
        }}
      >

        <Toolbar>


          {
            mobile && (

              <IconButton
                onClick={() => setOpen(true)}
                sx={{ mr: 1 }}
              >

                <MenuRoundedIcon />

              </IconButton>

            )
          }



          <Typography
            variant="h6"
            fontWeight={900}
            sx={{ mr: 4 }}
          >

            <img
              src="/logo_motuka.png"
              width={150}
              alt="Motuka"
            />

          </Typography>




          <Box
            sx={{
              display: {
                xs: "none",
                md: "flex",
              },
              alignItems: "center",
              bgcolor: "#f3f4f6",
              px: 2,
              borderRadius: 50,
              width: 350,
              ml: 2,
            }}
          >

            <SearchRoundedIcon
              fontSize="small"
              sx={{
                mr: 1,
                color: "text.secondary",
              }}
            />
            <InputBase
              placeholder="Rechercher..."
              fullWidth
            />
          </Box>
          <Box sx={{ flexGrow: 1 }} />

          <IconButton>
            <Badge
              badgeContent={3}
              color="error"
            >
              <NotificationsNoneRoundedIcon sx={{ color: 'white' }} />
            </Badge>
          </IconButton>

          <IconButton
            onClick={handleMenu}
            sx={{ ml: 1 }}
          >
            <Avatar
              src={avatar}
              sx={{
                width: 38,
                height: 38,
              }}
            >
              {
                username
                  ?.charAt(0)
                  ?.toUpperCase()
              }
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={closeMenu}
          >
            <Box
              sx={{
                px: 2,
                py: 1,
              }}
            >

              <Typography
                fontWeight={700}
              >
                {username}
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                {profile?.role}
              </Typography>
            </Box>


            <MenuItem
              onClick={handleLogout}
            >
              <LogoutRoundedIcon
                sx={{ mr: 1 }}
                fontSize="small"
              />
              Déconnexion
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {!mobile && <Sidebar />}

      <Drawer
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
        ModalProps={{
          keepMounted: true
        }}
        PaperProps={{
          sx: {
            width: drawerWidth,
          }
        }}
      >

        <Sidebar
          mobile
          closeDrawer={() => setOpen(false)}
        />
      </Drawer>
    </>

  );

}