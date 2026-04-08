import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";

import ClientesCRUD from "./components/ClientesCRUD";
import VehiculosCRUD from "./components/VehiculosCRUD";
import OrdenTrabajoCRUD from "./components/OrdenTrabajoCRUD";
import ReportesReparaciones from "./components/ReportesReparaciones";
import RepuestosCRUD from "./components/RepuestosCRUD";
import ProveedorCRUD from "./components/ProveedorCRUD";

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

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <>
      {!isLoginPage && (
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Taller
            </Typography>
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Button color="inherit" component={Link} to="/">Dashboard</Button>
              <Button color="inherit" component={Link} to="/clientes">Clientes</Button>
              <Button color="inherit" component={Link} to="/vehiculos">Vehículos</Button>
              <Button color="inherit" component={Link} to="/proveedores">Proveedores</Button>
              <Button color="inherit" component={Link} to="/ordenes">Orden de Trabajo</Button>
              <Button color="inherit" component={Link} to="/repuestos">Repuestos</Button>
              <Button color="inherit" component={Link} to="/reportes">Reportes</Button>
            </Box>
            <Button color="secondary" variant="contained" onClick={handleLogout} sx={{ ml: 2, borderRadius: 2 }}>
              Cerrar sesión
            </Button>
          </Toolbar>
        </AppBar>
      )}

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/clientes" element={<ProtectedRoute><ClientesCRUD /></ProtectedRoute>} />
        <Route path="/vehiculos" element={<ProtectedRoute><VehiculosCRUD /></ProtectedRoute>} />
        <Route path="/proveedores" element={<ProtectedRoute><ProveedorCRUD /></ProtectedRoute>} />
        <Route path="/ordenes" element={<ProtectedRoute><OrdenTrabajoCRUD /></ProtectedRoute>} />
        <Route path="/repuestos" element={<ProtectedRoute><RepuestosCRUD /></ProtectedRoute>} />
        <Route path="/reportes" element={<ProtectedRoute><ReportesReparaciones /></ProtectedRoute>} />
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