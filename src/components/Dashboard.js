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
        Panel de control y resumen financiero del taller
      </Typography>

      <Grid container spacing={3} alignItems="stretch">
        {/* Contadores Generales */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 4, height: '100%', borderTop: '4px solid #1976d2', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1.2 }}>Clientes Registrados</Typography>
            <Typography variant="h2" sx={{ fontWeight: 800, mt: 1 }}>{clientes.length}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 4, height: '100%', borderTop: '4px solid #388e3c', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1.2 }}>Vehículos Registrados</Typography>
            <Typography variant="h2" sx={{ fontWeight: 800, mt: 1 }}>{vehiculos.length}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 4, height: '100%', borderTop: '4px solid #ed6c02', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1.2 }}>Total de Órdenes</Typography>
            <Typography variant="h2" sx={{ fontWeight: 800, mt: 1 }}>{ordenes.length}</Typography>
          </Paper>
        </Grid>

        {/* Desglose Secundario */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%', textAlign: 'center', borderRadius: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center', bgcolor: '#fff' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Órdenes Abiertas</Typography>
            <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 700, mt: 1 }}>{cantidadAbiertas}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%', textAlign: 'center', borderRadius: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center', bgcolor: '#f8fbfc' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Monto en Abiertas</Typography>
            <Typography variant="h5" sx={{ color: '#1976d2', fontWeight: 700, mt: 1 }}>${fmt(montoAbiertas)}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%', textAlign: 'center', borderRadius: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center', bgcolor: '#e8f5e9' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>Monto en Cerradas</Typography>
            <Typography variant="h5" sx={{ color: 'success.main', fontWeight: 700, mt: 1 }}>${fmt(statsCerradas.totalValorOt)}</Typography>
          </Paper>
        </Grid>

        {/* Sección Mensual */}
        <Grid item xs={12}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mt: 4, mb: 1 }}>
            Estadísticas de {nombreMesCapitalizado} {anioActual}
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, borderRadius: 5, height: '100%', background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', boxShadow: '0 8px 32px rgba(46, 125, 50, 0.25)' }}>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 500, mb: 2 }}>Ventas Cerradas</Typography>
            <Typography variant="h2" sx={{ fontWeight: 900, mb: 2 }}>${fmt(statsCerradas.totalValorOt)}</Typography>
            <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>{statsCerradas.cantidadOrdenes} Órdenes Finalizadas</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, borderRadius: 5, height: '100%', background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', boxShadow: '0 8px 32px rgba(21, 101, 192, 0.25)' }}>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 500, mb: 2 }}>Total Proyectado (Abiertas + Cerradas)</Typography>
            <Typography variant="h2" sx={{ fontWeight: 900, mb: 2 }}>${fmt(statsMensual.totalValorOt)}</Typography>
            <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>{statsMensual.cantidadOrdenes} Órdenes del Mes</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;