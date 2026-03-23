import { IconButton, InputBase, Paper } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import React from "react";

const SearchBar = ({ searchFilter, placeholder }) => {
  return (
    <Paper
      elevation={0}
      component="form"
      sx={{
        display: "flex",
        alignItems: "center",
        borderRadius: 10,
      }}
    >
      <InputBase
        sx={{
          flex: 1,
          ml: 3,
        }}
        placeholder={placeholder}
        inputProps={{ "aria-label": { placeholder } }}
        onChange={(e) => searchFilter(e.target.value)}
      />
      <IconButton aria-label="search" sx={{ mr: 1 }}>
        <SearchIcon fontSize="5" />
      </IconButton>
    </Paper>
  );
};

export default SearchBar;
