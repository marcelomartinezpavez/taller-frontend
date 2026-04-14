import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Paper, Typography, Grid, Box, Divider } from "@mui/material";

function Dashboard() {
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [statsCerradas, setStatsCerradas] = useState({ totalValorOt: 0, cantidadOrdenes: 0 });
  const [statsMensual, setStatsMensual] = useState({ totalValorOt: 0, cantidadOrdenes: 0 });

  // Formatea números con separador de miles para visualización
  const fmt = (n) => {
    const num = Number(n);
    if (isNaN(num) || n === "" || n === null || n === undefined) return "0";
    return num.toLocaleString("es-CL");
  };

  useEffect(() => {
    api.get("/clientes/all").then(res => setClientes(res.data));
    api.get("/vehiculos/all").then(res => setVehiculos(res.data));
    api.get("/ordenTrabajo/all").then(res => setOrdenes(res.data));
    api.get("/ordenTrabajo/cerradas").then(res => setStatsCerradas(res.data));
    api.get("/ordenTrabajo/mensual").then(res => setStatsMensual(res.data));
  }, []);

  // Estadísticas del mes actual para el encabezado
  const hoy = new Date();
  const mesActual = hoy.toLocaleString('es-CL', { month: 'long' });
  const nombreMesCapitalizado = mesActual.charAt(0).toUpperCase() + mesActual.slice(1);
  const anioActual = hoy.getFullYear();

  // Cálculos derivados para el desglose (Mensual Total - Cerradas = Abiertas)
  const montoAbiertas = statsMensual.totalValorOt - statsCerradas.totalValorOt;
  const cantidadAbiertas = statsMensual.cantidadOrdenes - statsCerradas.cantidadOrdenes;

  return (
    <Box sx={{ p: 4, bgcolor: '#fbfcfd', minHeight: '100vh' }}>
      <Typography variant="h3" gutterBottom sx={{ fontWeight: 800, color: '#1976d2', mb: 0.5 }}>
        Informacion
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
        Panel de control y resumen financiero del taller para {nombreMesCapitalizado} {anioActual}
      </Typography>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: '1fr 1fr',
          md: '1fr 1fr 1fr'
        },
        gap: 3
      }}>
        {/* FILA 1: Estadísticas Generales */}
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 4, borderTop: '4px solid #1976d2', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1.2 }}>Clientes Registrados</Typography>
          <Typography variant="h2" sx={{ fontWeight: 800 }}>{clientes.length}</Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 4, borderTop: '4px solid #388e3c', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1.2 }}>Vehículos Registrados</Typography>
          <Typography variant="h2" sx={{ fontWeight: 800 }}>{vehiculos.length}</Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 4, borderTop: '4px solid #ed6c02', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1.2 }}>Total de Órdenes</Typography>
          <Typography variant="h2" sx={{ fontWeight: 800 }}>{ordenes.length}</Typography>
        </Paper>

        {/* FILA 2: Desglose Actual */}
        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', bgcolor: '#fffde7' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.8rem', mb: 1 }}>Órdenes Abiertas</Typography>
          <Typography variant="h3" sx={{ color: 'primary.main', fontWeight: 800 }}>{cantidadAbiertas}</Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', bgcolor: '#e0f2f1' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.8rem', mb: 1 }}>Monto en OT Abiertas (Mes)</Typography>
          <Typography variant="h3" sx={{ color: '#1565c0', fontWeight: 800 }}>${fmt(montoAbiertas)}</Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', bgcolor: '#e8f5e9' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.8rem', mb: 1 }}>Monto en OT Cerradas (Mes)</Typography>
          <Typography variant="h3" sx={{ color: 'success.main', fontWeight: 800 }}>${fmt(statsCerradas.totalValorOt)}</Typography>
        </Paper>

        {/* FILA 3: Proyecciones y Metas Mensuales */}
        <Paper sx={{
          p: 3,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <Typography variant="subtitle2" sx={{ opacity: 0.9, fontWeight: 500, mb: 1 }}>Ordenes Cerradas</Typography>
          <Typography variant="h3" sx={{ fontWeight: 900 }}>${fmt(statsCerradas.totalValorOt)}</Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>{statsCerradas.cantidadOrdenes} Ordenes Finalizadas en el mes</Typography>
        </Paper>

        <Paper sx={{
          p: 3,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <Typography variant="subtitle2" sx={{ opacity: 0.9, fontWeight: 500, mb: 1 }}>Total Ordenes</Typography>
          <Typography variant="h3" sx={{ fontWeight: 900 }}>${fmt(statsMensual.totalValorOt)}</Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>{statsMensual.cantidadOrdenes} Ordenes del Mes</Typography>
        </Paper>


      </Box>
    </Box>
  );
}

export default Dashboard;