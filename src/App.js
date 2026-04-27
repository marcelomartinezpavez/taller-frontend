import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText, ListItemIcon } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import BuildIcon from "@mui/icons-material/Build";
import AssignmentIcon from "@mui/icons-material/Assignment";
import InventoryIcon from "@mui/icons-material/Inventory";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AssessmentIcon from "@mui/icons-material/Assessment";
import LogoutIcon from "@mui/icons-material/Logout";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";

import ClientesCRUD from "./components/ClientesCRUD";
import VehiculosCRUD from "./components/VehiculosCRUD";
import OrdenTrabajoCRUD from "./components/OrdenTrabajoCRUD";
import ReportesReparaciones from "./components/ReportesReparaciones";
import RepuestosCRUD from "./components/RepuestosCRUD";
import ProveedorCRUD from "./components/ProveedorCRUD";
import AgendaCRUD from "./components/AgendaCRUD";

const menuItems = [
  { text: "Dashboard", path: "/", icon: <DashboardIcon /> },
  { text: "Clientes", path: "/clientes", icon: <PeopleIcon /> },
  { text: "Vehículos", path: "/vehiculos", icon: <DirectionsCarIcon /> },
  { text: "Proveedores", path: "/proveedores", icon: <BuildIcon /> },
  { text: "Orden de Trabajo", path: "/ordenes", icon: <AssignmentIcon /> },
  { text: "Repuestos", path: "/repuestos", icon: <InventoryIcon /> },
  { text: "Agenda", path: "/agenda", icon: <CalendarMonthIcon /> },
  { text: "Reportes", path: "/reportes", icon: <AssessmentIcon /> },
];

const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem("user");
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

function AppRoutes() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box sx={{ width: 250, pt: 2 }}>
      <Typography variant="h6" sx={{ px: 2, pb: 2, fontWeight: 'bold' }}>
        Taller
      </Typography>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton component={Link} to={item.path} onClick={() => setMobileOpen(false)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Cerrar sesión" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      {!isLoginPage && (
        <AppBar position="static">
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, display: { xs: 'block', md: 'none' } }}>
              Taller
            </Typography>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }}>
              Taller
            </Typography>
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              {menuItems.map((item) => (
                <Button key={item.text} color="inherit" component={Link} to={item.path}>
                  {item.text}
                </Button>
              ))}
              <Button color="secondary" variant="contained" onClick={handleLogout}>
                Cerrar sesión
              </Button>
            </Box>
          </Toolbar>
        </AppBar>
      )}
      
      <Box component="nav" sx={{ width: { md: 240 }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: 250 } }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/clientes" element={<ProtectedRoute><ClientesCRUD /></ProtectedRoute>} />
        <Route path="/vehiculos" element={<ProtectedRoute><VehiculosCRUD /></ProtectedRoute>} />
        <Route path="/proveedores" element={<ProtectedRoute><ProveedorCRUD /></ProtectedRoute>} />
        <Route path="/ordenes" element={<ProtectedRoute><OrdenTrabajoCRUD /></ProtectedRoute>} />
        <Route path="/repuestos" element={<ProtectedRoute><RepuestosCRUD /></ProtectedRoute>} />
        <Route path="/agenda" element={<ProtectedRoute><AgendaCRUD /></ProtectedRoute>} />
        <Route path="/reportes" element={<ProtectedRoute><ReportesReparaciones /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;