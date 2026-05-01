import React, { useEffect, useState } from "react";
import api from "../services/api";
import {
  Paper, Typography, Box, TextField, Button, Select, MenuItem, InputLabel, FormControl,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText
} from "@mui/material";
import { validarRut, formatearRut } from "../utils/validar";
import { useNotificacion } from "../utils/useNotificacion";

function AgendaCRUD() {
  const { mostrarExito, mostrarError, notificacion } = useNotificacion();
  const [agendas, setAgendas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [rutError, setRutError] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [openClienteModal, setOpenClienteModal] = useState(false);
  const [openVehiculoModal, setOpenVehiculoModal] = useState(false);
  const [clienteData, setClienteData] = useState({ nombre: "", apellido: "", rut: "", telefono: "", direccion: "", ciudad: "", comuna: "" });
  const [vehiculoData, setVehiculoData] = useState({ marca: "", modelo: "", patente: "", anio: "", rutDueno: "" });
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);

  const [formData, setFormData] = useState({
    id: "",
    observacion: "",
    fechaHoraReserva: "",
    estado: "PENDIENTE",
    habilitado: true,
    rutCliente: "",
    vehiculoId: ""
  });
  const [editMode, setEditMode] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    cargarAgendas();
    cargarClientes();
  }, []);

  useEffect(() => {
    if (formData.rutCliente) {
      api.get(`/vehiculos/cliente/${formData.rutCliente}`)
        .then(res => setVehiculos(res.data))
        .catch(err => console.error(err));
    } else {
      setVehiculos([]);
    }
  }, [formData.rutCliente]);

  const cargarAgendas = () => {
    api.get("/agenda/all")
      .then(res => setAgendas(res.data))
      .catch(err => console.error(err));
  };

  const cargarClientes = () => {
    api.get("/clientes/all")
      .then(res => setClientes(res.data))
      .catch(err => console.error(err));
  };

  const fmt = (n) => {
    const num = Number(n);
    if (isNaN(num) || n === "" || n === null || n === undefined) return "-";
    return num.toLocaleString("es-CL");
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const guardarAgenda = () => {
    const dataToSend = {
      observacion: formData.observacion,
      fechaHoraReserva: formData.fechaHoraReserva || null,
      estado: formData.estado,
      habilitado: formData.habilitado,
      rutCliente: formData.rutCliente,
      vehiculoId: formData.vehiculoId ? parseInt(formData.vehiculoId) : null
    };

    if (editMode) {
      dataToSend.id = formData.id;
    }

    if (editMode) {
      api.put("/agenda/update", dataToSend)
        .then(() => { cargarAgendas(); resetForm(); mostrarExito("Reserva actualizada exitosamente"); })
        .catch(err => { console.error(err); mostrarError("Error al actualizar reserva"); });
    } else {
      api.post("/agenda/insert", dataToSend)
        .then(() => { cargarAgendas(); resetForm(); mostrarExito("Reserva creada exitosamente"); })
        .catch(err => { console.error(err); mostrarError("Error al crear reserva"); });
    }
  };

  const resetForm = () => {
    setFormData({
      id: "",
      observacion: "",
      fechaHoraReserva: "",
      estado: "PENDIENTE",
      habilitado: true,
      rutCliente: "",
      vehiculoId: ""
    });
    setEditMode(false);
  };

  const editarAgenda = (agenda) => {
    setFormData({
      id: agenda.id,
      observacion: agenda.observacion || "",
      fechaHoraReserva: agenda.fechaHoraReserva ? agenda.fechaHoraReserva.slice(0, 16) : "",
      estado: agenda.estado || "PENDIENTE",
      habilitado: agenda.habilitado,
      rutCliente: agenda.cliente?.rut || "",
      vehiculoId: agenda.vehiculo?.id || ""
    });
    if (agenda.cliente) {
      api.get(`/vehiculos/cliente/${agenda.cliente.rut}`)
        .then(res => setVehiculos(res.data))
        .catch(err => console.error(err));
    }
    setEditMode(true);
  };

  const eliminarAgenda = (agenda) => {
    api.delete("/agenda/delete", { data: { id: agenda.id } })
      .then(() => { cargarAgendas(); mostrarExito("Reserva eliminada exitosamente"); })
      .catch(err => { console.error(err); mostrarError("Error al eliminar reserva"); });
  };

  const cambiarEstado = async (agenda, nuevoEstado) => {
    if (nuevoEstado === "COMPLETADA") {
      const clienteRut = agenda.cliente?.rut;
      const vehiculo = agenda.vehiculo;

      if (!clienteRut) {
        setReservaSeleccionada(agenda);
        setOpenClienteModal(true);
        return;
      }

      api.get(`/vehiculos/cliente/${clienteRut}`)
        .then(res => {
          if (res.data.length === 0) {
            setReservaSeleccionada(agenda);
            setVehiculos([]);
            setVehiculoData({ marca: "", modelo: "", patente: "", anio: "", rutDueno: clienteRut });
            setOpenVehiculoModal(true);
            return;
          }
          const vehiculoData = res.data[0];
          crearOrdenTrabajo(agenda, clienteRut, vehiculoData.patente);
        })
        .catch(() => {
          setReservaSeleccionada(agenda);
          setVehiculos([]);
          setVehiculoData({ marca: "", modelo: "", patente: "", anio: "", rutDueno: clienteRut });
          setOpenVehiculoModal(true);
        });
      return;
    }

    api.put("/agenda/update", { ...agenda, estado: nuevoEstado })
      .then(() => { cargarAgendas(); mostrarExito("Estado actualizado exitosamente"); })
      .catch(err => { console.error(err); mostrarError("Error al actualizar estado"); });
  };

  const crearCliente = () => {
    const resultado = validarRut(clienteData.rut);
    if (!resultado.valido) {
      setRutError(resultado.mensaje);
      return;
    }
    setRutError("");
    const clienteConHabilitado = { ...clienteData, habilitado: true };
    api.post("/clientes/insert", clienteConHabilitado)
      .then(() => {
        cargarClientes();
        setOpenClienteModal(false);
        mostrarExito("Cliente creado exitosamente");
        if (reservaSeleccionada) {
          setVehiculoData({ marca: "", modelo: "", patente: "", anio: "", rutDueno: clienteData.rut });
          setOpenVehiculoModal(true);
        }
      })
      .catch(err => { console.error(err); mostrarError("Error al crear cliente"); });
  };

  const crearOrdenTrabajo = async (agenda, rut, patenteVehiculo) => {
    const ahora = new Date();
    const fechaHoraActual = ahora.toISOString();
    const ordenData = {
      rutCliente: rut,
      patenteVehiculo: patenteVehiculo || "",
      observaciones: agenda.observacion || "",
      estado: "ABIERTA",
      habilitado: true,
      nivelCombustible: 0,
      kilometrajeVehiculoActual: "",
      fechaIngreso: fechaHoraActual,
      detalleRepuesto: [],
      repuestosOrden: [],
      trabajosTerceros: []
    };

    try {
      await api.post("/ordenTrabajo/insert", ordenData);
      await api.put("/agenda/update", {
        ...agenda,
        estado: "COMPLETADA"
      });
      cargarAgendas();
      mostrarExito("Orden de trabajo creada exitosamente");
    } catch (err) {
      console.error(err);
      mostrarError("Error al crear orden de trabajo");
    }
  };

  const manejarCrearVehiculo = () => {
    const vehiculoConHabilitado = { ...vehiculoData, habilitado: true };
    api.post("/vehiculos/insert", vehiculoConHabilitado)
      .then(res => {
        const nuevoVehiculoId = res.data.id;
        const nuevoVehiculoPatente = res.data.patente;
        setOpenVehiculoModal(false);
        mostrarExito("Vehículo creado exitosamente");
        if (reservaSeleccionada) {
          api.put("/agenda/update", {
            ...reservaSeleccionada,
            rutCliente: vehiculoData.rutDueno,
            vehiculoId: nuevoVehiculoId
          }).then(() => {
            crearOrdenTrabajo(reservaSeleccionada, vehiculoData.rutDueno, nuevoVehiculoPatente);
          });
        }
      })
      .catch(err => { console.error(err); mostrarError("Error al crear vehículo"); });
  };

  const handleClienteChange = (field, value) => {
    setClienteData(prev => ({ ...prev, [field]: value }));
  };

  const handleVehiculoChange = (field, value) => {
    setVehiculoData(prev => ({ ...prev, [field]: value }));
  };

  const agendasFiltradas = agendas
    .filter(a => {
      const texto = `${a.observacion || ""} ${a.estado || ""} ${a.cliente?.nombre || ""} ${a.cliente?.apellido || ""}`.toLowerCase();
      const matchesSearch = texto.includes(search.toLowerCase());
      const matchesEstado = filtroEstado ? a.estado === filtroEstado : true;
      const matchesFecha = filtroFecha
        ? a.fechaHoraReserva && a.fechaHoraReserva.startsWith(filtroFecha)
        : true;
      return matchesSearch && matchesEstado && matchesFecha;
    })
    .sort((a, b) => {
      if (a.estado === "PENDIENTE" && b.estado !== "PENDIENTE") return -1;
      if (a.estado !== "PENDIENTE" && b.estado === "PENDIENTE") return 1;
      return 0;
    });

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "PENDIENTE": return "#ff9800";
      case "CONFIRMADA": return "#2196f3";
      case "COMPLETADA": return "#4caf50";
      case "CANCELADA": return "#f44336";
      default: return "#9e9e9e";
    }
  };

  return (
    <Box sx={{ mt: 2, px: { xs: 1, sm: 2 }, maxWidth: 1400, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>Agenda de Reservas</Typography>

      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 2, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>{editMode ? "Editar Reserva" : "Nueva Reserva"}</Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel shrink>Cliente</InputLabel>
              <Select
                value={formData.rutCliente}
                label="Cliente"
                displayEmpty
                onChange={e => {
                  const rut = e.target.value;
                  const cliente = clientes.find(c => c.rut === rut);
                  setFormData(prev => ({ ...prev, rutCliente: rut, vehiculoId: "" }));
                  if (cliente) {
                    api.get(`/vehiculos/cliente/${rut}`)
                      .then(res => setVehiculos(res.data))
                      .catch(err => console.error(err));
                  } else {
                    setVehiculos([]);
                  }
                }}
              >
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
            <FormControl fullWidth>
              <InputLabel shrink>Vehículo</InputLabel>
              <Select
                value={formData.vehiculoId}
                label="Vehículo"
                displayEmpty
                onChange={e => handleChange("vehiculoId", e.target.value)}
                disabled={!formData.rutCliente}
              >
                <MenuItem value="" disabled>Selecciona un vehículo</MenuItem>
                {vehiculos.map(v => (
                  <MenuItem key={v.id} value={v.id}>
                    {v.marca} {v.modelo} - {v.patente}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel shrink>Estado</InputLabel>
              <Select
                value={formData.estado}
                label="Estado"
                onChange={e => handleChange("estado", e.target.value)}
              >
                <MenuItem value="PENDIENTE">PENDIENTE</MenuItem>
                <MenuItem value="CONFIRMADA">CONFIRMADA</MenuItem>
                <MenuItem value="COMPLETADA">COMPLETADA</MenuItem>
                <MenuItem value="CANCELADA">CANCELADA</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Fecha"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formData.fechaHoraReserva ? formData.fechaHoraReserva.split("T")[0] : ""}
              onChange={e => {
                const fecha = e.target.value;
                const hora = formData.fechaHoraReserva ? formData.fechaHoraReserva.split("T")[1]?.slice(0, 5) : "08:00";
                handleChange("fechaHoraReserva", fecha ? `${fecha}T${hora}:00` : "");
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel shrink>Hora</InputLabel>
              <Select
                value={formData.fechaHoraReserva ? formData.fechaHoraReserva.split("T")[1]?.slice(0, 5) : ""}
                label="Hora"
                onChange={e => {
                  const hora = e.target.value;
                  const fecha = formData.fechaHoraReserva ? formData.fechaHoraReserva.split("T")[0] : "";
                  handleChange("fechaHoraReserva", fecha ? `${fecha}T${hora}:00` : "");
                }}
                MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
                sx={{ minHeight: 56 }}
              >
                {["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"].map(h => (
                  <MenuItem key={h} value={h} sx={{ fontSize: "1.1rem", py: 1.5 }}>{h}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Observación"
              value={formData.observacion}
              onChange={e => handleChange("observacion", e.target.value)}
              multiline
              rows={2}
            />
          </Grid>
        </Grid>

        <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
          <Button variant="contained" color="primary" onClick={guardarAgenda}>
            {editMode ? "Actualizar Reserva" : "Crear Reserva"}
          </Button>
          {editMode && (
            <Button variant="outlined" color="secondary" onClick={resetForm}>
              Cancelar
            </Button>
          )}
        </Box>
      </Paper>

      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
        <Typography variant="h6">Reservas</Typography>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Buscar"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por cliente u observación"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel shrink>Estado</InputLabel>
              <Select
                value={filtroEstado}
                label="Estado"
                onChange={e => setFiltroEstado(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="PENDIENTE">PENDIENTE</MenuItem>
                <MenuItem value="CONFIRMADA">CONFIRMADA</MenuItem>
                <MenuItem value="COMPLETADA">COMPLETADA</MenuItem>
                <MenuItem value="CANCELADA">CANCELADA</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Filtrar por fecha"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filtroFecha}
              onChange={e => setFiltroFecha(e.target.value)}
            />
          </Grid>
        </Grid>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha/Hora</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Vehículo</TableCell>
                <TableCell>Observación</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {agendasFiltradas
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map(a => (
                  <TableRow key={a.id} sx={{ backgroundColor: a.estado === "COMPLETADA" ? "#e8f5e9" : a.estado === "CANCELADA" ? "#ffebee" : "#fff3e0" }}>
                    <TableCell>
                      {a.fechaHoraReserva
                        ? new Date(a.fechaHoraReserva).toLocaleString("es-CL", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {a.cliente ? `${a.cliente.nombre} ${a.cliente.apellido}` : "-"}
                    </TableCell>
                    <TableCell>
                      {a.vehiculo ? `${a.vehiculo.marca} ${a.vehiculo.modelo} - ${a.vehiculo.patente}` : "-"}
                    </TableCell>
                    <TableCell>{a.observacion || "-"}</TableCell>
                    <TableCell>
                      <Typography
                        sx={{
                          color: getEstadoColor(a.estado),
                          fontWeight: "bold",
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          border: `1px solid ${getEstadoColor(a.estado)}`
                        }}
                      >
                        {a.estado}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => editarAgenda(a)} disabled={a.estado === "COMPLETADA" || a.estado === "CANCELADA"} sx={{ mr: 1 }}>
                        Editar
                      </Button>
                      {a.estado === "PENDIENTE" && (
                        <Button size="small" color="success" onClick={() => cambiarEstado(a, "CONFIRMADA")} sx={{ mr: 1 }}>
                          Confirmar
                        </Button>
                      )}
                      {(a.estado === "PENDIENTE" || a.estado === "CONFIRMADA") && (
                        <Button size="small" color="error" onClick={() => cambiarEstado(a, "CANCELADA")} sx={{ mr: 1 }}>
                          Cancelar
                        </Button>
                      )}
                      {a.estado === "CONFIRMADA" && (
                        <Button size="small" color="primary" onClick={() => cambiarEstado(a, "COMPLETADA")}>
                          Generar OT
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openClienteModal} onClose={() => setOpenClienteModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo Cliente</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Nombre" value={clienteData.nombre} onChange={e => handleClienteChange("nombre", e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Apellido" value={clienteData.apellido} onChange={e => handleClienteChange("apellido", e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                label="RUT" 
                value={clienteData.rut} 
                onChange={e => {
                  const valor = e.target.value;
                  handleClienteChange("rut", valor);
                  if (valor.length >= 2) {
                    const resultado = validarRut(valor);
                    setRutError(resultado.valido ? "" : resultado.mensaje);
                  } else {
                    setRutError("");
                  }
                }}
                error={!!rutError}
                helperText={rutError}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Teléfono" value={clienteData.telefono} onChange={e => handleClienteChange("telefono", e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Dirección" value={clienteData.direccion} onChange={e => handleClienteChange("direccion", e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Ciudad" value={clienteData.ciudad} onChange={e => handleClienteChange("ciudad", e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Comuna" value={clienteData.comuna} onChange={e => handleClienteChange("comuna", e.target.value)} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenClienteModal(false)}>Cancelar</Button>
          <Button onClick={crearCliente} variant="contained" color="primary">Guardar Cliente</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openVehiculoModal} onClose={() => setOpenVehiculoModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo Vehículo</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Seleccione el cliente y complete los datos del vehículo.
          </DialogContentText>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel shrink>Cliente</InputLabel>
                <Select
                  value={vehiculoData.rutDueno}
                  label="Cliente"
                  onChange={e => handleVehiculoChange("rutDueno", e.target.value)}
                >
                  {clientes.map(c => (
                    <MenuItem key={c.rut} value={c.rut}>
                      {c.nombre} {c.apellido} - {c.rut}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Marca" value={vehiculoData.marca} onChange={e => handleVehiculoChange("marca", e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Modelo" value={vehiculoData.modelo} onChange={e => handleVehiculoChange("modelo", e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Patente" value={vehiculoData.patente} onChange={e => handleVehiculoChange("patente", e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Año" value={vehiculoData.anio} onChange={e => handleVehiculoChange("anio", e.target.value)} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenVehiculoModal(false)}>Cancelar</Button>
          <Button onClick={manejarCrearVehiculo} variant="contained" color="primary">Guardar Vehículo y Crear OT</Button>
        </DialogActions>
      </Dialog>
      {notificacion}
    </Box>
  );
}

export default AgendaCRUD;