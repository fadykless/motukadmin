import {
  Box,
  Grid,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import React, { Fragment } from "react";

const Cars = ({ data }) => {
  const theme = useTheme();

  return (
    <Fragment>
      <Grid item key={data.id} size={{ xs: 6, md: 3 }}>
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
              height: 200,
              px: { md: 10, xs: 6 },
              pt: { xs: 6, md: false },
              overflow: "hidden",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundImage: `linear-gradient(
        to bottom,
         ${alpha(theme.palette.primary.main, 0.0)},
         ${alpha("#000", 0.0)}
      ), url(${data.images[0]})`,
            }}
          ></Box>
          <Box sx={{ p: 3 }}>
            <Typography color={"text.primary"} fontWeight={'600'} variant="h5">
              {data.name}
            </Typography>
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
                  backgroundColor: theme.palette.secondary.main,
                  color: "red",
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
    </Fragment>
  );
};

export default Cars;
