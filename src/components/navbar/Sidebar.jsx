"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import { menus } from "./drawerItems";

const drawerWidth = 270;

export default function Sidebar({
  mobile = false,
  closeDrawer,
}) {
  const pathname = usePathname();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          borderRight: "1px solid",
          borderColor: "divider",
          boxSizing: "border-box",
        },
      }}
    >
      <Toolbar>
        <Box>
          <Typography
            variant="h5"
            fontWeight={900}
          >
            MOTUKA
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Back Office
          </Typography>
        </Box>
      </Toolbar>

      <Divider />

      <Box
        sx={{
          overflow: "auto",
          py: 2,
        }}
      >
        {menus.map((section) => (
          <Box
            key={section.title}
            sx={{ mb: 2 }}
          >
            {section.title && (
              <Typography
                variant="caption"
                sx={{
                  px: 3,
                  mb: 1,
                  display: "block",
                  color: "text.secondary",
                  fontWeight: 700,
                  letterSpacing: 1,
                }}
              >
                {section.title}
              </Typography>
            )}

            <List disablePadding>
              {section.items.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");

                return (
                  <ListItemButton
                    key={item.href}
                    component={Link}
                    href={item.href}
                    onClick={
                      mobile
                        ? closeDrawer
                        : undefined
                    }
                    selected={active}
                    sx={{
                      mx: 1,
                      mb: 0.5,
                      borderRadius: 2,
                      "&.Mui-selected": {
                        bgcolor: "primary.main",
                        color: "white",
                        "& .MuiListItemIcon-root": {
                          color: "white",
                        },
                      },
                    }}
                  >
                    <ListItemIcon>
                      {item.icon}
                    </ListItemIcon>

                    <ListItemText
                      primary={item.label}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>
    </Drawer>
  );
}