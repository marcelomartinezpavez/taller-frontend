import React, { useEffect, useState } from "react";
import api from "../services/api";
import {
  Paper, Typography, Box, TextField, Button,
  Select, MenuItem, InputLabel, FormControl,
  TableCell, Table, TableBody, TableContainer,
  TableHead, TableRow, TablePagination, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete, InputAdornment
} from "@mui/material";
import { validarRut, formatearRut } from "../utils/validar";
import { useNotificacion } from "../utils/useNotificacion";


function VehiculosCRUD() {
  const selectFieldSx = { "& .MuiOutlinedInput-root": { minHeight: 56 } };
  const [vehiculos, setVehiculos] = useState([]);
  const [clientes, setClientes] = useState([]); // lista de clientes
  const [formData, setFormData] = useState({
    id: "",
    marca: "",
    modelo: "",
    patente: "",
    anio: "",
    numeroMotor: "",
    numeroChasis: "",
    rutDueno: "",
    color: "",
    kilometraje: "",
    habilitado: true
  });
  const [editMode, setEditMode] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [patenteError, setPatenteError] = useState("");
  const [rutModalError, setRutModalError] = useState("");
  const { mostrarExito, mostrarError, notificacion } = useNotificacion();
  const [openModalCliente, setOpenModalCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "", apellido: "", rut: "", direccion: "",
    comuna: "", ciudad: "", telefono: "", email: "", habilitado: true
  });

  const handleOpenModal = () => setOpenModalCliente(true);
  const handleCloseModal = () => {
    setOpenModalCliente(false);
    setRutModalError("");
    setNuevoCliente({ nombre: "", apellido: "", rut: "", direccion: "", comuna: "", ciudad: "", telefono: "", email: "", habilitado: true });
  };

  const guardarNuevoCliente = () => {
    const resultadoRut = validarRut(nuevoCliente.rut);
    if (!resultadoRut.valido) {
      setRutModalError(resultadoRut.mensaje);
      return;
    }
    setRutModalError("");
    api.post("/clientes/insert", nuevoCliente)
      .then(() => {
        cargarClientes();
        setFormData(prev => ({ ...prev, rutDueno: nuevoCliente.rut }));
        handleCloseModal();
        mostrarExito("Cliente creado exitosamente");
      })
      .catch(err => { console.error("Error al crear cliente:", err); mostrarError("Error al crear cliente"); });
  };

  useEffect(() => {
    cargarVehiculos();
    cargarClientes(); // cargar clientes al inicio
  }, []);

  const cargarVehiculos = () => {
    api.get("/vehiculos/all")
      .then(res => setVehiculos(res.data))
      .catch(err => console.error(err));
  };

  const cargarClientes = () => {
    api.get("/clientes/all")
      .then(res => setClientes(res.data))
      .catch(err => console.error(err));
  };

  const guardarVehiculo = () => {
    if (!formData.patente.trim()) {
      setPatenteError("Patente es requerida");
      return;
    }
    setPatenteError("");
    if (editMode) {
      api.put("/vehiculos/update", formData)
        .then(() => { cargarVehiculos(); resetForm(); mostrarExito("Vehículo actualizado exitosamente"); })
        .catch(err => { console.error(err); mostrarError("Error al actualizar vehículo"); });
    } else {
      api.post("/vehiculos/insert", formData)
        .then(() => { cargarVehiculos(); resetForm(); mostrarExito("Vehículo creado exitosamente"); })
        .catch(err => { console.error(err); mostrarError("Error al crear vehículo"); });
    }
  };

  const editarVehiculo = (veh) => {
    setFormData({
      id: veh.id,
      marca: veh.marca,
      modelo: veh.modelo,
      patente: veh.patente,
      anio: veh.anio,
      numeroMotor: veh.numeroMotor,
      numeroChasis: veh.numeroChasis,
      rutDueno: veh.rutDueno,
      color: veh.color,
      kilometraje: veh.kilometraje,
      habilitado: veh.habilitado
    });
    setEditMode(true);
  };

  const eliminarVehiculo = (veh) => {
    api.delete("/vehiculos/delete", { data: { id: veh.id } })
      .then(() => { cargarVehiculos(); mostrarExito("Vehículo eliminado exitosamente"); })
      .catch(err => { console.error(err); mostrarError("Error al eliminar vehículo"); });
  };

  const resetForm = () => {
    setFormData({
      id: "",
      marca: "",
      modelo: "",
      patente: "",
      anio: "",
      numeroMotor: "",
      numeroChasis: "",
      rutDueno: "",
      color: "",
      kilometraje: "",
      habilitado: true
    });
    setEditMode(false);
    setPatenteError("");
  };

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const vehiculosFiltrados = vehiculos.filter((v) => {
    const texto = `${v.marca} ${v.modelo} ${v.patente} ${v.color} ${v.anio} ${v.rutDueno}`.toLowerCase();
    return texto.includes(search.toLowerCase());
  });

  return (
    <Box sx={{ mt: 2, px: { xs: 1, sm: 2 }, maxWidth: 1400, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>Gestión de Vehículos</Typography>

      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 2, borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth label="Marca" value={formData.marca}
              onChange={e => setFormData({ ...formData, marca: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth label="Modelo" value={formData.modelo}
              onChange={e => setFormData({ ...formData, modelo: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth label="Patente *" value={formData.patente}
              onChange={e => {
                const valor = e.target.value.toUpperCase();
                setFormData({ ...formData, patente: valor });
                if (valor.trim()) setPatenteError("");
              }}
              error={!!patenteError}
              helperText={patenteError} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Año" value={formData.anio}
              onChange={e => setFormData({ ...formData, anio: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Número Motor" value={formData.numeroMotor}
              onChange={e => setFormData({ ...formData, numeroMotor: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Número Chasis" value={formData.numeroChasis}
              onChange={e => setFormData({ ...formData, numeroChasis: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Color" value={formData.color}
              onChange={e => setFormData({ ...formData, color: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Autocomplete
              fullWidth
              sx={{
                "& .MuiAutocomplete-inputRoot .MuiAutocomplete-input": {
                  width: "20%",
                  minWidth: "80%"
                }
              }}


              options={clientes}
              getOptionLabel={(cliente) => `${cliente.nombre} ${cliente.apellido} - ${cliente.rut}`}
              value={clientes.find(c => c.rut === formData.rutDueno) || null}
              onChange={(event, newValue) => {
                setFormData({ ...formData, rutDueno: newValue ? newValue.rut : "" });
              }}
              isOptionEqualToValue={(option, value) => option.rut === value.rut}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  label="Rut Dueño"
                  placeholder="Buscar"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <React.Fragment>
                        {params.InputProps.endAdornment}
                        <InputAdornment position="end">
                          <Button variant="contained" size="small" onClick={handleOpenModal} sx={{ minWidth: "30px", width: "30px", height: "30px", p: 0, borderRadius: "50%", mr: 0 }}>
                            +
                          </Button>
                        </InputAdornment>
                      </React.Fragment>
                    ),
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth label="Kilometraje" value={formData.kilometraje}
              onChange={e => setFormData({ ...formData, kilometraje: e.target.value })} />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button variant="contained" color="primary" onClick={guardarVehiculo}>
                {editMode ? "Actualizar Vehículo" : "Crear Vehículo"}
              </Button>
              {editMode && (
                <Button variant="outlined" color="secondary" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
        <Typography variant="h6">Lista de Vehículos</Typography>
        <TextField
          fullWidth
          label="Buscar vehículo"
          placeholder="Marca, modelo, patente, color, año o RUT dueño"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ mt: 2 }}
        />
        <TableContainer component={Paper} sx={{ mt: 2, borderRadius: 2, overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Marca</TableCell>
                <TableCell>Modelo</TableCell>
                <TableCell>Patente</TableCell>
                <TableCell>Color</TableCell>
                <TableCell>Año</TableCell>
                <TableCell>Rut Dueño</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vehiculosFiltrados
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>{v.marca}</TableCell>
                    <TableCell>{v.modelo}</TableCell>
                    <TableCell>{v.patente}</TableCell>
                    <TableCell>{v.color}</TableCell>
                    <TableCell>{v.anio}</TableCell>
                    <TableCell>{formatearRut(v.rutDueno)}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => editarVehiculo(v)}
                        sx={{ mr: 1 }}
                        variant="outlined"
                      >
                        Editar
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => eliminarVehiculo(v)}
                        variant="contained"
                      >
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={vehiculosFiltrados.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Vehículos por página"
        />
      </Paper>

      <Dialog open={openModalCliente} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Nombre" value={nuevoCliente.nombre} onChange={e => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Apellido" value={nuevoCliente.apellido} onChange={e => setNuevoCliente({ ...nuevoCliente, apellido: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="RUT *" value={nuevoCliente.rut}
                onChange={e => {
                  const valor = e.target.value;
                  setNuevoCliente({ ...nuevoCliente, rut: valor });
                  if (valor.length >= 2) {
                    const res = validarRut(valor);
                    setRutModalError(res.valido ? "" : res.mensaje);
                  } else {
                    setRutModalError("");
                  }
                }}
                error={!!rutModalError}
                helperText={rutModalError} />
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <TextField fullWidth label="Dirección" value={nuevoCliente.direccion} onChange={e => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth label="Comuna" value={nuevoCliente.comuna} onChange={e => setNuevoCliente({ ...nuevoCliente, comuna: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth label="Ciudad" value={nuevoCliente.ciudad} onChange={e => setNuevoCliente({ ...nuevoCliente, ciudad: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Teléfono" value={nuevoCliente.telefono} onChange={e => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6} md={8}>
              <TextField fullWidth label="Email" value={nuevoCliente.email} onChange={e => setNuevoCliente({ ...nuevoCliente, email: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="secondary">Cancelar</Button>
          <Button onClick={guardarNuevoCliente} variant="contained" color="primary">Guardar Cliente</Button>
        </DialogActions>
      </Dialog>
      {notificacion}
    </Box>
  );
}

export default VehiculosCRUD;