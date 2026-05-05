import React from "react";
import ArticleIcon from "@mui/icons-material/Article";
import PublishIcon from "@mui/icons-material/Publish";
import CallReceivedIcon from '@mui/icons-material/CallReceived';
import BuildIcon from '@mui/icons-material/Build';
import DirectionsCarFilledIcon from '@mui/icons-material/DirectionsCarFilled';
import StoreIcon from '@mui/icons-material/Store';

const iconProps = {
  color: "primary",
};

export const drawerItems = [
  {
    text: "Marketplace",
    icon: <StoreIcon {...iconProps} />,
    path: "/marketplace",
  },
  {
    text: "Location",
    icon: <DirectionsCarFilledIcon {...iconProps} />,
    path: "/location",
  },
  {
    text: "Pièces détachées",
    icon: <BuildIcon {...iconProps} />,
    path: "/pieces",
  },
];

export const secondaryListItems = [
  {
    text: "Offres reçues",
    icon: <CallReceivedIcon {...iconProps} />,
    path: "/offres-recues",
  },
  {
    text: "Publier",
    icon: <PublishIcon {...iconProps} />,
    path: "/publier-une-annonce",
  },

];
