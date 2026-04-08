import React, { useEffect, useState } from "react";
import api from "../services/api";
import {Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Typography, Box, TextField, Button, TablePagination, Grid } from "@mui/material";

function ClientesCRUD() {
  const [clientes, setClientes] = useState([]);
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
    cargarClientes();
  }, []);

  const cargarClientes = () => {
    api.get("/clientes/all")
      .then(res => setClientes(res.data))
      .catch(err => console.error(err));
  };

  const guardarCliente = () => {
    if (editMode) {
      api.put("/clientes/update", formData)
        .then(() => {
          cargarClientes();
          resetForm();
        })
        .catch(err => console.error(err));
    } else {
      api.post("/clientes/insert", formData)
        .then(() => {
          cargarClientes();
          resetForm();
        })
        .catch(err => console.error(err));
    }
  };

  const editarCliente = (cliente) => {
    setFormData({
      id: cliente.id,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      rut: cliente.rut,
      direccion: cliente.direccion,
      comuna: cliente.comuna,
      ciudad: cliente.ciudad,
      telefono: cliente.telefono,
      email: cliente.email,
      habilitado: cliente.habilitado
    });
    setEditMode(true);
  };

  const eliminarCliente = (cliente) => {
    api.delete("/clientes/delete", { data: { id: cliente.id } })
      .then(() => cargarClientes())
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

  const clientesFiltrados = clientes.filter((c) => {
    const texto = `${c.nombre} ${c.apellido} ${c.rut} ${c.direccion} ${c.comuna} ${c.ciudad} ${c.telefono} ${c.email}`.toLowerCase();
    return texto.includes(search.toLowerCase());
  });

  return (
    <Box sx={{ mt: 2, px: { xs: 1, sm: 2 }, maxWidth: 1400, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>Gestión de Clientes</Typography>

      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 2, borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Nombre"
              value={formData.nombre}
              onChange={e => setFormData({ ...formData, nombre: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Apellido"
              value={formData.apellido}
              onChange={e => setFormData({ ...formData, apellido: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="RUT"
              value={formData.rut}
              onChange={e => setFormData({ ...formData, rut: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={6}>
            <TextField
              fullWidth
              label="Dirección"
              value={formData.direccion}
              onChange={e => setFormData({ ...formData, direccion: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Comuna"
              value={formData.comuna}
              onChange={e => setFormData({ ...formData, comuna: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Ciudad"
              value={formData.ciudad}
              onChange={e => setFormData({ ...formData, ciudad: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Teléfono"
              value={formData.telefono}
              onChange={e => setFormData({ ...formData, telefono: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={8}>
            <TextField
              fullWidth
              label="Email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button variant="contained" color="primary" onClick={guardarCliente}>
                {editMode ? "Actualizar Cliente" : "Crear Cliente"}
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
        <Typography variant="h6">Lista de Clientes</Typography>
        <TextField
          fullWidth
          label="Buscar cliente"
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
      {clientesFiltrados
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map((c) => (
        <TableRow key={c.id}>
          <TableCell>{c.nombre}</TableCell>
          <TableCell>{c.apellido}</TableCell>
          <TableCell>{c.rut}</TableCell>
          <TableCell>{c.direccion}</TableCell>
          <TableCell>{c.comuna}</TableCell>
          <TableCell>{c.ciudad}</TableCell>
          <TableCell>{c.telefono}</TableCell>
          <TableCell>{c.email}</TableCell>
          <TableCell>{c.habilitado ? "Activo" : "Inactivo"}</TableCell>
          <TableCell>
            <Button
              size="small"
              onClick={() => editarCliente(c)}
              sx={{ mr: 1 }}
              variant="outlined"
            >
              Editar
            </Button>
            <Button
              size="small"
              color="error"
              onClick={() => eliminarCliente(c)}
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
          count={clientesFiltrados.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Clientes por página"
        />
      </Paper>
    </Box>
  );
}

export default ClientesCRUD;