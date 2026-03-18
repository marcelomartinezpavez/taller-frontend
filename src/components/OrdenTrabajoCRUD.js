import React, { useEffect, useState } from "react";
import api from "../services/api";
import {
  Paper, Typography, Box, TextField, Button,
  Select, MenuItem, InputLabel, FormControl
} from "@mui/material";

function OrdenTrabajoCRUD() {
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
    codigo: "",
    valorOt: "",
    estado: "ABIERTA",
    idEmpresa: "",
    detalleRepuesto: [],   // antes era "detalle"
    trabajosGenerales: [], // nuevo
    trabajosTerceros: []   // nuevo
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
    descripcion: "",
    porcentajeRecargo: "",
    valor: "",
    total: "",
    prestadorServicio: ""
  });

  const [trabajoTerceroTemp, setTrabajoTerceroTemp] = useState({
    descripcion: "",
    porcentajeRecargo: "",
    valor: "",
    total: "",
    prestadorServicio: ""
  });


  useEffect(() => {
    cargarOrdenes();
    cargarClientes();
    cargarVehiculos();
    cargarRepuestos();

  }, []);

  // carga vehículos filtrados por cliente
useEffect(() => {
  if (formData.rutCliente) {
    api.get(`/vehiculos/cliente/${formData.rutCliente}`)
      .then(res => setVehiculos(res.data))
      .catch(err => console.error(err));
  }
}, [formData.rutCliente]);

useEffect(() => {
  const totalOrden = formData.detalleRepuesto.reduce((acc, d) => acc + Number(d.total || 0), 0);
  setFormData(prev => ({ ...prev, valorOt: totalOrden }));
}, [formData.detalleRepuesto]);

useEffect(() => {
  const base = Number(detalleTemp.cantidad) * Number(detalleTemp.valor);
  const recargo = (Number(detalleTemp.porcentajeRecargo) * base) / 100;
  const totalDetalle = base + recargo;

  setDetalleTemp(prev => ({ ...prev, total: totalDetalle }));
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

  const editarOrden = (ot) => {
    setFormData({
      id: ot.id,
      numeroOrden: ot.numeroOrden,
      habilitado: ot.habilitado,
      rutCliente: ot.rutCliente,
      patenteVehiculo: ot.patenteVehiculo,
      codigo: ot.codigo,
      valorOt: ot.valorOt,
      estado: ot.estado,
      idEmpresa: ot.empresa?.id || "",
      detalle: ot.detalle || []
    });
    setEditMode(true);
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
      codigo: "",
      valorOt: "",
      estado: "ABIERTA",
      idEmpresa: "",
      detalleRepuesto: [],
      trabajosGenerales: [],
      trabajosTerceros: []

    });
    setEditMode(false);
  };

  const agregarDetalle = () => {
    const base = Number(detalleTemp.cantidad) * Number(detalleTemp.valor);
    const recargo = (Number(detalleTemp.porcentajeRecargo) * base) / 100;
    const totalDetalle = base + recargo;

    const nuevoDetalle = {
      ...detalleTemp,
      total: totalDetalle
    };

    const nuevosDetalles = [...formData.detalleRepuesto, nuevoDetalle];

    // recalcular valor OT
    const totalOrden = nuevosDetalles.reduce((acc, d) => acc + Number(d.total || 0), 0);

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
    const base = Number(trabajoGeneralTemp.valor);
    const recargo = (Number(trabajoGeneralTemp.porcentajeRecargo) * base) / 100;
    const total = base + recargo;

    const nuevoTrabajo = { ...trabajoGeneralTemp, total };
    setFormData({
      ...formData,
      trabajosGenerales: [...formData.trabajosGenerales, nuevoTrabajo],
      valorOt: Number(formData.valorOt) + total
    });


    setTrabajoGeneralTemp({ descripcion: "", porcentajeRecargo: "", valor: "", total: "", prestadorServicio: "" });
  };

  const agregarTrabajoTercero = () => {
    const base = Number(trabajoTerceroTemp.valor);
    const recargo = (Number(trabajoTerceroTemp.porcentajeRecargo) * base) / 100;
    const total = base + recargo;

    const nuevoTrabajo = { ...trabajoTerceroTemp, total };
    setFormData({
      ...formData,
      trabajosTerceros: [...formData.trabajosTerceros, nuevoTrabajo],
      valorOt: Number(formData.valorOt) + total
    });


    setTrabajoTerceroTemp({ descripcion: "", porcentajeRecargo: "", valor: "", total: "", prestadorServicio: "" });
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
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>Gestión de Órdenes de Trabajo</Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField label="Número Orden" value={formData.numeroOrden}
          onChange={e => setFormData({ ...formData, numeroOrden: e.target.value })} sx={{ mr: 2 }} />

        {/* Select Cliente */}
        <FormControl sx={{ mr: 2, minWidth: 200 }}>
          <InputLabel>Cliente</InputLabel>
          <Select
            value={formData.rutCliente}
            onChange={e => setFormData({ ...formData, rutCliente: e.target.value, patenteVehiculo: "" })}
          >
            {clientes.map(c => (
              <MenuItem key={c.id} value={c.rut}>
                {c.nombre} {c.apellido} - {c.rut}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Select Vehículo filtrado por cliente */}
        <FormControl sx={{ mr: 2, minWidth: 200 }}>
          <InputLabel>Vehículo</InputLabel>
          <Select
            value={formData.patenteVehiculo}
            onChange={e => setFormData({ ...formData, patenteVehiculo: e.target.value })}
          >
            {vehiculos
              .filter(v => v.rutDueno === formData.rutCliente)
              .map(v => (
                <MenuItem key={v.id} value={v.patente}>
                  {v.marca} {v.modelo} - {v.patente}
                </MenuItem>
              ))}
          </Select>
        </FormControl>

        <TextField label="Código" value={formData.codigo}
          onChange={e => setFormData({ ...formData, codigo: e.target.value })} sx={{ mr: 2 }} />
        <TextField label="Valor OT" type="number" value={formData.valorOt}
          InputProps={{ readOnly: true }}
          sx={{ mr: 2 }}
        />
        {/* Valor OT calculado automáticamente */}
        <TextField
  label="Valor OT"
  type="number"
  value={formData.valorOt}
  slotProps={{ input: { readOnly: true } }}
  sx={{ mr: 2 }}
/>



        <TextField label="Estado" value={formData.estado}
          onChange={e => setFormData({ ...formData, estado: e.target.value })} sx={{ mr: 2 }} />
        <TextField label="ID Empresa" value={formData.idEmpresa}
          onChange={e => setFormData({ ...formData, idEmpresa: e.target.value })} sx={{ mr: 2 }} />

        <Typography variant="h6" sx={{ mt: 2 }}>Detalles</Typography>
<Box sx={{ display: "flex", gap: 2, mb: 2 }}>
  <TextField label="Descripción" value={detalleTemp.descripcion}
    onChange={e => setDetalleTemp({ ...detalleTemp, descripcion: e.target.value })} />
  <TextField label="Recargo (%)" type="number" value={detalleTemp.porcentajeRecargo}
    onChange={e => setDetalleTemp({ ...detalleTemp, porcentajeRecargo: e.target.value })} />
  <TextField label="Valor" type="number" value={detalleTemp.valor}
    onChange={e => setDetalleTemp({ ...detalleTemp, valor: e.target.value })} />
  <TextField label="Cantidad" type="number" value={detalleTemp.cantidad}
    onChange={e => setDetalleTemp({ ...detalleTemp, cantidad: e.target.value })} />
  
    <TextField
  label="Total"
  type="number"
  value={detalleTemp.total || 0}
  slotProps={{ input: { readOnly: true } }}
/>

  {/* Select Repuesto */}
  <FormControl sx={{ minWidth: 200 }}>
    <InputLabel>Repuesto</InputLabel>
    <Select
      value={detalleTemp.repuesto_id}
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

  <Button variant="outlined" onClick={agregarDetalle}>Agregar Detalle</Button>
</Box>

{/* --- Sección Trabajos Generales --- */}
        <Typography variant="h6" sx={{ mt: 2 }}>Trabajos Generales</Typography>
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField label="Descripción" value={trabajoGeneralTemp.descripcion}
            onChange={e => setTrabajoGeneralTemp({ ...trabajoGeneralTemp, descripcion: e.target.value })} />
          <TextField label="Recargo (%)" type="number" value={trabajoGeneralTemp.porcentajeRecargo}
            onChange={e => setTrabajoGeneralTemp({ ...trabajoGeneralTemp, porcentajeRecargo: e.target.value })} />
          <TextField label="Valor" type="number" value={trabajoGeneralTemp.valor}
            onChange={e => setTrabajoGeneralTemp({ ...trabajoGeneralTemp, valor: e.target.value })} />
          <TextField label="Prestador Servicio" value={trabajoGeneralTemp.prestadorServicio}
            onChange={e => setTrabajoGeneralTemp({ ...trabajoGeneralTemp, prestadorServicio: e.target.value })} />
          <Button variant="outlined" onClick={agregarTrabajoGeneral}>Agregar Trabajo General</Button>
        </Box>

{/* --- Sección Trabajos Terceros --- */}
        <Typography variant="h6" sx={{ mt: 2 }}>Trabajos Terceros</Typography>
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField label="Descripción" value={trabajoTerceroTemp.descripcion}
            onChange={e => setTrabajoTerceroTemp({ ...trabajoTerceroTemp, descripcion: e.target.value })} />
          <TextField label="Recargo (%)" type="number" value={trabajoTerceroTemp.porcentajeRecargo}
            onChange={e => setTrabajoGeneralTemp({ ...trabajoTerceroTemp, porcentajeRecargo: e.target.value })} />
          <TextField label="Valor" type="number" value={trabajoTerceroTemp.valor}
            onChange={e => setTrabajoTerceroTemp({ ...trabajoTerceroTemp, valor: e.target.value })} />
          <TextField label="Prestador Servicio" value={trabajoTerceroTemp.prestadorServicio}
            onChange={e => setTrabajoTerceroTemp({ ...trabajoTerceroTemp, prestadorServicio: e.target.value })} />
          <Button variant="outlined" onClick={agregarTrabajoTercero}>Agregar Trabajo Tercero</Button>
        </Box>


<ul>
  {formData.detalleRepuesto.map((d, idx) => (
    <li key={idx}>
      {d.descripcion} - Recargo: {d.porcentajeRecargo}% - Valor: {d.valor} - Cantidad: {d.cantidad} - 
      Total: {d.total} - Repuesto: {d.repuesto_id || "Sin repuesto"}
    </li>
  ))}
</ul>




        <Button variant="contained" color="primary" onClick={guardarOrden}>
          {editMode ? "Actualizar Orden" : "Crear Orden"}
        </Button>
        {editMode && (
          <Button variant="outlined" color="secondary" onClick={resetForm} sx={{ ml: 2 }}>
            Cancelar
          </Button>
        )}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">Lista de Órdenes de Trabajo</Typography>
        <ul>
          {ordenes.map(o => (
            <li key={o.id}>
              Orden #{o.numeroOrden} - Cliente: {o.rutCliente} - Vehículo: {o.patenteVehiculo} - Estado: {o.estado}
              <Button size="small" onClick={() => editarOrden(o)} sx={{ ml: 2 }}>Editar</Button>
              <Button size="small" color="error" onClick={() => eliminarOrden(o)} sx={{ ml: 1 }}>Eliminar</Button>
            </li>
          ))}
        </ul>
      </Paper>
    </Box>
  );
}

export default OrdenTrabajoCRUD;