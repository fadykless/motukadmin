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
import parse from 'html-react-parser'
import { WhatsApp, Verified, VerifiedRounded, ShareRounded, PhoneRounded, SellOutlined, Delete } from "@mui/icons-material";
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

  const contactSeller = () => {
    if (!data.phoneNumber) {
      toast.error("Le vendeur n'a pas renseigné de numéro de téléphone");
      return;
    }

    let phone = data.phoneNumber.replace(/\D/g, "");

    if (phone.startsWith("0")) {
      phone = `243${phone.slice(1)}`;
    }

    if (phone.startsWith("2430")) {
      phone = `243${phone.slice(4)}`;
    }

    const url = `https://motukapp.com/marketplace/${data.id}`;

    const message = `Bonjour, ce véhicule est-il disponible?\n ${url}`;

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank");

    closeMenu();
  };

  const toggleCertification = async () => {
    try {
      await updateDoc(
        doc(db, "products", data.id),
        {
          verified: !data.verified,
          verifiedAt: !data.verified ? Date.now() : null,
        }
      );

      toast.success(
        data.verified
          ? "Certification retirée"
          : "Annonce certifiée"
      );
    } catch (err) {
      toast.error(err.message);
    }

    closeMenu();
  };

  const shareWhatsApp = () => {
    const url = `https://motukapp.com/marketplace/${data.id}`;

    const message = `${data.name} | ${data.price ? `${data.price} USD` : "Prix sur demande"
      }\n📍 ${data.city || "RDC"}\n\nDécouvrez cette annonce sur Motuka :\n${url}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank");

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
              <Box sx={{ position: 'absolute', bottom: 0, left: 0 }}>
                {selectionMode && (
                  <Checkbox
                    checked={selected}
                    onChange={() => onSelect(data.id)}
                    sx={{
                      bgcolor: "white",
                      mt: 40
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
                        ? "danger"
                        : "warning"
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

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    minWidth: 0,
                  }}
                >
                  <Typography
                    variant="h5"
                    fontWeight={600}
                    color="text.primary"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {data.name}
                  </Typography>

                  {data.verified && (
                    <VerifiedRounded
                      sx={{
                        fontSize: 21,
                        color: "secondary.main",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </Box>
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
              {parse(data.description.slice(0, 100) + "...")}
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

        {data.phoneNumber && (
          <MenuItem onClick={contactSeller}>
            <WhatsApp
              sx={{
                mr: 1,
                color: "#25D366",
              }}
            />
            Contacter le vendeur
          </MenuItem>
        )}

        <MenuItem onClick={shareWhatsApp}>
          <ShareRounded sx={{ mr: 1 }} />
          Partager sur WhatsApp
        </MenuItem>

        {data.status !== "validated" && (
          <MenuItem onClick={validateProduct}>
            <CheckCircleOutline sx={{ mr: 1 }} />
            Valider
          </MenuItem>
        )}

        {data.status === "validated" && (
          <MenuItem onClick={toggleCertification}>
            <VerifiedRounded
              sx={{
                mr: 1,
                color: data.verified
                  ? "secondary.main"
                  : "inherit",
              }}
            />
            {data.verified
              ? "Retirer la certification"
              : "Certifier"}
          </MenuItem>
        )}

        {data.status !== "sold" && (
          <MenuItem onClick={markAsSold}>
            <SellOutlined sx={{ mr: 1 }} />
            Marquer vendu
          </MenuItem>
        )}

        <Divider />

        <MenuItem
          onClick={deleteAd}
          sx={{
            color: "error.main",
          }}
        >
          <Delete sx={{ mr: 1 }} />
          Supprimer
        </MenuItem>
      </Menu>
    </Fragment>
  );
};

export default Cars;
