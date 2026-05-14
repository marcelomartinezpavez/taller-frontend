import React, { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import { Paper, Typography, Grid, Box, Divider, TextField, InputLabel, MenuItem, FormControl, Select, Button } from "@mui/material";

function Dashboard() {
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // Formatea números con separador de miles para visualización
  const fmt = (n) => {
    const num = Number(n);
    if (isNaN(num) || n === "" || n === null || n === undefined) return "0";
    return num.toLocaleString("es-CL");
  };

  // Parsea fechas en formato ISO o dd/MM/yyyy HH:mm:ss
  const parseDate = (dateStr) => {
    if (!dateStr || dateStr.includes("null")) return null;
    try {
      if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
        const [datePart, timePart] = dateStr.split(" ");
        const [dd, mm, yyyy] = datePart.split("/");
        const [hh, min, ss] = (timePart || "00:00:00").split(":");
        return new Date(yyyy, mm - 1, dd, hh, min, ss);
      }
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  };

  const parseDateFilter = (s) => {
    if (!s) return null;
    const [yyyy, mm, dd] = String(s).split("-").map(Number);
    if (![yyyy, mm, dd].every(Number.isFinite)) return null;
    return new Date(yyyy, mm - 1, dd, 0, 0, 0, 0);
  };

  const getFechaOt = (ot) => {
    if (ot.estado === "CERRADO") return ot.fechaCerrado || ot.fechaIngreso;
    return ot.fechaIngreso;
  };

  // Filtrar ordenes por rango de fechas
  const ordenesFiltradas = ordenes.filter(ot => {
    if (!fechaInicio || !fechaFin) return true;
    const fechaOt = getFechaOt(ot);
    if (!fechaOt) return false;
    const otFecha = parseDate(fechaOt);
    if (!otFecha) return false;
    const inicio = parseDateFilter(fechaInicio);
    const fin = parseDateFilter(fechaFin);
    if (!inicio || !fin) return true;
    fin.setHours(23, 59, 59, 999);
    const t = otFecha.getTime();
    return t >= inicio.getTime() && t <= fin.getTime();
  });

  useEffect(() => {
    api.get("/clientes/all").then(res => setClientes(res.data));
    api.get("/vehiculos/all").then(res => setVehiculos(res.data));
    api.get("/ordenTrabajo/all").then(res => setOrdenes(Array.isArray(res.data) ? res.data : []));

    // Establecer rango de fechas por defecto (último mes)
    const fin = new Date();
    const inicio = new Date();
    inicio.setMonth(inicio.getMonth() - 1);
    const toDateOnly = (d) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };
    setFechaInicio(toDateOnly(inicio));
    setFechaFin(toDateOnly(fin));
  }, []);



  // Título del período
  const hoy = new Date();
  const mesActual = hoy.toLocaleString('es-CL', { month: 'long' });
  const nombreMesCapitalizado = mesActual.charAt(0).toUpperCase() + mesActual.slice(1);
  const anioActual = hoy.getFullYear();

  const tituloPeriodo = fechaInicio && fechaFin
    ? `${parseDateFilter(fechaInicio).toLocaleDateString('es-CL')} - ${parseDateFilter(fechaFin).toLocaleDateString('es-CL')}`
    : `${nombreMesCapitalizado} ${anioActual}`;

  const obtenerSeccionesOrden = (ot) => {
    const toArr = (v) => Array.isArray(v) ? v : (v && typeof v === 'object' ? [v] : []);

    const detalleRepuestos = ot.detalleRepuestos ? toArr(ot.detalleRepuestos) :
                             ot.detalleRepuesto  ? toArr(ot.detalleRepuesto) :
                             ot.detalle          ? toArr(ot.detalle) :
                             ot.detalles         ? toArr(ot.detalles) : [];
    const repuestos = Array.isArray(ot.repuestosOrden) ? ot.repuestosOrden :
                      Array.isArray(ot.repuestos) ? ot.repuestos :
                      Array.isArray(ot.repuesto) ? ot.repuesto : [];
    const trabajosTerceros = Array.isArray(ot.trabajosTerceros) ? ot.trabajosTerceros :
                             Array.isArray(ot.trabajoTercero) ? ot.trabajoTercero :
                             Array.isArray(ot.trabajosTercero) ? ot.trabajosTercero : [];
    return { detalleRepuestos, repuestos, trabajosTerceros };
  };

  const calcularMargenOt = (ot) => {
    const { detalleRepuestos, repuestos, trabajosTerceros } = obtenerSeccionesOrden(ot);

    // detalleRepuestos (mano de obra) es 100% margen: se suma el total completo
    const totalManoObra = detalleRepuestos.reduce((acc, d) => acc + Number(d.total || 0), 0);

    // repuestos y terceros: el margen es solo el recargo aplicado
    const sumaRecargosRepuestos = repuestos.reduce((acc, r) => {
      const valor = Number(r.valor || 0);
      const cantidad = Number(r.cantidad || 1);
      const recargo = Number(r.porcentajeRecargo || 0);
      return acc + (valor * cantidad * recargo / 100);
    }, 0);
    const sumaRecargosTerceros = trabajosTerceros.reduce((acc, tt) => {
      const valor = Number(tt.valorTercero || tt.valor || 0);
      const cantidad = Number(tt.cantidadTercero || tt.cantidad || 1);
      const recargo = Number(tt.porcentajeRecargoTercero || tt.porcentajeRecargo || 0);
      return acc + (valor * cantidad * recargo / 100);
    }, 0);
    return totalManoObra + sumaRecargosRepuestos + sumaRecargosTerceros;
  };

  // Cálculos basados en ordenesFiltradas
  const cantidadAbiertas = ordenesFiltradas.filter(o => o.estado !== "CERRADO").length;
  const montoAbiertas = ordenesFiltradas.filter(o => o.estado !== "CERRADO").reduce((acc, o) => acc + Number(o.valorOt || 0), 0);
  const cantidadCerradas = ordenesFiltradas.filter(o => o.estado === "CERRADO").length;
  const montoCerradas = ordenesFiltradas.filter(o => o.estado === "CERRADO").reduce((acc, o) => acc + Number(o.valorOt || 0), 0);
  const totalOrdenes = ordenesFiltradas.length;
  const totalMonto = ordenesFiltradas.reduce((acc, o) => acc + Number(o.valorOt || 0), 0);
  const totalMargen = ordenesFiltradas.reduce((acc, o) => acc + calcularMargenOt(o), 0);
  return (
    <Box sx={{ p: 4, bgcolor: '#fbfcfd', minHeight: '100vh' }}>
      <Typography variant="h3" gutterBottom sx={{ fontWeight: 800, color: '#1976d2', mb: 0.5 }}>
        Informacion
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
        Panel de control y resumen financiero del taller para {tituloPeriodo}
      </Typography>
      {/* Filtro por fecha */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          label="Fecha Inicio"
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
          sx={{ width: 150 }}
        />
        <TextField
          label="Fecha Fin"
          type="date"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
          sx={{ width: 150 }}
        />
        <Button variant="outlined" size="small" onClick={() => { setFechaInicio(""); setFechaFin(""); }}>Limpiar</Button>
      </Box>

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
          <Typography variant="h2" sx={{ fontWeight: 800 }}>{totalOrdenes}</Typography>
        </Paper>

        {/* FILA 2: Desglose Actual */}
        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', bgcolor: '#fffde7' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.8rem', mb: 1 }}>Órdenes Abiertas</Typography>
          <Typography variant="h3" sx={{ color: 'primary.main', fontWeight: 800 }}>{cantidadAbiertas}</Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', bgcolor: '#e0f2f1' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.8rem', mb: 1 }}>Monto en OT Abiertas</Typography>
          <Typography variant="h3" sx={{ color: '#1565c0', fontWeight: 800 }}>${fmt(montoAbiertas)}</Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', bgcolor: '#e8f5e9' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.8rem', mb: 1 }}>Monto en OT Cerradas</Typography>
          <Typography variant="h3" sx={{ color: 'success.main', fontWeight: 800 }}>${fmt(montoCerradas)}</Typography>
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
          <Typography variant="h3" sx={{ fontWeight: 900 }}>${fmt(montoCerradas)}</Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>{cantidadCerradas} Ordenes Finalizadas</Typography>
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
          <Typography variant="h3" sx={{ fontWeight: 900 }}>${fmt(totalMonto)}</Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>{totalOrdenes} Total Ordenes</Typography>
        </Paper>

        <Paper sx={{
          p: 3,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #4a148c 0%, #7b1fa2 100%)',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <Typography variant="subtitle2" sx={{ opacity: 0.9, fontWeight: 500, mb: 1 }}>Margen de OT</Typography>
          <Typography variant="h3" sx={{ fontWeight: 900 }}>${fmt(totalMargen)}</Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>{totalOrdenes} Órdenes en el período</Typography>
        </Paper>


      </Box>
    </Box>
  );
}

export default Dashboard;

