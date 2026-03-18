import React, { useEffect, useState } from "react";
import api from "../services/api";
import {
  Paper, Typography, Box, TextField, Button,
  Select, MenuItem, InputLabel, FormControl,
  TableCell, Table, TableBody,TableContainer,
  TableHead, TableRow
} from "@mui/material";


function VehiculosCRUD() {
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
    habilitado: true,
    id_empresa: ""
  });
  const [editMode, setEditMode] = useState(false);

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
    if (editMode) {
      api.put("/vehiculos/update", formData)
        .then(() => {
          cargarVehiculos();
          resetForm();
        })
        .catch(err => console.error(err));
    } else {
      api.post("/vehiculos/insert", formData)
        .then(() => {
          cargarVehiculos();
          resetForm();
        })
        .catch(err => console.error(err));
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
      habilitado: veh.habilitado,
      id_empresa: veh.empresa?.id || ""
    });
    setEditMode(true);
  };

  const eliminarVehiculo = (veh) => {
    api.delete("/vehiculos/delete", { data: { id: veh.id } })
      .then(() => cargarVehiculos())
      .catch(err => console.error(err));
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
      habilitado: true,
      id_empresa: ""
    });
    setEditMode(false);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>Gestión de Vehículos</Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField label="Marca" value={formData.marca}
          onChange={e => setFormData({ ...formData, marca: e.target.value })} sx={{ mr: 2 }} />
        <TextField label="Modelo" value={formData.modelo}
          onChange={e => setFormData({ ...formData, modelo: e.target.value })} sx={{ mr: 2 }} />
        <TextField label="Patente" value={formData.patente}
          onChange={e => setFormData({ ...formData, patente: e.target.value })} sx={{ mr: 2 }} />
        <TextField label="Año" value={formData.anio}
          onChange={e => setFormData({ ...formData, anio: e.target.value })} sx={{ mr: 2 }} />
        <TextField label="Número Motor" value={formData.numeroMotor}
          onChange={e => setFormData({ ...formData, numeroMotor: e.target.value })} sx={{ mr: 2 }} />
        <TextField label="Número Chasis" value={formData.numeroChasis}
          onChange={e => setFormData({ ...formData, numeroChasis: e.target.value })} sx={{ mr: 2 }} />

        {/* Select para Rut Dueño */}
        <FormControl sx={{ mr: 2, minWidth: 200 }}>
          <InputLabel>Rut Dueño</InputLabel>
          <Select
            value={formData.rutDueno}
            onChange={e => setFormData({ ...formData, rutDueno: e.target.value })}
          >
            {clientes.map(cliente => (
              <MenuItem key={cliente.id} value={cliente.rut}>
                {cliente.nombre} {cliente.apellido} - {cliente.rut}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField label="Color" value={formData.color}
          onChange={e => setFormData({ ...formData, color: e.target.value })} sx={{ mr: 2 }} />
        <TextField label="Kilometraje" value={formData.kilometraje}
          onChange={e => setFormData({ ...formData, kilometraje: e.target.value })} sx={{ mr: 2 }} />
        <TextField label="ID Empresa" value={formData.id_empresa}
          onChange={e => setFormData({ ...formData, id_empresa: e.target.value })} sx={{ mr: 2 }} />

        <Button variant="contained" color="primary" onClick={guardarVehiculo}>
          {editMode ? "Actualizar Vehículo" : "Crear Vehículo"}
        </Button>
        {editMode && (
          <Button variant="outlined" color="secondary" onClick={resetForm} sx={{ ml: 2 }}>
            Cancelar
          </Button>
        )}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">Lista de Vehículos</Typography>
        <ul>

<TableContainer component={Paper} sx={{ mt: 2 }}>
  <Table>
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
      {vehiculos.map((v) => (
        <TableRow key={v.id}>
          <TableCell>{v.marca}</TableCell>
          <TableCell>{v.modelo}</TableCell>
          <TableCell>{v.patente}</TableCell>
          <TableCell>{v.color}</TableCell>
          <TableCell>{v.anio}</TableCell>
          <TableCell>{v.rutDueno}</TableCell>
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



        </ul>
      </Paper>
    </Box>
  );
}

export default VehiculosCRUD;