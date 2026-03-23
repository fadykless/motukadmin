import { Box } from "@mui/material";
import React from "react";

const Logo = ({ width }) => {
  return (
    <Box>
      <img src="/images/logo.png" alt="" width={width} />
    </Box>
  );
};

export default Logo;
