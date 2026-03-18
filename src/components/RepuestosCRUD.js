import React, { useEffect, useState } from "react";
import api from "../services/api";
import {
  Paper, Typography, Box, TextField, Button,
  Select, MenuItem, InputLabel, FormControl
} from "@mui/material";

function RepuestoCRUD() {
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
    idEmpresa: "",
    habilitado: true
  });
  const [editMode, setEditMode] = useState(false);

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
        .then(() => {
          cargarRepuestos();
          resetForm();
        })
        .catch(err => console.error(err));
    } else {
      api.post("/repuesto/insert", formData)
        .then(() => {
          cargarRepuestos();
          resetForm();
        })
        .catch(err => console.error(err));
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
      idEmpresa: rep.empresa?.id || "",
      habilitado: rep.habilitado
    });
    setEditMode(true);
  };

  const eliminarRepuesto = (rep) => {
    api.delete("/repuesto/delete", { data: { id: rep.id } })
      .then(() => cargarRepuestos())
      .catch(err => console.error(err));
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
      idEmpresa: "",
      habilitado: true
    });
    setEditMode(false);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>Gestión de Repuestos</Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField label="Nombre" value={formData.nombre}
          onChange={e => setFormData({ ...formData, nombre: e.target.value })} sx={{ mr: 2 }} />
        <TextField label="Código" value={formData.codigo}
          onChange={e => setFormData({ ...formData, codigo: e.target.value })} sx={{ mr: 2 }} />
        <TextField label="Marca" value={formData.marca}
          onChange={e => setFormData({ ...formData, marca: e.target.value })} sx={{ mr: 2 }} />
        <TextField label="Modelo" value={formData.modelo}
          onChange={e => setFormData({ ...formData, modelo: e.target.value })} sx={{ mr: 2 }} />
        <TextField label="Año" value={formData.anio}
          onChange={e => setFormData({ ...formData, anio: e.target.value })} sx={{ mr: 2 }} />

        {/* Select para Rut Proveedor */}
        <FormControl sx={{ mr: 2, minWidth: 200 }}>
          <InputLabel>Proveedor</InputLabel>
          <Select
            value={formData.rutProveedor}
            onChange={e => setFormData({ ...formData, rutProveedor: e.target.value })}
          >
            {proveedores.map(prov => (
              <MenuItem key={prov.id} value={prov.rut}>
                {prov.nombre} {prov.apellido} - {prov.rut}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField label="Valor" type="number" value={formData.valor}
          onChange={e => setFormData({ ...formData, valor: e.target.value })} sx={{ mr: 2 }} />
        <TextField label="ID Empresa" value={formData.idEmpresa}
          onChange={e => setFormData({ ...formData, idEmpresa: e.target.value })} sx={{ mr: 2 }} />

        <Button variant="contained" color="primary" onClick={guardarRepuesto}>
          {editMode ? "Actualizar Repuesto" : "Crear Repuesto"}
        </Button>
        {editMode && (
          <Button variant="outlined" color="secondary" onClick={resetForm} sx={{ ml: 2 }}>
            Cancelar
          </Button>
        )}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">Lista de Repuestos</Typography>
        <ul>
          {repuestos.map(r => (
            <li key={r.id}>
              {r.nombre} - {r.codigo} - {r.marca} - {r.modelo} - {r.anio} - ${r.valor}
              <Button size="small" onClick={() => editarRepuesto(r)} sx={{ ml: 2 }}>Editar</Button>
              <Button size="small" color="error" onClick={() => eliminarRepuesto(r)} sx={{ ml: 1 }}>Eliminar</Button>
            </li>
          ))}
        </ul>
      </Paper>
    </Box>
  );
}

export default RepuestoCRUD;