import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import Slider from "react-slick";
import { IconButton, useTheme } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "white",
  boxShadow: 24,
  p: 2,
  overflow: "scroll",
  height: 750,
};

const settings = {
  infinite: true,
  slidesToShow: 1,
  slidesToScroll: 1,
  dots: true,
};

export default function HouseModal({ house, open, setOpen }) {
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const theme = useTheme();

  return (
    <React.Fragment>
      <IconButton onClick={handleOpen} sx={{ alignSelf: "center", mt: 1.5 }}>
        <VisibilityIcon />
      </IconButton>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Slider {...settings}>
            {house.images.map((image) => (
              <Box key={image} sx={{ my: 1, width: 400, height: 400, overflow: "hidden" }}>
                <img src={image} width={400} alt="image" />
              </Box>
            ))}
          </Slider>
          <Typography
            color={"primary"}
            variant="h5"
            fontWeight={"600"}
            id="modal-modal-description"
            sx={{ mt: 5, mb: 1 }}
          >
            {house.type}
          </Typography>
          <Typography>{house.description}</Typography>
          <Typography
            textAlign={"center"}
            sx={{
              mt: 2,
              backgroundColor: theme.palette.primary.main,
              color: "white",
              p: 0.5,
              width: "50%",
              borderRadius: 1,
              fontSize: 15,
            }}
          >
            {house.price} USD
          </Typography>
        </Box>
      </Modal>
    </React.Fragment>
  );
}
