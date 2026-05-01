import React, { useEffect, useState } from "react";
import api from "../services/api";
import {
  Paper, Typography, Box, TextField, Button,
  Select, MenuItem, InputLabel, FormControl,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Grid
} from "@mui/material";
import { useNotificacion } from "../utils/useNotificacion";

function RepuestoCRUD() {
  const selectFieldSx = { "& .MuiOutlinedInput-root": { minHeight: 56 } };
  const { mostrarExito, mostrarError, notificacion } = useNotificacion();
  const [repuestos, setRepuestos] = useState([]);
  const [proveedores, setProveedores] = useState([]); // lista de proveedores
  const [formData, setFormData] = useState({
    id: "",
    nombre: "",
    codigo: "",
    marca: "",
    modelo: "",
    anio: "",
    rutProveedor: "",
    valor: "",
    habilitado: true
  });
  const [editMode, setEditMode] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");

  useEffect(() => {
    cargarRepuestos();
    cargarProveedores(); // cargar proveedores al inicio
  }, []);

  const cargarRepuestos = () => {
    api.get("/repuesto/all")
      .then(res => setRepuestos(res.data))
      .catch(err => console.error(err));
  };

  const cargarProveedores = () => {
    api.get("/proveedor/all")
      .then(res => setProveedores(res.data))
      .catch(err => console.error(err));
  };

  const guardarRepuesto = () => {
    if (editMode) {
      api.put("/repuesto/update", formData)
        .then(() => { cargarRepuestos(); resetForm(); mostrarExito("Repuesto actualizado exitosamente"); })
        .catch(err => { console.error(err); mostrarError("Error al actualizar repuesto"); });
    } else {
      api.post("/repuesto/insert", formData)
        .then(() => { cargarRepuestos(); resetForm(); mostrarExito("Repuesto creado exitosamente"); })
        .catch(err => { console.error(err); mostrarError("Error al crear repuesto"); });
    }
  };

  const editarRepuesto = (rep) => {
    setFormData({
      id: rep.id,
      nombre: rep.nombre,
      codigo: rep.codigo,
      marca: rep.marca,
      modelo: rep.modelo,
      anio: rep.anio,
      rutProveedor: rep.rutProveedor,
      valor: rep.valor,
      habilitado: rep.habilitado
    });
    setEditMode(true);
  };

  const eliminarRepuesto = (rep) => {
    api.delete("/repuesto/delete", { data: { id: rep.id } })
      .then(() => { cargarRepuestos(); mostrarExito("Repuesto eliminado exitosamente"); })
      .catch(err => { console.error(err); mostrarError("Error al eliminar repuesto"); });
  };

  const resetForm = () => {
    setFormData({
      id: "",
      nombre: "",
      codigo: "",
      marca: "",
      modelo: "",
      anio: "",
      rutProveedor: "",
      valor: "",
      habilitado: true
    });
    setEditMode(false);
  };

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const repuestosFiltrados = repuestos.filter((r) => {
    const texto = `${r.nombre} ${r.codigo} ${r.marca} ${r.modelo} ${r.anio} ${r.rutProveedor} ${r.valor}`.toLowerCase();
    return texto.includes(search.toLowerCase());
  });

  return (
    <Box sx={{ mt: 2, px: { xs: 1, sm: 2 }, maxWidth: 1400, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>Gestión de Repuestos</Typography>

      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 2, borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth label="Nombre" value={formData.nombre}
              onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth label="Código" value={formData.codigo}
              onChange={e => setFormData({ ...formData, codigo: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth label="Marca" value={formData.marca}
              onChange={e => setFormData({ ...formData, marca: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth label="Modelo" value={formData.modelo}
              onChange={e => setFormData({ ...formData, modelo: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField fullWidth label="Año" value={formData.anio}
              onChange={e => setFormData({ ...formData, anio: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Valor" type="number" value={formData.valor}
              onChange={e => setFormData({ ...formData, valor: e.target.value })} />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth sx={selectFieldSx}>
              <InputLabel shrink>Proveedor</InputLabel>
              <Select
                value={formData.rutProveedor}
                label="Proveedor"
                displayEmpty
                onChange={e => setFormData({ ...formData, rutProveedor: e.target.value })}
              >
                <MenuItem value="" disabled>Selecciona un proveedor</MenuItem>
                {proveedores.map(prov => (
                  <MenuItem key={prov.id} value={prov.rut}>
                    {prov.nombre} {prov.apellido} - {prov.rut}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button variant="contained" color="primary" onClick={guardarRepuesto}>
                {editMode ? "Actualizar Repuesto" : "Crear Repuesto"}
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
        <Typography variant="h6">Lista de Repuestos</Typography>
        <TextField
          fullWidth
          label="Buscar repuesto"
          placeholder="Nombre, código, marca, modelo, año, proveedor o valor"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ mt: 2 }}
        />
        <TableContainer component={Paper} sx={{ mt: 2, borderRadius: 2, overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Código</TableCell>
                <TableCell>Marca</TableCell>
                <TableCell>Modelo</TableCell>
                <TableCell>Año</TableCell>
                <TableCell>Proveedor (RUT)</TableCell>
                <TableCell>Valor</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {repuestosFiltrados
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.nombre}</TableCell>
                  <TableCell>{r.codigo}</TableCell>
                  <TableCell>{r.marca}</TableCell>
                  <TableCell>{r.modelo}</TableCell>
                  <TableCell>{r.anio}</TableCell>
                  <TableCell>{r.rutProveedor}</TableCell>
                  <TableCell>${r.valor}</TableCell>
                  <TableCell>{r.habilitado ? "Activo" : "Inactivo"}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => editarRepuesto(r)} sx={{ mr: 1 }} variant="outlined">Editar</Button>
                    <Button size="small" color="error" onClick={() => eliminarRepuesto(r)} variant="contained">Eliminar</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={repuestosFiltrados.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Repuestos por página"
        />
      </Paper>
      {notificacion}
    </Box>
  );
}

export default RepuestoCRUD;