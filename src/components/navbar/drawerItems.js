import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import ReportRoundedIcon from "@mui/icons-material/ReportRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";

const iconColor = "white";

export const menus = [
  {
    title: "",
    items: [
      {
        label: "Dashboard",
        icon: <DashboardRoundedIcon sx={{ color: iconColor }} />,
        href: "/dashboard",
      },
      {
        label: "Marketplace",
        icon: <DirectionsCarRoundedIcon sx={{ color: iconColor }} />,
        href: "/marketplace",
      },
    ],
  },
  {
    title: "UTILISATEURS",
    items: [
      {
        label: "Utilisateurs",
        icon: <PeopleRoundedIcon sx={{ color: iconColor }} />,
        href: "/utilisateurs",
      },
      {
        label: "Favoris",
        icon: <FavoriteRoundedIcon sx={{ color: iconColor }} />,
        href: "/favorites",
      },
      {
        label: "Partenaires",
        icon: <HandshakeRoundedIcon sx={{ color: iconColor }} />,
        href: "/partenaires",
      },
    ],
  },
  {
    title: "BUSINESS",
    items: [
      {
        label: "Paiements",
        icon: <PaymentsRoundedIcon sx={{ color: iconColor }} />,
        href: "/payments",
      },
      {
        label: "Publicités Premium",
        icon: <CampaignRoundedIcon sx={{ color: iconColor }} />,
        href: "/premium",
      },
    ],
  },
  {
    title: "INTELLIGENCE",
    items: [
      {
        label: "Motuka AI",
        icon: <SmartToyRoundedIcon sx={{ color: iconColor }} />,
        href: "/ai",
      },
      {
        label: "Signalements",
        icon: <ReportRoundedIcon sx={{ color: iconColor }} />,
        href: "/reports",
      },
      {
        label: "Support",
        icon: <SupportAgentRoundedIcon sx={{ color: iconColor }} />,
        href: "/support",
      },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      {
        label: "Statistiques",
        icon: <BarChartRoundedIcon sx={{ color: iconColor }} />,
        href: "/analytics",
      },
      {
        label: "Paramètres",
        icon: <SettingsRoundedIcon sx={{ color: iconColor }} />,
        href: "/settings",
      },
    ],
  },
];