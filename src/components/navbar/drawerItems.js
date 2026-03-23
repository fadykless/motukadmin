import React from "react";
import ArticleIcon from "@mui/icons-material/Article";
import PublishIcon from "@mui/icons-material/Publish";
import VideoCallIcon from '@mui/icons-material/VideoCall';

const iconProps = {
  color: "primary",
};

export const drawerItems = [
  {
    text: "Annonces",
    icon: <ArticleIcon {...iconProps} />,
    path: "/annonces",
  },
];

export const secondaryListItems = [
  {
    text: "Publier",
    icon: <PublishIcon {...iconProps} />,
    path: "/publier-une-annonce",
  },

];
