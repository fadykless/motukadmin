import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import ReportRoundedIcon from "@mui/icons-material/ReportRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";

export const menus = [
  {
    title: "",
    items: [
      {
        label: "Dashboard",
        icon: <DashboardRoundedIcon />,
        href: "/dashboard",
      },
      {
        label: "Marketplace",
        icon: <DirectionsCarRoundedIcon />,
        href: "/marketplace",
      },
    ],
  },


  {
    title: "UTILISATEURS",
    items: [
      {
        label: "Utilisateurs",
        icon: <PeopleRoundedIcon />,
        href: "/utilisateurs",
      },
      {
        label: "Favoris",
        icon: <FavoriteRoundedIcon />,
        href: "/favorites",
      },
    ],
  },

  {
    title: "BUSINESS",
    items: [
      {
        label: "Paiements",
        icon: <PaymentsRoundedIcon />,
        href: "/payments",
      },
      {
        label: "Publicités Premium",
        icon: <CampaignRoundedIcon />,
        href: "/premium",
      },
    ],
  },

  {
    title: "INTELLIGENCE",
    items: [
      {
        label: "Motuka AI",
        icon: <SmartToyRoundedIcon />,
        href: "/ai",
      },
      {
        label: "Signalements",
        icon: <ReportRoundedIcon />,
        href: "/reports",
      },
      {
        label: "Support",
        icon: <SupportAgentRoundedIcon />,
        href: "/support",
      },
    ],
  },

  {
    title: "ADMINISTRATION",
    items: [
      {
        label: "Statistiques",
        icon: <BarChartRoundedIcon />,
        href: "/analytics",
      },
      {
        label: "Paramètres",
        icon: <SettingsRoundedIcon />,
        href: "/settings",
      },
    ],
  },
];
