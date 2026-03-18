import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Paper, Typography, Stack } from "@mui/material";

function Dashboard() {
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [ordenes, setOrdenes] = useState([]);

  useEffect(() => {
    api.get("/clientes/all").then(res => setClientes(res.data));
    api.get("/vehiculos/all").then(res => setVehiculos(res.data));
    api.get("/ordenTrabajo/all").then(res => setOrdenes(res.data));
  }, []);

  return (
    <Stack direction="row" spacing={2} sx={{ marginTop: 2 }}>
      <Paper sx={{ padding: 2, flex: 1 }}>
        <Typography variant="h6">Clientes</Typography>
        <Typography variant="h4">{clientes.length}</Typography>
      </Paper>
      <Paper sx={{ padding: 2, flex: 1 }}>
        <Typography variant="h6">Vehículos</Typography>
        <Typography variant="h4">{vehiculos.length}</Typography>
      </Paper>
      <Paper sx={{ padding: 2, flex: 1 }}>
        <Typography variant="h6">Órdenes de Trabajo</Typography>
        <Typography variant="h4">{ordenes.length}</Typography>
      </Paper>
    </Stack>
  );
}

export default Dashboard;