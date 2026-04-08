import React, { useEffect, useState } from "react";
import api from "../services/api";
import {
  Paper, Typography, Box, TextField, Button,
  Select, MenuItem, InputLabel, FormControl,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Grid, Slider
} from "@mui/material";

function OrdenTrabajoCRUD() {
  const selectFieldSx = { "& .MuiOutlinedInput-root": { minHeight: 56 } };

  // Formatea números con separador de miles
  const fmt = (n) => {
    const num = Number(n);
    if (isNaN(num) || n === "" || n === null || n === undefined) return "-";
    return num.toLocaleString("es-CL");
  };
  const [ordenes, setOrdenes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [repuestos, setRepuestos] = useState([]);

  const [formData, setFormData] = useState({
    id: "",
    numeroOrden: "",
    habilitado: true,
    rutCliente: "",
    patenteVehiculo: "",
    kilometrajeVehiculoActual: "",
    codigo: "",
    valorOt: "",
    estado: "ABIERTA",
    observaciones: "",
    nivelCombustible: 0,
    idEmpresa: "",
    detalleRepuesto: [],
    trabajosGenerales: [],
    trabajosTerceros: []
  });
  const [editMode, setEditMode] = useState(false);
  const [detalleTemp, setDetalleTemp] = useState({
    descripcion: "",
    porcentajeRecargo: "",
    valor: "",
    cantidad: "",
    repuesto_id: ""
  });
  const [trabajoGeneralTemp, setTrabajoGeneralTemp] = useState({
    descripcionGeneral: "",
    porcentajeRecargoGeneral: "",
    valorGeneral: "",
    totalGeneral: "",
    prestadorServicioGeneral: ""
  });
  const [trabajoTerceroTemp, setTrabajoTerceroTemp] = useState({
    descripcionTercero: "",
    porcentajeRecargoTercero: "",
    valorTercero: "",
    totalTercero: "",
    prestadorServicioTercero: ""
  });
  const [detalleIndex, setDetalleIndex] = useState(0);
  const [trabajoGeneralIndex, setTrabajoGeneralIndex] = useState(0);
  const [trabajoTerceroIndex, setTrabajoTerceroIndex] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  useEffect(() => {
    cargarOrdenes();
    cargarClientes();
    cargarVehiculos();
    cargarRepuestos();
  }, []);
  useEffect(() => {
    if (formData.rutCliente) {
      api.get(`/vehiculos/cliente/${formData.rutCliente}`)
        .then(res => setVehiculos(res.data))
        .catch(err => console.error(err));
    }
  }, [formData.rutCliente]);

  useEffect(() => {
    const totalRepuestos = formData.detalleRepuesto.reduce((acc, d) => acc + Number(d.total || 0), 0);
    const totalGenerales = formData.trabajosGenerales.reduce((acc, d) => acc + Number(d.total || 0), 0);
    const totalTerceros = formData.trabajosTerceros.reduce((acc, d) => acc + Number(d.total || 0), 0);

    setFormData(prev => ({
      ...prev,
      valorOt: totalRepuestos + totalGenerales + totalTerceros
    }));
  }, [formData.detalleRepuesto, formData.trabajosGenerales, formData.trabajosTerceros]);

  useEffect(() => {
    const base = Number(detalleTemp.cantidad) * Number(detalleTemp.valor);
    const recargo = (Number(detalleTemp.porcentajeRecargo) * base) / 100;
    const totalDetalle = base + recargo;
    setDetalleTemp(prev => {
      const next = { ...prev, total: totalDetalle };
      if (!editMode || !formData.detalleRepuesto[detalleIndex]) return next;
      setFormData(current => {
        const detalleActualizado = [...current.detalleRepuesto];
        detalleActualizado[detalleIndex] = { ...detalleActualizado[detalleIndex], ...next };
        return { ...current, detalleRepuesto: detalleActualizado };
      });
      return next;
    });
  }, [detalleTemp.cantidad, detalleTemp.valor, detalleTemp.porcentajeRecargo]);

  const cargarOrdenes = () => {
    api.get("/ordenTrabajo/all")
      .then(res => setOrdenes(res.data))
      .catch(err => console.error(err));
  };

  const cargarClientes = () => {
    api.get("/clientes/all")
      .then(res => setClientes(res.data))
      .catch(err => console.error(err));
  };

  const cargarVehiculos = () => {
    api.get("/vehiculos/all")
      .then(res => setVehiculos(res.data))
      .catch(err => console.error(err));
  };

  const cargarRepuestos = () => {
    api.get("/repuesto/all")
      .then(res => setRepuestos(res.data))
      .catch(err => console.error(err));
  };

  const guardarOrden = () => {
    if (editMode) {
      api.put("/ordenTrabajo/update", formData)
        .then(() => {
          cargarOrdenes();
          resetForm();
        })
        .catch(err => console.error(err));
    } else {
      api.post("/ordenTrabajo/insert", formData)
        .then(() => {
          cargarOrdenes();
          resetForm();
        })
        .catch(err => console.error(err));
    }
  };

  const normalizarOrdenParaEdicion = (orden) => {
    const detallesRaw =
      orden.detalleRepuestos ||
      orden.detalleRepuestosDtos ||
      orden.detalleRepuesto ||
      orden.detalleRepuestoList ||
      orden.detalle ||
      orden.detalles ||
      [];
    const trabajosGeneralesRaw = orden.trabajosGenerales || orden.trabajoGeneral || orden.trabajosGeneral || [];
    const trabajosTercerosRaw = orden.trabajosTerceros || orden.trabajoTercero || orden.trabajosTercero || [];

    const detalles = detallesRaw.map(d => ({
      descripcion: d.descripcion || d.descripcionDetalle || d.nombre || "",
      porcentajeRecargo: d.porcentajeRecargo || d.recargo || d.porcentaje || "",
      valor: d.valor || d.valorDetalle || d.precio || "",
      cantidad: d.cantidad || d.cantidadDetalle || 1,
      total: d.total || d.montoTotal || d.subtotal || "",
      repuesto_id: d.repuesto_id || d.repuestoId || d.idRepuesto || d.repuesto?.id || ""
    }));

    const trabajosGenerales = trabajosGeneralesRaw.map(tg => ({
      descripcionGeneral: tg.descripcionGeneral || tg.descripcion || "",
      porcentajeRecargoGeneral: tg.porcentajeRecargoGeneral || tg.porcentajeRecargo || "",
      valorGeneral: tg.valorGeneral || tg.valor || tg.monto || "",
      total: tg.total || tg.totalGeneral || "",
      prestadorServicioGeneral: tg.prestadorServicioGeneral || tg.prestadorServicio || ""
    }));

    const trabajosTerceros = trabajosTercerosRaw.map(tt => ({
      descripcionTercero: tt.descripcionTercero || tt.descripcion || "",
      porcentajeRecargoTercero: tt.porcentajeRecargoTercero || tt.porcentajeRecargo || "",
      valorTercero: tt.valorTercero || tt.valor || tt.monto || "",
      total: tt.total || tt.totalTercero || "",
      prestadorServicioTercero: tt.prestadorServicioTercero || tt.prestadorServicio || ""
    }));

    setFormData({
      id: orden.id,
      numeroOrden: orden.numeroOrden,
      habilitado: orden.habilitado,
      rutCliente: orden.rutCliente,
      patenteVehiculo: orden.patenteVehiculo,
      kilometrajeVehiculoActual: orden.kilometrajeVehiculoActual || "",
      codigo: orden.codigo,
      valorOt: orden.valorOt,
      estado: orden.estado,
      observaciones: orden.observaciones || "",
      nivelCombustible: orden.nivelCombustible || 0,
      idEmpresa: orden.empresa?.id || "",
      detalleRepuesto: detalles,
      trabajosGenerales,
      trabajosTerceros

    });

    if (detalles.length > 0) {
      setDetalleIndex(0);
      setDetalleTemp(detalles[0]);
    }
    if (detalles.length === 0) {
      setDetalleIndex(0);
      setDetalleTemp({ descripcion: "", porcentajeRecargo: "", valor: "", cantidad: "", repuesto_id: "", total: "" });
    }
    if (trabajosGenerales.length > 0) {
      setTrabajoGeneralIndex(0);
      setTrabajoGeneralTemp(trabajosGenerales[0]);
    }
    if (trabajosGenerales.length === 0) {
      setTrabajoGeneralIndex(0);
      setTrabajoGeneralTemp({ descripcionGeneral: "", porcentajeRecargoGeneral: "", valorGeneral: "", prestadorServicioGeneral: "", total: "" });
    }
    if (trabajosTerceros.length > 0) {
      setTrabajoTerceroIndex(0);
      setTrabajoTerceroTemp(trabajosTerceros[0]);
    }
    if (trabajosTerceros.length === 0) {
      setTrabajoTerceroIndex(0);
      setTrabajoTerceroTemp({ descripcionTercero: "", porcentajeRecargoTercero: "", valorTercero: "", prestadorServicioTercero: "", total: "" });
    }

    setEditMode(true);
  };

  const editarOrden = async (ot) => {
    let ordenCompleta = ot;
    const tieneDetalle =
      (ot.detalleRepuestos && ot.detalleRepuestos.length > 0) ||
      (ot.detalleRepuestosDtos && ot.detalleRepuestosDtos.length > 0) ||
      (ot.detalleRepuesto && ot.detalleRepuesto.length > 0) ||
      (ot.detalle && ot.detalle.length > 0) ||
      (ot.detalles && ot.detalles.length > 0);

    if (!tieneDetalle && ot.id) {
      const endpoints = [
        `/ordenTrabajo/${ot.id}`,
        `/ordenTrabajo/id/${ot.id}`,
        `/ordenTrabajo/find/${ot.id}`
      ];

      for (const endpoint of endpoints) {
        try {
          const res = await api.get(endpoint);
          const data = Array.isArray(res.data) ? res.data[0] : res.data;
          if (data && data.id) {
            ordenCompleta = data;
            break;
          }
        } catch (error) {
          // intentar siguiente endpoint
        }
      }
    }

    normalizarOrdenParaEdicion(ordenCompleta);
  };

  const eliminarOrden = (ot) => {
    api.delete("/ordenTrabajo/delete", { data: { id: ot.id } })
      .then(() => cargarOrdenes())
      .catch(err => console.error(err));
  };

  const resetForm = () => {
    setFormData({
      id: "",
      numeroOrden: "",
      habilitado: true,
      rutCliente: "",
      patenteVehiculo: "",
      kilometrajeVehiculoActual: "",
      codigo: "",
      valorOt: "",
      estado: "ABIERTA",
      observaciones: "",
      nivelCombustible: 0,
      idEmpresa: "",
      detalleRepuesto: [],
      trabajosGenerales: [],
      trabajosTerceros: []

    });
    setDetalleIndex(0);
    setTrabajoGeneralIndex(0);
    setTrabajoTerceroIndex(0);
    setDetalleTemp({ descripcion: "", porcentajeRecargo: "", valor: "", cantidad: "", repuesto_id: "", total: "" });
    setTrabajoGeneralTemp({ descripcionGeneral: "", porcentajeRecargoGeneral: "", valorGeneral: "", totalGeneral: "", prestadorServicioGeneral: "" });
    setTrabajoTerceroTemp({ descripcionTercero: "", porcentajeRecargoTercero: "", valorTercero: "", totalTercero: "", prestadorServicioTercero: "" });
    setEditMode(false);
  };

  const actualizarDetalleTemp = (field, value) => {
    const next = { ...detalleTemp, [field]: value };
    setDetalleTemp(next);
    if (editMode && formData.detalleRepuesto[detalleIndex]) {
      setFormData(current => {
        const detalleActualizado = [...current.detalleRepuesto];
        detalleActualizado[detalleIndex] = { ...detalleActualizado[detalleIndex], ...next };
        return { ...current, detalleRepuesto: detalleActualizado };
      });
    }
  };

  const actualizarTrabajoGeneralTemp = (field, value) => {
    const next = { ...trabajoGeneralTemp, [field]: value };
    setTrabajoGeneralTemp(next);
    if (editMode && formData.trabajosGenerales[trabajoGeneralIndex]) {
      setFormData(current => {
        const trabajos = [...current.trabajosGenerales];
        trabajos[trabajoGeneralIndex] = { ...trabajos[trabajoGeneralIndex], ...next };
        return { ...current, trabajosGenerales: trabajos };
      });
    }
  };

  const actualizarTrabajoTerceroTemp = (field, value) => {
    const next = { ...trabajoTerceroTemp, [field]: value };
    setTrabajoTerceroTemp(next);
    if (editMode && formData.trabajosTerceros[trabajoTerceroIndex]) {
      setFormData(current => {
        const trabajos = [...current.trabajosTerceros];
        trabajos[trabajoTerceroIndex] = { ...trabajos[trabajoTerceroIndex], ...next };
        return { ...current, trabajosTerceros: trabajos };
      });
    }
  };

  const irDetalleAnterior = () => {
    if (detalleIndex > 0) {
      const nextIndex = detalleIndex - 1;
      setDetalleIndex(nextIndex);
      setDetalleTemp(formData.detalleRepuesto[nextIndex]);
    }
  };

  const irDetalleSiguiente = () => {
    if (detalleIndex < formData.detalleRepuesto.length - 1) {
      const nextIndex = detalleIndex + 1;
      setDetalleIndex(nextIndex);
      setDetalleTemp(formData.detalleRepuesto[nextIndex]);
    }
  };

  const irTrabajoGeneralAnterior = () => {
    if (trabajoGeneralIndex > 0) {
      const nextIndex = trabajoGeneralIndex - 1;
      setTrabajoGeneralIndex(nextIndex);
      setTrabajoGeneralTemp(formData.trabajosGenerales[nextIndex]);
    }
  };

  const irTrabajoGeneralSiguiente = () => {
    if (trabajoGeneralIndex < formData.trabajosGenerales.length - 1) {
      const nextIndex = trabajoGeneralIndex + 1;
      setTrabajoGeneralIndex(nextIndex);
      setTrabajoGeneralTemp(formData.trabajosGenerales[nextIndex]);
    }
  };

  const irTrabajoTerceroAnterior = () => {
    if (trabajoTerceroIndex > 0) {
      const nextIndex = trabajoTerceroIndex - 1;
      setTrabajoTerceroIndex(nextIndex);
      setTrabajoTerceroTemp(formData.trabajosTerceros[nextIndex]);
    }
  };

  const irTrabajoTerceroSiguiente = () => {
    if (trabajoTerceroIndex < formData.trabajosTerceros.length - 1) {
      const nextIndex = trabajoTerceroIndex + 1;
      setTrabajoTerceroIndex(nextIndex);
      setTrabajoTerceroTemp(formData.trabajosTerceros[nextIndex]);
    }
  };

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const ordenesFiltradas = ordenes
    .filter((o) => {
      const texto = `${o.numeroOrden} ${o.rutCliente} ${o.patenteVehiculo} ${o.kilometrajeVehiculoActual || ""} ${o.valorOt} ${o.estado}`.toLowerCase();
      return texto.includes(search.toLowerCase());
    })
    .sort((a, b) => {
      // ABIERTA primero, CERRADO al final
      if (a.estado === "CERRADO" && b.estado !== "CERRADO") return 1;
      if (a.estado !== "CERRADO" && b.estado === "CERRADO") return -1;
      return 0;
    });

  const agregarDetalle = () => {
    const base = Number(detalleTemp.cantidad) * Number(detalleTemp.valor);
    const recargo = (Number(detalleTemp.porcentajeRecargo) * base) / 100;
    const totalDetalle = base + recargo;

    const nuevoDetalle = {
      ...detalleTemp,
      total: totalDetalle
    };

    const nuevosDetalles = [...formData.detalleRepuesto, nuevoDetalle];

    setFormData({
      ...formData,
      detalleRepuesto: [...formData.detalleRepuesto, nuevoDetalle],
      valorOt: Number(formData.valorOt) + totalDetalle
    });


    // reset detalle temporal
    setDetalleTemp({
      descripcion: "",
      porcentajeRecargo: "",
      valor: "",
      cantidad: "",
      repuesto_id: "",
      total: ""
    });
  };

  const agregarTrabajoGeneral = () => {
    // 1. Calcular base y recargo
    const base = Number(trabajoGeneralTemp.valorGeneral);
    const recargo = (Number(trabajoGeneralTemp.porcentajeRecargoGeneral) * base) / 100;
    const total = base + recargo;

    // 2. Crear objeto nuevo con propiedad "total"
    const nuevoTrabajo = { ...trabajoGeneralTemp, total };

    // 3. Actualizar el estado de formData
    setFormData({
      ...formData,
      trabajosGenerales: [...formData.trabajosGenerales, nuevoTrabajo]
    });

    // 4. Resetear el formulario temporal
    setTrabajoGeneralTemp({
      descripcionGeneral: "",
      porcentajeRecargoGeneral: "",
      valorGeneral: "",
      prestadorServicioGeneral: ""
    });
  };

  const agregarTrabajoTercero = () => {
    // 1. Calcular base y recargo
    const base = Number(trabajoTerceroTemp.valorTercero);
    const recargo = (Number(trabajoTerceroTemp.porcentajeRecargoTercero) * base) / 100;
    const total = base + recargo;

    // 2. Crear objeto nuevo con propiedad "total"
    const nuevoTrabajo = { ...trabajoTerceroTemp, total };

    // 3. Actualizar el estado de formData
    setFormData({
      ...formData,
      trabajosTerceros: [...formData.trabajosTerceros, nuevoTrabajo]
    });

    // 4. Resetear el formulario temporal
    setTrabajoTerceroTemp({
      descripcionTercero: "",
      porcentajeRecargoTercero: "",
      valorTercero: "",
      prestadorServicioTercero: ""
    });
  };

  const handleRepuestoSelect = (id) => {
    if (id === "") {
      setDetalleTemp({ ...detalleTemp, repuesto_id: "", descripcion: "", valor: "" });
      return;
    }
    const rep = repuestos.find(r => r.id === id);
    if (rep) {
      setDetalleTemp({
        ...detalleTemp,
        repuesto_id: rep.id,
        descripcion: rep.nombre,
        valor: rep.valor
      });
    }
  };

  return (
    <Box sx={{ mt: 2, px: { xs: 1, sm: 2 }, maxWidth: 1400, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>Gestión de Órdenes de Trabajo</Typography>

      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 2, borderRadius: 2 }}>
        <Grid container spacing={2}>
          {/* Número Orden: oculto pero presente en el formulario (generado automáticamente) */}
          <Grid item xs={12} sm={6} md={4} sx={{ display: 'none' }}>
            <TextField
              fullWidth
              label="Número Orden"
              value={formData.numeroOrden || ""}
              onChange={e => setFormData({ ...formData, numeroOrden: e.target.value })}
              disabled
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Código"
              value={formData.codigo || ""}
              disabled
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth sx={selectFieldSx}>
              <InputLabel shrink>Cliente</InputLabel>
              <Select value={formData.rutCliente}
                label="Cliente"
                displayEmpty
                onChange={e => setFormData({ ...formData, rutCliente: e.target.value, patenteVehiculo: "" })} >
                <MenuItem value="" disabled>Selecciona un cliente</MenuItem>
                {clientes.map(c => (
                  <MenuItem key={c.id} value={c.rut}>
                    {c.nombre} {c.apellido} - {c.rut}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth sx={selectFieldSx}>
              <InputLabel shrink>Vehículo</InputLabel>
              <Select
                value={formData.patenteVehiculo}
                label="Vehículo"
                displayEmpty
                onChange={e => setFormData({ ...formData, patenteVehiculo: e.target.value })}
              >
                <MenuItem value="" disabled>Selecciona un vehículo</MenuItem>
                {vehiculos
                  .filter(v => v.rutDueno === formData.rutCliente)
                  .map(v => (
                    <MenuItem key={v.id} value={v.patente}>
                      {v.marca} {v.modelo} - {v.patente}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Fila 2 */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField label="Valor OT" value={formData.valorOt !== "" ? fmt(formData.valorOt) : ""}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth sx={selectFieldSx}>
              <InputLabel shrink>Estado</InputLabel>
              <Select
                value={formData.estado}
                label="Estado"
                onChange={e => setFormData({ ...formData, estado: e.target.value })}
              >
                <MenuItem value="ABIERTA">ABIERTA</MenuItem>
                <MenuItem value="CERRADO">CERRADO</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Fila 3 - Se mantiene kilometraje para no perder ese dato vital */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Kilometraje actual"
              type="number"
              value={formData.kilometrajeVehiculoActual}
              onChange={e => setFormData({ ...formData, kilometrajeVehiculoActual: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ px: 2, pt: 0.5 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Nivel de Combustible: {formData.nivelCombustible || 0}%
              </Typography>
              <Slider
                value={formData.nivelCombustible || 0}
                onChange={(e, val) => setFormData({ ...formData, nivelCombustible: val })}
                step={25}
                marks={[
                  { value: 0, label: 'E' },
                  { value: 25, label: '1/4' },
                  { value: 50, label: '1/2' },
                  { value: 75, label: '3/4' },
                  { value: 100, label: 'F' },
                ]}
                min={0}
                max={100}
                valueLabelDisplay="auto"
                color={
                  formData.nivelCombustible <= 25 ? "error" :
                    formData.nivelCombustible <= 50 ? "warning" : "success"
                }
              />
            </Box>
          </Grid>
        </Grid>

        {/* Observaciones (Mismo diseño de ancho completo que Descripción) */}
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            multiline
            minRows={6}
            maxRows={12}
            inputProps={{ maxLength: 4000 }}
            label="Observaciones"
            value={formData.observaciones || ""}
            onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
            helperText={`${(formData.observaciones || '').length}/4000 caracteres`}
          />
        </Box>

        <Typography variant="h6" sx={{ mt: 2 }}>Detalles</Typography>
        {editMode && formData.detalleRepuesto.length > 0 && (
          <Box sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
            <Button size="small" variant="outlined" onClick={irDetalleAnterior} disabled={detalleIndex === 0}>Anterior</Button>
            <Button size="small" variant="outlined" onClick={irDetalleSiguiente} disabled={detalleIndex >= formData.detalleRepuesto.length - 1}>Siguiente</Button>
            <Typography variant="body2">{detalleIndex + 1} / {formData.detalleRepuesto.length}</Typography>
          </Box>
        )}
        <Box sx={{ mb: 2 }}>
          <TextField fullWidth multiline rows={2} label="Descripción" value={detalleTemp.descripcion}
            onChange={e => actualizarDetalleTemp("descripcion", e.target.value)} />
        </Box>
        <Grid container spacing={2} sx={{ mb: 1 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Recargo (%)" type="number" value={detalleTemp.porcentajeRecargo}
              onChange={e => actualizarDetalleTemp("porcentajeRecargo", e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Valor" type="number" value={detalleTemp.valor}
              onChange={e => actualizarDetalleTemp("valor", e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Cantidad" type="number" value={detalleTemp.cantidad}
              onChange={e => actualizarDetalleTemp("cantidad", e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Total" value={fmt(detalleTemp.total || 0)} slotProps={{ input: { readOnly: true } }} />
          </Grid>
        </Grid>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={9}>
            <FormControl fullWidth sx={selectFieldSx}>
              <InputLabel shrink>Repuesto</InputLabel>
              <Select
                value={detalleTemp.repuesto_id}
                label="Repuesto"
                displayEmpty
                onChange={e => handleRepuestoSelect(e.target.value)}
              >
                <MenuItem value="">Sin repuesto</MenuItem>
                {repuestos.map(r => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.nombre} - {r.codigo}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button fullWidth variant="outlined" sx={{ height: '100%', minHeight: 56 }} onClick={agregarDetalle}>Agregar</Button>
          </Grid>
        </Grid>

        {/* --- Sección Trabajos Generales --- */}
        <Typography variant="h6" sx={{ mt: 2 }}>Trabajos Generales</Typography>
        {editMode && formData.trabajosGenerales.length > 0 && (
          <Box sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
            <Button size="small" variant="outlined" onClick={irTrabajoGeneralAnterior} disabled={trabajoGeneralIndex === 0}>Anterior</Button>
            <Button size="small" variant="outlined" onClick={irTrabajoGeneralSiguiente} disabled={trabajoGeneralIndex >= formData.trabajosGenerales.length - 1}>Siguiente</Button>
            <Typography variant="body2">{trabajoGeneralIndex + 1} / {formData.trabajosGenerales.length}</Typography>
          </Box>
        )}
        <Box sx={{ mb: 2 }}>
          <TextField fullWidth multiline rows={2} label="Descripción" value={trabajoGeneralTemp.descripcionGeneral}
            onChange={e => actualizarTrabajoGeneralTemp("descripcionGeneral", e.target.value)} />
        </Box>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Recargo (%)" type="number" value={trabajoGeneralTemp.porcentajeRecargoGeneral}
              onChange={e => actualizarTrabajoGeneralTemp("porcentajeRecargoGeneral", e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Valor" type="number" value={trabajoGeneralTemp.valorGeneral}
              onChange={e => actualizarTrabajoGeneralTemp("valorGeneral", e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={8} md={4}>
            <TextField fullWidth label="Prestador Servicio" value={trabajoGeneralTemp.prestadorServicioGeneral}
              onChange={e => actualizarTrabajoGeneralTemp("prestadorServicioGeneral", e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <Button fullWidth variant="outlined" sx={{ height: '100%', minHeight: 56 }} onClick={agregarTrabajoGeneral}>Agregar</Button>
          </Grid>
        </Grid>

        {/* --- Sección Trabajos Terceros --- */}
        <Typography variant="h6" sx={{ mt: 2 }}>Trabajos Terceros</Typography>
        {editMode && formData.trabajosTerceros.length > 0 && (
          <Box sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
            <Button size="small" variant="outlined" onClick={irTrabajoTerceroAnterior} disabled={trabajoTerceroIndex === 0}>Anterior</Button>
            <Button size="small" variant="outlined" onClick={irTrabajoTerceroSiguiente} disabled={trabajoTerceroIndex >= formData.trabajosTerceros.length - 1}>Siguiente</Button>
            <Typography variant="body2">{trabajoTerceroIndex + 1} / {formData.trabajosTerceros.length}</Typography>
          </Box>
        )}
        <Box sx={{ mb: 2 }}>
          <TextField fullWidth multiline rows={2} label="Descripción" value={trabajoTerceroTemp.descripcionTercero}
            onChange={e => actualizarTrabajoTerceroTemp("descripcionTercero", e.target.value)} />
        </Box>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Recargo (%)" type="number" value={trabajoTerceroTemp.porcentajeRecargoTercero}
              onChange={e => actualizarTrabajoTerceroTemp("porcentajeRecargoTercero", e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Valor" type="number" value={trabajoTerceroTemp.valorTercero}
              onChange={e => actualizarTrabajoTerceroTemp("valorTercero", e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={8} md={4}>
            <TextField fullWidth label="Prestador Servicio" value={trabajoTerceroTemp.prestadorServicioTercero}
              onChange={e => actualizarTrabajoTerceroTemp("prestadorServicioTercero", e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <Button fullWidth variant="outlined" sx={{ height: '100%', minHeight: 56 }} onClick={agregarTrabajoTercero}>Agregar</Button>
          </Grid>
        </Grid>


        {formData.detalleRepuesto && formData.detalleRepuesto.length > 0 && (
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Resumen Repuestos y Detalles</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell>Descripción</TableCell>
                    <TableCell>ID Repuesto</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">Valor Unit.</TableCell>
                    <TableCell align="right">Recargo (%)</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.detalleRepuesto.map((d, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{d.descripcion}</TableCell>
                      <TableCell>{d.repuesto_id || "-"}</TableCell>
                      <TableCell align="right">{d.cantidad}</TableCell>
                      <TableCell align="right">${fmt(d.valor)}</TableCell>
                      <TableCell align="right">{d.porcentajeRecargo}%</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>${fmt(d.total)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell colSpan={5} align="right" sx={{ fontWeight: 'bold' }}>Total Repuestos:</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      ${fmt(formData.detalleRepuesto.reduce((acc, curr) => acc + Number(curr.total || 0), 0))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {formData.trabajosGenerales && formData.trabajosGenerales.length > 0 && (
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Resumen Trabajos Generales</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Prestador</TableCell>
                    <TableCell align="right">Valor Base</TableCell>
                    <TableCell align="right">Recargo (%)</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.trabajosGenerales.map((tg, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{tg.descripcionGeneral}</TableCell>
                      <TableCell>{tg.prestadorServicioGeneral || "-"}</TableCell>
                      <TableCell align="right">${fmt(tg.valorGeneral)}</TableCell>
                      <TableCell align="right">{tg.porcentajeRecargoGeneral}%</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>${fmt(tg.total)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>Total Trabajos Generales:</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      ${fmt(formData.trabajosGenerales.reduce((acc, curr) => acc + Number(curr.total || 0), 0))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {formData.trabajosTerceros && formData.trabajosTerceros.length > 0 && (
          <Box sx={{ mt: 3, mb: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Resumen Trabajos Terceros</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Prestador</TableCell>
                    <TableCell align="right">Valor Base</TableCell>
                    <TableCell align="right">Recargo (%)</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.trabajosTerceros.map((tt, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{tt.descripcionTercero}</TableCell>
                      <TableCell>{tt.prestadorServicioTercero || "-"}</TableCell>
                      <TableCell align="right">${fmt(tt.valorTercero)}</TableCell>
                      <TableCell align="right">{tt.porcentajeRecargoTercero}%</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>${fmt(tt.total)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>Total Trabajos Terceros:</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      ${fmt(formData.trabajosTerceros.reduce((acc, curr) => acc + Number(curr.total || 0), 0))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}



        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button variant="contained" color="primary" onClick={guardarOrden}>
            {editMode ? "Actualizar Orden" : "Crear Orden"}
          </Button>
          {editMode && (
            <Button variant="outlined" color="secondary" onClick={resetForm}>
              Cancelar
            </Button>
          )}
        </Box>
      </Paper>

      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
        <Typography variant="h6">Lista de Órdenes de Trabajo</Typography>
        <TextField
          fullWidth
          label="Buscar orden"
          placeholder="Número, cliente, patente, kilometraje, valor o estado"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ mt: 2 }}
        />
        <TableContainer component={Paper} sx={{ mt: 2, borderRadius: 2, overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Número Orden</TableCell>
                <TableCell>Cliente (RUT)</TableCell>
                <TableCell>Vehículo</TableCell>
                <TableCell>Kilometraje</TableCell>
                <TableCell>Valor OT</TableCell>
                <TableCell>Fecha Creación</TableCell>
                <TableCell>Fecha Término</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ordenesFiltradas
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((o) => (
                  <TableRow
                    key={o.id}
                    sx={{
                      backgroundColor: o.estado === "CERRADO" ? "#ffebee" : "#e8f5e9"
                    }}
                  >
                    <TableCell>{o.numeroOrden}</TableCell>
                    <TableCell>{o.rutCliente}</TableCell>
                    <TableCell>{o.patenteVehiculo}</TableCell>
                    <TableCell>{o.kilometrajeVehiculoActual ? fmt(o.kilometrajeVehiculoActual) : "-"}</TableCell>
                    <TableCell>${fmt(o.valorOt)}</TableCell>
                    <TableCell>
                      {o.fechaIngreso ? new Date(o.fechaIngreso).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : "-"}
                    </TableCell>
                    <TableCell>
                      {o.fechaCerrado ? new Date(o.fechaCerrado).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : "-"}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        color: o.estado === "CERRADO" ? "error.main" : "success.main"
                      }}
                    >
                      {o.estado}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => editarOrden(o)}
                        sx={{ mr: 1 }}
                        variant="outlined"
                        disabled={o.estado === "CERRADO"}
                        title={o.estado === "CERRADO" ? "No se puede editar una orden cerrada" : ""}
                      >Editar</Button>
                      <Button size="small" color="error" onClick={() => eliminarOrden(o)} variant="contained">Eliminar</Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={ordenesFiltradas.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Órdenes por página"
        />
      </Paper>
    </Box>
  );
}

export default OrdenTrabajoCRUD;