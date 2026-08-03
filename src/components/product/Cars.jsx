'use client'
import {
  Box,
  Grid,
  IconButton,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import React, { Fragment, useState } from "react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useDispatch } from "react-redux";
import { deleteProduct } from "@/redux/actions/productActions";
import moment from "moment";
import 'moment/locale/fr'
import {
  Menu,
  MenuItem,
  Chip,
  Divider
} from "@mui/material";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import SellOutlinedIcon from "@mui/icons-material/SellOutlined";
import {
  deleteDoc,
  doc,
  updateDoc
} from "firebase/firestore";

import { db } from "@/firebase";
import { toast } from "react-toastify";
import { Checkbox } from "@mui/material";

const Cars = ({
  data,
  selectionMode = false,
  selected = false,
  onSelect,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch()
  const [anchorEl, setAnchorEl] = useState(null);

  const open = Boolean(anchorEl);

  const handleMenu = (e) => setAnchorEl(e.currentTarget);

  const closeMenu = () => setAnchorEl(null);

  const validateProduct = async () => {

    try {

      await updateDoc(
        doc(db, "products", data.id),
        {
          status: "validated"
        }
      );

      toast.success("Annonce validée");

    } catch (err) {

      toast.error(err.message);

    }

    closeMenu();

  };

  const removeMarketplace = async () => {

    try {

      await updateDoc(
        doc(db, "products", data.id),
        {
          status: "hidden"
        }
      );

      toast.success("Annonce retirée du marketplace");

    } catch (err) {

      toast.error(err.message);

    }

    closeMenu();

  };

  const markAsSold = async () => {

    try {

      await updateDoc(
        doc(db, "products", data.id),
        {
          status: "sold"
        }
      );

      toast.success("Annonce marquée comme vendue");

    } catch (err) {

      toast.error(err.message);

    }

    closeMenu();

  };

  const deleteAd = async () => {

    if (!window.confirm("Supprimer cette annonce ?")) return;

    try {

      await deleteDoc(
        doc(db, "products", data.id)
      );

      toast.success("Annonce supprimée");

    } catch (err) {

      toast.error(err.message);

    }

    closeMenu();

  };

  return (
    <Fragment>
      <Grid key={data.id} size={{ xs: 12, md: 3 }}>
        <Box
          sx={{
            "&:hover": {
              borderWidth: 1,
              borderColor: theme.palette.primary.main,
            },
          }}
        >
          <Box
            component={'a'}
            href={"/marketplace/" + data.id}
            sx={{
              display: 'block',
              px: { md: 10, xs: 6 },
              pt: { xs: 6 },
              overflow: "hidden",
              backgroundSize: "cover",
              aspectRatio: '4/5',
              width: '100%',
              borderRadius: 4,
              backgroundPosition: "center",
              backgroundImage: `linear-gradient(
        to bottom,
         ${alpha(theme.palette.primary.main, 0.0)},
         ${alpha("#000", 0.0)}
      ), url(${data.images[0]})`,
            }}
          >
            <Box
              sx={{
                display: "flex",
                position: 'relative',
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 1
              }}
            >
              <Box sx={{ position: 'absolute', top: -40, left: -75 }}>
                {selectionMode && (
                  <Checkbox
                    checked={selected}
                    onChange={() => onSelect(data.id)}
                    sx={{
                      bgcolor: "white",
                    }}
                  />
                )}
                <Chip
                  size="small"
                  sx={{ mx: 1 }}
                  label={
                    data.status === "validated"
                      ? "Validée"
                      : data.status === "sold"
                        ? "Vendue"
                        : data.status === "hidden"
                          ? "Masquée"
                          : "En attente"
                  }
                  color={
                    data.status === "validated"
                      ? "success"
                      : data.status === "sold"
                        ? "warning"
                        : "default"
                  }
                />
              </Box>
            </Box>

          </Box>
          <Box sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 1
              }}
            >
              <Box sx={{ flex: 1 }}>

                <Typography
                  variant="h5"
                  fontWeight={600}
                  color="text.primary"
                >
                  {data.name}
                </Typography>
              </Box>

              <IconButton
                onClick={handleMenu}
                size="small"
              >
                <MoreVertIcon />
              </IconButton>

            </Box>
            <Typography color="text.secondary">{moment(data.createdAt).fromNow()}</Typography>
            <Typography color={"secondary"} variant="h6">
              {data.etat}{" "}
            </Typography>
            <Typography
              component={'a'}
              color={"text.secondary"}
              href={"/marketplace/" + data.id}
              style={{
                textDecoration: 'none',
              }}
            >
              {data.description.slice(0, 100) + "..."}
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignContent: "center",
              }}
            >
              <Typography
                textAlign={"center"}
                fontWeight={'600'}
                sx={{
                  mt: 1,
                  backgroundColor: theme.palette.primary.main,
                  color: "black",
                  p: 0.5,
                  width: "60%",
                  borderRadius: 1,
                  fontSize: 15,
                }}
              >
                {data.price} USD
              </Typography>
            </Box>
          </Box>
        </Box>
      </Grid>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={closeMenu}
      >

        <MenuItem
          component="a"
          href={`/admin/products/${data.id}`}
        >

          <EditIcon sx={{ mr: 1 }} />

          Modifier

        </MenuItem>

        {
          data.status !== "validated" &&

          <MenuItem
            onClick={validateProduct}
          >

            <CheckCircleOutlineIcon sx={{ mr: 1 }} />

            Valider

          </MenuItem>

        }

        {
          data.status === "validated" &&

          <MenuItem
            onClick={removeMarketplace}
          >

            <VisibilityOffOutlinedIcon sx={{ mr: 1 }} />

            Retirer du marketplace

          </MenuItem>

        }

        {
          data.status !== "sold" &&

          <MenuItem
            onClick={markAsSold}
          >

            <SellOutlinedIcon sx={{ mr: 1 }} />

            Marquer vendu

          </MenuItem>

        }

        <Divider />

        <MenuItem
          onClick={deleteAd}
          sx={{
            color: "error.main"
          }}
        >

          <DeleteIcon sx={{ mr: 1 }} />

          Supprimer

        </MenuItem>

      </Menu>s
    </Fragment>
  );
};

export default Cars;
