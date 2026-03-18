import React, { useEffect, useState } from "react";
import api from "../services/api";
import {Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Typography, Box, TextField, Button } from "@mui/material";

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
    idEmpresa: "",
    habilitado: true
  });
  const [editMode, setEditMode] = useState(false);

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
      idEmpresa: cliente.empresa?.id || "",
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
      idEmpresa: "",
      habilitado: true
    });
    setEditMode(false);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>Gestión de Clientes</Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField label="Nombre" value={formData.nombre}
          onChange={e => setFormData({ ...formData, nombre: e.target.value })} sx={{ mr: 2 }} />
        <TextField label="Apellido" value={formData.apellido}
          onChange={e => setFormData({ ...formData, apellido: e.target.value })} sx={{ mr: 2 }} />
        <TextField label="RUT" value={formData.rut}
          onChange={e => setFormData({ ...formData, rut: e.target.value })} sx={{ mr: 2 }} />
        <TextField label="Dirección" value={formData.direccion}
          onChange={e => setFormData({ ...formData, direccion: e.target.value })} sx={{ mr: 2 }} />
        <TextField label="Comuna" value={formData.comuna}
          onChange={e => setFormData({ ...formData, comuna: e.target.value })} sx={{ mr: 2 }} />
        <TextField label="Ciudad" value={formData.ciudad}
          onChange={e => setFormData({ ...formData, ciudad: e.target.value })} sx={{ mr: 2 }} />
        <TextField label="Teléfono" value={formData.telefono}
          onChange={e => setFormData({ ...formData, telefono: e.target.value })} sx={{ mr: 2 }} />
        <TextField label="Email" value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })} sx={{ mr: 2 }} />
        <TextField label="ID Empresa" value={formData.idEmpresa}
          onChange={e => setFormData({ ...formData, idEmpresa: e.target.value })} sx={{ mr: 2 }} />

        <Button variant="contained" color="primary" onClick={guardarCliente}>
          {editMode ? "Actualizar Cliente" : "Crear Cliente"}
        </Button>
        {editMode && (
          <Button variant="outlined" color="secondary" onClick={resetForm} sx={{ ml: 2 }}>
            Cancelar
          </Button>
        )}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">Lista de Clientes</Typography>
        <ul>


<TableContainer component={Paper} sx={{ mt: 2 }}>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>Nombre</TableCell>
        <TableCell>Apellido</TableCell>
        <TableCell>RUT</TableCell>
        <TableCell>Teléfono</TableCell>
        <TableCell>Email</TableCell>
        <TableCell>Acciones</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {clientes.map((c) => (
        <TableRow key={c.id}>
          <TableCell>{c.nombre}</TableCell>
          <TableCell>{c.apellido}</TableCell>
          <TableCell>{c.rut}</TableCell>
          <TableCell>{c.telefono}</TableCell>
          <TableCell>{c.email}</TableCell>
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
          
        </ul>
      </Paper>
    </Box>
  );
}

export default ClientesCRUD;