import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Paper, Typography, Box, TextField, Button } from "@mui/material";

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
    idEmpresa: "",
    habilitado: true
  });
  const [editMode, setEditMode] = useState(false);

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
      idEmpresa: prov.empresa?.id || "",
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
      idEmpresa: "",
      habilitado: true
    });
    setEditMode(false);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>Gestión de Proveedores</Typography>

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

        <Button variant="contained" color="primary" onClick={guardarProveedor}>
          {editMode ? "Actualizar Proveedor" : "Crear Proveedor"}
        </Button>
        {editMode && (
          <Button variant="outlined" color="secondary" onClick={resetForm} sx={{ ml: 2 }}>
            Cancelar
          </Button>
        )}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">Lista de Proveedores</Typography>
        <ul>
          {proveedores.map(p => (
            <li key={p.id}>
              {p.nombre} {p.apellido} - {p.rut} - {p.email}
              <Button size="small" onClick={() => editarProveedor(p)} sx={{ ml: 2 }}>Editar</Button>
              <Button size="small" color="error" onClick={() => eliminarProveedor(p)} sx={{ ml: 1 }}>Eliminar</Button>
            </li>
          ))}
        </ul>
      </Paper>
    </Box>
  );
}

export default ProveedorCRUD;