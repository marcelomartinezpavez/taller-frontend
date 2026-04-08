import React, { useEffect, useState } from "react";
import api from "../services/api";
import {
  Paper, Typography, Box, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Grid
} from "@mui/material";

function ProveedorCRUD() {
  const [proveedores, setProveedores] = useState([]);
  const [formData, setFormData] = useState({
    id: "",
    nombre: "",
    apellido: "",
    rut: "",
    direccion: "",
    comuna: "",
    ciudad: "",
    telefono: "",
    email: "",
    habilitado: true
  });
  const [editMode, setEditMode] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");

  useEffect(() => {
    cargarProveedores();
  }, []);

  const cargarProveedores = () => {
    api.get("/proveedor/all")
      .then(res => setProveedores(res.data))
      .catch(err => console.error(err));
  };

  const guardarProveedor = () => {
    if (editMode) {
      api.put("/proveedor/update", formData)
        .then(() => {
          cargarProveedores();
          resetForm();
        })
        .catch(err => console.error(err));
    } else {
      api.post("/proveedor/insert", formData)
        .then(() => {
          cargarProveedores();
          resetForm();
        })
        .catch(err => console.error(err));
    }
  };

  const editarProveedor = (prov) => {
    setFormData({
      id: prov.id,
      nombre: prov.nombre,
      apellido: prov.apellido,
      rut: prov.rut,
      direccion: prov.direccion,
      comuna: prov.comuna,
      ciudad: prov.ciudad,
      telefono: prov.telefono,
      email: prov.email,
      habilitado: prov.habilitado
    });
    setEditMode(true);
  };

  const eliminarProveedor = (prov) => {
    api.delete("/proveedor/delete", { data: { id: prov.id } })
      .then(() => cargarProveedores())
      .catch(err => console.error(err));
  };

  const resetForm = () => {
    setFormData({
      id: "",
      nombre: "",
      apellido: "",
      rut: "",
      direccion: "",
      comuna: "",
      ciudad: "",
      telefono: "",
      email: "",
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

  const proveedoresFiltrados = proveedores.filter((p) => {
    const texto = `${p.nombre} ${p.apellido} ${p.rut} ${p.direccion} ${p.comuna} ${p.ciudad} ${p.telefono} ${p.email}`.toLowerCase();
    return texto.includes(search.toLowerCase());
  });

  return (
    <Box sx={{ mt: 2, px: { xs: 1, sm: 2 }, maxWidth: 1400, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>Gestión de Proveedores</Typography>

      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 2, borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth label="Nombre" value={formData.nombre}
              onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth label="Apellido" value={formData.apellido}
              onChange={e => setFormData({ ...formData, apellido: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth label="RUT" value={formData.rut}
              onChange={e => setFormData({ ...formData, rut: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6} md={6}>
            <TextField fullWidth label="Dirección" value={formData.direccion}
              onChange={e => setFormData({ ...formData, direccion: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Comuna" value={formData.comuna}
              onChange={e => setFormData({ ...formData, comuna: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Ciudad" value={formData.ciudad}
              onChange={e => setFormData({ ...formData, ciudad: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth label="Teléfono" value={formData.telefono}
              onChange={e => setFormData({ ...formData, telefono: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6} md={8}>
            <TextField fullWidth label="Email" value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })} />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button variant="contained" color="primary" onClick={guardarProveedor}>
                {editMode ? "Actualizar Proveedor" : "Crear Proveedor"}
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
        <Typography variant="h6">Lista de Proveedores</Typography>
        <TextField
          fullWidth
          label="Buscar proveedor"
          placeholder="Nombre, RUT, dirección, comuna, ciudad, teléfono o email"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ mt: 2 }}
        />
        <TableContainer component={Paper} sx={{ mt: 2, borderRadius: 2, overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Apellido</TableCell>
                <TableCell>RUT</TableCell>
                <TableCell>Dirección</TableCell>
                <TableCell>Comuna</TableCell>
                <TableCell>Ciudad</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {proveedoresFiltrados
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.nombre}</TableCell>
                  <TableCell>{p.apellido}</TableCell>
                  <TableCell>{p.rut}</TableCell>
                  <TableCell>{p.direccion}</TableCell>
                  <TableCell>{p.comuna}</TableCell>
                  <TableCell>{p.ciudad}</TableCell>
                  <TableCell>{p.telefono}</TableCell>
                  <TableCell>{p.email}</TableCell>
                  <TableCell>{p.habilitado ? "Activo" : "Inactivo"}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => editarProveedor(p)} sx={{ mr: 1 }} variant="outlined">Editar</Button>
                    <Button size="small" color="error" onClick={() => eliminarProveedor(p)} variant="contained">Eliminar</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={proveedoresFiltrados.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Proveedores por página"
        />
      </Paper>
    </Box>
  );
}

export default ProveedorCRUD;