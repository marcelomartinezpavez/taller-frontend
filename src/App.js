import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import Dashboard from "./components/Dashboard";
import ClientesCRUD from "./components/ClientesCRUD";
import VehiculosCRUD from "./components/VehiculosCRUD";
import OrdenTrabajoCRUD from "./components/OrdenTrabajoCRUD";
import ReportesReparaciones from "./components/ReportesReparaciones";
import RepuestosCRUD from "./components/RepuestosCRUD";
import ProveedorCRUD from "./components/ProveedorCRUD";

function App() {
  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Taller Backend - Frontend React
          </Typography>
          <Button color="inherit" component={Link} to="/">Dashboard</Button>
          <Button color="inherit" component={Link} to="/clientes">Clientes</Button>
          <Button color="inherit" component={Link} to="/vehiculos">Vehículos</Button>
          <Button color="inherit" component={Link} to="/proveedores">Proveedores</Button>
          <Button color="inherit" component={Link} to="/ordenes">Orden de Trabajo</Button>
          <Button color="inherit" component={Link} to="/repuestos">Repuestos</Button>
          <Button color="inherit" component={Link} to="/reportes">Reportes</Button>
        </Toolbar>
      </AppBar>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clientes" element={<ClientesCRUD />} />
        <Route path="/vehiculos" element={<VehiculosCRUD />} />
        <Route path="/proveedores" element={<ProveedorCRUD />} />
        <Route path="/ordenes" element={<OrdenTrabajoCRUD />} />
        <Route path="/repuestos" element={<RepuestosCRUD />} />
        <Route path="/reportes" element={<ReportesReparaciones />} />
      </Routes>
    </Router>
  );
}

export default App;