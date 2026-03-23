import {
  Box,
  Button,
  Grid2,
  IconButton,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import React, { Fragment, useState } from "react";

const RentalCars = ({ data }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <Fragment>
      <Grid2 item size={{ xs: 12, md: 3 }}>
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
            href={"/location/" + data.id}
            sx={{
              height: 200,
              display: 'block',
              px: { md: 10, xs: 6 },
              pt: { xs: 6, md: false },
              overflow: "hidden",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundImage: `linear-gradient(
        to bottom,
         ${alpha(theme.palette.primary.main, 0.0)},
         ${alpha("#000", 0.0)}
      ), url(${data.image})`,
            }}
          ></Box>
          <Box sx={{ p: 3 }}>
            <Typography color={"text.primary"} variant="h6">
              {data.name}{" "}
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
                {data.price} USD/jour
              </Typography>
            </Box>
          </Box>
        </Box>
      </Grid2>
    </Fragment>
  );
};

export default RentalCars;
