import React, { useEffect, useState } from "react";
import api from "../services/api";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import {
  Paper, Typography, Box, TextField, Button, Autocomplete,
  Select, MenuItem, InputLabel, FormControl,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Grid, Slider,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider, IconButton, Chip
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { validarRut, formatearRut } from "../utils/validar";
import { useNotificacion } from "../utils/useNotificacion";

const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    [{ 'color': [] }, { 'background': [] }],
    ['clean']
  ],
};

function OrdenTrabajoCRUD() {
  const selectFieldSx = { "& .MuiOutlinedInput-root": { minHeight: 56 } };
  const [rutError, setRutError] = useState("");
  const { mostrarExito, mostrarError, notificacion } = useNotificacion();

  // Formatea números con separador de miles
  const fmt = (n) => {
    const num = Number(n);
    if (isNaN(num) || n === "" || n === null || n === undefined) return "-";
    return num.toLocaleString("es-CL");
  };

  // Formatea valor para mostrar en input (con separador de miles)
  const fmtDisplay = (n) => {
    const num = Number(n);
    if (isNaN(num) || n === "" || n === null || n === undefined) return "";
    return num.toLocaleString("es-CL");
  };

  // Limpia formato para obtener número raw
  const parseRaw = (v) => v.replace(/\./g, "").replace(/,/g, "");

  // Formatea fecha (dd/mm/yyyy hh:mm)
  const formatearFecha = (fechaStr) => {
    if (!fechaStr || fechaStr.includes("null")) return "-";
    try {
      const fecha = new Date(fechaStr);
      if (isNaN(fecha.getTime())) {
        const partes = fechaStr.split(/[\/\s:]/);
        if (partes.length >= 3) {
          const dia = partes[0].padStart(2, '0');
          const mes = partes[1].padStart(2, '0');
          const anio = partes[2];
          const hora = partes[3] || '00';
          const min = partes[4] || '00';
          return `${dia}/${mes}/${anio} ${hora.padStart(2,'0')}:${min.padStart(2,'0')}`;
        }
        return "-";
      }
      return fecha.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch {
      return "-";
    }
  };

  const sortById = (arr) => [...arr].sort((a, b) => (a.id || 0) - (b.id || 0));

  const obtenerSeccionesOrden = (ot) => {
    const toArr = (v) => Array.isArray(v) ? v : (v && typeof v === 'object' ? [v] : []);

    const detalleRepuestos = ot.detalleRepuestos ? toArr(ot.detalleRepuestos) :
                             ot.detalleRepuesto  ? toArr(ot.detalleRepuesto) :
                             ot.detalle          ? toArr(ot.detalle) :
                             ot.detalles         ? toArr(ot.detalles) : [];
    const repuestos = sortById(
      Array.isArray(ot.repuestosOrden) ? ot.repuestosOrden :
      Array.isArray(ot.repuestos) ? ot.repuestos :
      Array.isArray(ot.repuesto) ? ot.repuesto : []
    );
    const trabajosTerceros = sortById(
      Array.isArray(ot.trabajosTerceros) ? ot.trabajosTerceros :
      Array.isArray(ot.trabajoTercero) ? ot.trabajoTercero :
      Array.isArray(ot.trabajosTercero) ? ot.trabajosTercero : []
    );

    return { detalleRepuestos, repuestos, trabajosTerceros };
  };

  const calcularMargenOt = (ot) => {
    const { detalleRepuestos, repuestos, trabajosTerceros } = obtenerSeccionesOrden(ot);

    // detalleRepuestos (mano de obra) es 100% margen: se suma el total completo
    const totalManoObra = detalleRepuestos.reduce((acc, d) => acc + Number(d.total || 0), 0);

    // repuestos y terceros: el margen es solo el recargo aplicado
    const sumaRecargosRepuestos = repuestos.reduce((acc, r) => {
      const valor = Number(r.valor || 0);
      const cantidad = Number(r.cantidad || 1);
      const recargo = Number(r.porcentajeRecargo || 0);
      return acc + (valor * cantidad * recargo / 100);
    }, 0);

    const sumaRecargosTerceros = trabajosTerceros.reduce((acc, tt) => {
      const valor = Number(tt.valorTercero || tt.valor || 0);
      const cantidad = Number(tt.cantidadTercero || tt.cantidad || 1);
      const recargo = Number(tt.porcentajeRecargoTercero || tt.porcentajeRecargo || 0);
      return acc + (valor * cantidad * recargo / 100);
    }, 0);

    return totalManoObra + sumaRecargosRepuestos + sumaRecargosTerceros;
  };

  const [ordenes, setOrdenes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [allVehiculos, setAllVehiculos] = useState([]);
  const [repuestos, setRepuestos] = useState([]);

  const [formData, setFormData] = useState({
    id: "",
    numeroOrden: "",
    habilitado: true,
    rutCliente: "",
    patenteVehiculo: "",
    kilometrajeVehiculoActual: "",
    codigo: "",
    valorOt: "",
    estado: "ABIERTA",
    observaciones: "",
    nivelCombustible: 0,
    idEmpresa: "",
    detalleRepuesto: null,
    repuestosOrden: [],
    trabajosTerceros: []
  });
  const [editMode, setEditMode] = useState(false);
  const [detalleTemp, setDetalleTemp] = useState({
    descripcion: "",
    valor: "",
    cantidad: 1,
    total: 0
  });
  const [repuestoOrdenTemp, setRepuestoOrdenTemp] = useState({
    descripcion: "",
    porcentajeRecargo: "",
    valor: "",
    total: "",
    cantidad: 1,
    prestadorServicio: ""
  });
  const [trabajoTerceroTemp, setTrabajoTerceroTemp] = useState({
    descripcionTercero: "",
    porcentajeRecargoTercero: "",
    valorTercero: "",
    totalTercero: "",
    prestadorServicioTercero: ""
  });
  const [detalleIndex, setDetalleIndex] = useState(0);
  const [repuestoOrdenIndex, setRepuestoOrdenIndex] = useState(0);
  const [trabajoTerceroIndex, setTrabajoTerceroIndex] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");

  // Modal para visualizar orden cerrada
  const [modalVisualizar, setModalVisualizar] = useState({
    open: false,
    orden: null
  });

  useEffect(() => {
    cargarOrdenes();
    cargarClientes();
    cargarVehiculos();
    cargarRepuestos();
  }, []);

  useEffect(() => {
    if (formData.rutCliente) {
      api.get(`/vehiculos/cliente/${formData.rutCliente}`)
        .then(res => setVehiculos(res.data))
        .catch(err => console.error(err));
    }
  }, [formData.rutCliente]);

  useEffect(() => {
    setFormData(prev => {
      const totalDetalle = prev.detalleRepuesto ? Number(prev.detalleRepuesto.total || 0) : 0;
      const totalGenerales = (prev.repuestosOrden || []).reduce((acc, d) => acc + Number(d.total || 0), 0);
      const totalTerceros = (prev.trabajosTerceros || []).reduce((acc, d) => acc + Number(d.totalTercero || 0), 0);
      const nuevoTotal = totalDetalle + totalGenerales + totalTerceros;
      if (prev.valorOt === nuevoTotal) return prev;
      return { ...prev, valorOt: nuevoTotal };
    });
  }, [formData.detalleRepuesto, formData.repuestosOrden, formData.trabajosTerceros]);

  useEffect(() => {
    const totalDetalle = Number(detalleTemp.cantidad || 0) * Number(detalleTemp.valor || 0);
    setDetalleTemp(prev => ({ ...prev, total: totalDetalle }));
  }, [detalleTemp.cantidad, detalleTemp.valor]);

  useEffect(() => {
    const base = Number(repuestoOrdenTemp.valor || 0) * Number(repuestoOrdenTemp.cantidad || 1);
    const recargo = (Number(repuestoOrdenTemp.porcentajeRecargo || 0) * base) / 100;
    const totalResult = base + recargo;
    if (repuestoOrdenTemp.total !== totalResult) {
       setRepuestoOrdenTemp(prev => ({ ...prev, total: totalResult }));
    }
  }, [repuestoOrdenTemp.valor, repuestoOrdenTemp.porcentajeRecargo, repuestoOrdenTemp.cantidad]);

  useEffect(() => {
    const base = Number(trabajoTerceroTemp.valorTercero || 0);
    const recargo = (Number(trabajoTerceroTemp.porcentajeRecargoTercero || 0) * base) / 100;
    const totalResult = base + recargo;
    if (trabajoTerceroTemp.totalTercero !== totalResult) {
      setTrabajoTerceroTemp(prev => ({ ...prev, totalTercero: totalResult }));
    }
  }, [trabajoTerceroTemp.valorTercero, trabajoTerceroTemp.porcentajeRecargoTercero]);

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
      .then(res => { setVehiculos(res.data); setAllVehiculos(res.data); })
      .catch(err => console.error(err));
  };

  const cargarRepuestos = () => {
    api.get("/repuesto/all")
      .then(res => setRepuestos(res.data))
      .catch(err => console.error(err));
  };

  const guardarOrden = () => {
    const payload = {
      ...formData,
      detalleRepuesto: formData.detalleRepuesto,
      repuestosOrden: formData.repuestosOrden || [],
      trabajosTerceros: formData.trabajosTerceros || []
    };
    
    if (editMode) {
      api.put("/ordenTrabajo/update", payload)
        .then(() => { cargarOrdenes(); resetForm(); mostrarExito("Orden actualizada exitosamente"); })
        .catch(err => { console.error(err); mostrarError("Error al actualizar orden"); });
    } else {
      api.post("/ordenTrabajo/insert", payload)
        .then(() => { cargarOrdenes(); resetForm(); mostrarExito("Orden creada exitosamente"); })
        .catch(err => { console.error(err); mostrarError("Error al crear orden"); });
    }
  };

   const normalizarOrdenParaEdicion = (orden) => {
    const dr = orden.detalleRepuesto || orden.detalleRepuestos || null;
    const detalleRepuesto = dr ? {
      id: dr.id,
      descripcion: dr.descripcion || "",
      valor: dr.valor || 0,
      cantidad: dr.cantidad || 1,
      total: dr.total || 0
    } : null;

    const repuestosOrdenRaw = orden.repuestosOrden || orden.trabajosGenerales || orden.trabajoGeneral || orden.trabajosGeneral || [];
    const trabajosTercerosRaw = orden.trabajosTerceros || orden.trabajoTercero || orden.trabajosTercero || [];

    const repuestosOrden = [...(Array.isArray(repuestosOrdenRaw) ? repuestosOrdenRaw : [])]
      .sort((a, b) => (a.id || 0) - (b.id || 0))
      .map(ro => ({
      descripcion: ro.descripcion || ro.descripcionGeneral || ro.descripcion || "",
      porcentajeRecargo: ro.porcentajeRecargo || ro.porcentajeRecargoGeneral || ro.porcentajeRecargo || "",
      valor: ro.valor || ro.valorGeneral || ro.valor || ro.monto || "",
      total: ro.total || ro.totalGeneral || ro.total || "",
      cantidad: ro.cantidad || ro.cantidadGeneral || 1,
      prestadorServicio: ro.prestadorServicio || ro.prestadorServicioGeneral || ro.prestadorServicio || ""
    }));

    const trabajosTerceros = [...(Array.isArray(trabajosTercerosRaw) ? trabajosTercerosRaw : [])]
      .sort((a, b) => (a.id || 0) - (b.id || 0))
      .map(tt => ({
      descripcionTercero: tt.descripcionTercero || tt.descripcion || "",
      porcentajeRecargoTercero: tt.porcentajeRecargoTercero || tt.porcentajeRecargo || "",
      valorTercero: tt.valorTercero || tt.valor || tt.monto || "",
      totalTercero: tt.total || tt.totalTercero || "",
      cantidadTercero: tt.cantidad || tt.cantidadTercero || 1,
      prestadorServicioTercero: tt.prestadorServicioTercero || tt.prestadorServicio || ""
    }));

    setFormData({
      id: orden.id,
      numeroOrden: orden.numeroOrden,
      habilitado: orden.habilitado,
      rutCliente: orden.rutCliente,
      patenteVehiculo: orden.patenteVehiculo,
      kilometrajeVehiculoActual: orden.kilometrajeVehiculoActual || "",
      codigo: orden.codigo,
      valorOt: orden.valorOt,
      estado: orden.estado,
      observaciones: orden.observaciones || "",
      nivelCombustible: orden.nivelCombustible || 0,
      idEmpresa: orden.empresa?.id || "",
      detalleRepuesto,
      repuestosOrden,
      trabajosTerceros
    });

    if (detalleRepuesto) {
      setDetalleTemp(detalleRepuesto);
    } else {
      setDetalleTemp({ descripcion: "", valor: "", cantidad: 1, total: 0 });
    }

    if ((repuestosOrden || []).length > 0) {
      setRepuestoOrdenIndex(0);
      setRepuestoOrdenTemp(repuestosOrden[0]);
    }
    if ((repuestosOrden || []).length === 0) {
      setRepuestoOrdenIndex(0);
      setRepuestoOrdenTemp({ descripcion: "", porcentajeRecargo: "", valor: "", prestadorServicio: "", total: "", cantidad: 1 });
    }
    if (trabajosTerceros.length > 0) {
      setTrabajoTerceroIndex(0);
      setTrabajoTerceroTemp(trabajosTerceros[0]);
    }
    if (trabajosTerceros.length === 0) {
      setTrabajoTerceroIndex(0);
      setTrabajoTerceroTemp({ descripcionTercero: "", porcentajeRecargoTercero: "", valorTercero: "", prestadorServicioTercero: "", totalTercero: "", cantidadTercero: 1 });
    }

    setEditMode(true);
  };

  const editarOrden = async (ot) => {
    let ordenCompleta = ot;
    const hasData = (v) => Array.isArray(v) ? v.length > 0 : !!v;
    const tieneDetalle = hasData(ot.detalleRepuesto) || hasData(ot.detalleRepuestos);

    if (!tieneDetalle && ot.id) {
      const endpoints = [
        `/ordenTrabajo/${ot.id}`,
        `/ordenTrabajo/id/${ot.id}`,
        `/ordenTrabajo/find/${ot.id}`
      ];

      for (const endpoint of endpoints) {
        try {
          const res = await api.get(endpoint);
          const data = Array.isArray(res.data) ? res.data[0] : res.data;
          if (data && data.id) {
            ordenCompleta = data;
            break;
          }
        } catch (error) {
          // intentar siguiente endpoint
        }
      }
    }

    normalizarOrdenParaEdicion(ordenCompleta);
  };

  const eliminarOrden = (ot) => {
    api.delete("/ordenTrabajo/delete", { data: { id: ot.id } })
      .then(() => { cargarOrdenes(); mostrarExito("Orden eliminada exitosamente"); })
      .catch(err => { console.error(err); mostrarError("Error al eliminar orden"); });
  };

  const abrirModalVisualizar = async (ot) => {
    let ordenCompleta = ot;
    const hasData = (v) => Array.isArray(v) ? v.length > 0 : !!v;
    const tieneDetalle = hasData(ot.detalleRepuesto) || hasData(ot.detalleRepuestos) || hasData(ot.detalle) || hasData(ot.detalles);
    if (!tieneDetalle && ot.id) {
      const endpoints = [
        `/ordenTrabajo/${ot.id}`,
        `/ordenTrabajo/id/${ot.id}`,
        `/ordenTrabajo/find/${ot.id}`
      ];
      for (const endpoint of endpoints) {
        try {
          const res = await api.get(endpoint);
          const data = Array.isArray(res.data) ? res.data[0] : res.data;
          if (data && data.id) {
            ordenCompleta = data;
            break;
          }
        } catch (error) {
          // intentar siguiente endpoint
        }
      }
    }
    setModalVisualizar({ open: true, orden: ordenCompleta });
  };

  const cerrarModalVisualizar = () => {
    setModalVisualizar({ open: false, orden: null });
  };

  const resetForm = () => {
    setFormData({
      id: "",
      numeroOrden: "",
      habilitado: true,
      rutCliente: "",
      patenteVehiculo: "",
      kilometrajeVehiculoActual: "",
      codigo: "",
      valorOt: "",
      estado: "ABIERTA",
      observaciones: "",
      nivelCombustible: 0,
      idEmpresa: "",
      detalleRepuesto: null,
      repuestosOrden: [],
      trabajosTerceros: []
    });
    setDetalleIndex(0);
    setRepuestoOrdenIndex(0);
    setTrabajoTerceroIndex(0);
    setDetalleTemp({ descripcion: "", valor: "", cantidad: 1, total: 0 });
    setRepuestoOrdenTemp({ descripcion: "", porcentajeRecargo: "", valor: "", cantidad: 1, prestadorServicio: "", total: "" });
    setTrabajoTerceroTemp({ descripcionTercero: "", porcentajeRecargoTercero: "", valorTercero: "", totalTercero: "", cantidadTercero: 1, prestadorServicioTercero: "" });
    setEditMode(false);
  };

  const actualizarDetalleTemp = (field, value) => {
    setDetalleTemp(prev => ({ ...prev, [field]: value }));
  };

  const actualizarRepuestoOrdenTemp = (field, value) => {
    setRepuestoOrdenTemp(prev => ({ ...prev, [field]: value }));
  };

  const actualizarTrabajoTerceroTemp = (field, value) => {
    setTrabajoTerceroTemp(prev => ({ ...prev, [field]: value }));
  };

  // --- Funciones de Modificación y Eliminación para Detalle Único ---
  const aplicarDetalle = () => {
    const base = Number(detalleTemp.cantidad || 1) * Number(detalleTemp.valor || 0);
    const nuevoDetalle = { ...detalleTemp, total: base };
    setFormData(prev => ({ ...prev, detalleRepuesto: nuevoDetalle }));
  };

  const eliminarDetalle = () => {
    setFormData(prev => ({ ...prev, detalleRepuesto: null }));
    setDetalleTemp({ descripcion: "", valor: "", cantidad: 1, total: 0 });
  };

  const prepararNuevoDetalle = () => {
    setDetalleTemp({ descripcion: "", valor: "", cantidad: 1, total: 0 });
  };

  const modificarRepuestoOrden = () => {
    if (repuestoOrdenIndex < 0 || repuestoOrdenIndex >= (formData.repuestosOrden || []).length) return;
    const base = Number(repuestoOrdenTemp.cantidad || 1) * Number(repuestoOrdenTemp.valor || 0);
    const recargo = (Number(repuestoOrdenTemp.porcentajeRecargo || 0) * base) / 100;
    const total = base + recargo;
    const objetoActualizado = { ...repuestoOrdenTemp, total };
    setFormData(prev => {
      const lista = [...(prev.repuestosOrden || [])];
      lista[repuestoOrdenIndex] = objetoActualizado;
      return { ...prev, repuestosOrden: lista };
    });
  };

  const eliminarRepuestoOrden = () => {
    if (repuestoOrdenIndex < 0 || repuestoOrdenIndex >= (formData.repuestosOrden || []).length) return;
    setFormData(prev => {
      const lista = (prev.repuestosOrden || []).filter((_, i) => i !== repuestoOrdenIndex);
      return { ...prev, repuestosOrden: lista };
    });
    setRepuestoOrdenIndex(0);
  };

  const prepararNuevoRepuestoOrden = () => {
    const repuestos = formData.repuestosOrden || [];
    setRepuestoOrdenIndex(repuestos.length);
    setRepuestoOrdenTemp({ descripcion: "", porcentajeRecargo: "", valor: "", prestadorServicio: "", total: "", cantidad: 1 });
  };

  const prepararNuevoTrabajoTercero = () => {
    const trabajos = formData.trabajosTerceros || [];
    setTrabajoTerceroIndex(trabajos.length);
    setTrabajoTerceroTemp({ descripcionTercero: "", porcentajeRecargoTercero: "", valorTercero: "", totalTercero: "", cantidadTercero: 1, prestadorServicioTercero: "" });
  };

  const modificarTrabajoTercero = () => {
    if (trabajoTerceroIndex < 0 || trabajoTerceroIndex >= (formData.trabajosTerceros || []).length) return;
    const base = Number(trabajoTerceroTemp.cantidadTercero || 1) * Number(trabajoTerceroTemp.valorTercero || 0);
    const recargo = (Number(trabajoTerceroTemp.porcentajeRecargoTercero || 0) * base) / 100;
    const totalTercero = base + recargo;
    const trabajoActualizado = { ...trabajoTerceroTemp, totalTercero };
    setFormData(prev => {
      const lista = [...(prev.trabajosTerceros || [])];
      lista[trabajoTerceroIndex] = trabajoActualizado;
      return { ...prev, trabajosTerceros: lista };
    });
  };

  const eliminarTrabajoTercero = () => {
    if (trabajoTerceroIndex < 0 || trabajoTerceroIndex >= (formData.trabajosTerceros || []).length) return;
    setFormData(prev => {
      const lista = (prev.trabajosTerceros || []).filter((_, i) => i !== trabajoTerceroIndex);
      return { ...prev, trabajosTerceros: lista };
    });
    setTrabajoTerceroIndex(0);
  };

  const irRepuestoOrdenAnterior = () => {
    if (repuestoOrdenIndex > 0) {
      const nextIndex = repuestoOrdenIndex - 1;
      setRepuestoOrdenIndex(nextIndex);
      setRepuestoOrdenTemp(formData.repuestosOrden[nextIndex]);
    }
  };

  const irRepuestoOrdenSiguiente = () => {
    if (repuestoOrdenIndex < (formData.repuestosOrden || []).length - 1) {
      const nextIndex = repuestoOrdenIndex + 1;
      setRepuestoOrdenIndex(nextIndex);
      setRepuestoOrdenTemp(formData.repuestosOrden[nextIndex]);
    }
  };

  const irTrabajoTerceroAnterior = () => {
    if (trabajoTerceroIndex > 0) {
      const nextIndex = trabajoTerceroIndex - 1;
      setTrabajoTerceroIndex(nextIndex);
      setTrabajoTerceroTemp(formData.trabajosTerceros[nextIndex]);
    }
  };

  const irTrabajoTerceroSiguiente = () => {
    if (trabajoTerceroIndex < (formData.trabajosTerceros || []).length - 1) {
      const nextIndex = trabajoTerceroIndex + 1;
      setTrabajoTerceroIndex(nextIndex);
      setTrabajoTerceroTemp(formData.trabajosTerceros[nextIndex]);
    }
  };

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getNombreCliente = (rutCliente) => {
    const c = clientes.find(c => c.rut === rutCliente);
    return c ? `${c.nombre} ${c.apellido}` : "-";
  };

  const getMarcaModelo = (patente) => {
    const v = allVehiculos.find(v => v.patente === patente);
    return v ? `${v.marca} ${v.modelo}` : "-";
  };

  const ordenesFiltradas = ordenes
    .filter((o) => {
      const nombreCliente = getNombreCliente(o.rutCliente);
      const marcaModelo = getMarcaModelo(o.patenteVehiculo);
      const texto = `${o.numeroOrden} ${o.rutCliente} ${nombreCliente} ${o.patenteVehiculo} ${marcaModelo} ${o.kilometrajeVehiculoActual || ""} ${o.valorOt} ${o.estado}`.toLowerCase();
      return texto.includes(search.toLowerCase());
    })
    .sort((a, b) => {
      // ABIERTA primero, CERRADO al final
      if (a.estado === "CERRADO" && b.estado !== "CERRADO") return 1;
      if (a.estado !== "CERRADO" && b.estado === "CERRADO") return -1;
      return 0;
    });

  const agregarRepuestoOrden = () => {
    const base = Number(repuestoOrdenTemp.cantidad || 1) * Number(repuestoOrdenTemp.valor);
    const recargo = (Number(repuestoOrdenTemp.porcentajeRecargo) * base) / 100;
    const total = base + recargo;

    const objetoNuevo = { ...repuestoOrdenTemp, total };

    setFormData(prev => ({
      ...prev,
      repuestosOrden: [...prev.repuestosOrden, objetoNuevo]
    }));

    setRepuestoOrdenIndex(formData.repuestosOrden.length);
    setRepuestoOrdenTemp({
      descripcion: "",
      porcentajeRecargo: "",
      valor: "",
      prestadorServicio: "",
      total: "",
      cantidad: 1
    });
  };

  const agregarTrabajoTercero = () => {
    const base = Number(trabajoTerceroTemp.cantidadTercero || 1) * Number(trabajoTerceroTemp.valorTercero);
    const recargo = (Number(trabajoTerceroTemp.porcentajeRecargoTercero) * base) / 100;
    const totalTercero = base + recargo;

    const nuevoTrabajo = { ...trabajoTerceroTemp, totalTercero };

    setFormData(prev => ({
      ...prev,
      trabajosTerceros: [...prev.trabajosTerceros, nuevoTrabajo]
    }));

    setTrabajoTerceroIndex(formData.trabajosTerceros.length);
    setTrabajoTerceroTemp({
      descripcionTercero: "",
      porcentajeRecargoTercero: "",
      valorTercero: "",
      prestadorServicioTercero: "",
      totalTercero: "",
      cantidadTercero: 1
    });
  };

  return (
    <Box sx={{ mt: 2, px: { xs: 1, sm: 2 }, maxWidth: 1400, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>Gestión de Órdenes de Trabajo</Typography>

      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 2, borderRadius: 2 }}>
        <Grid container spacing={2}>
          {/* Número Orden: oculto pero presente en el formulario (generado automáticamente) */}
          <Grid item xs={12} sm={6} md={4} sx={{ display: 'none' }}>
            <TextField
              fullWidth
              label="Número Orden"
              value={formData.numeroOrden || ""}
              onChange={e => setFormData({ ...formData, numeroOrden: e.target.value })}
              disabled
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Código"
              value={formData.codigo || ""}
              disabled
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Autocomplete
              fullWidth
              options={clientes}
              getOptionLabel={(c) => `${c.nombre} ${c.apellido} - ${formatearRut(c.rut)}`}
              value={clientes.find(c => c.rut === formData.rutCliente) || null}
              onChange={(event, newValue) => {
                setFormData({ ...formData, rutCliente: newValue ? newValue.rut : "", patenteVehiculo: "" });
              }}
              isOptionEqualToValue={(option, value) => option.rut === value.rut}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cliente"
                  placeholder="Buscar por nombre o RUT"
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Autocomplete
              fullWidth
              options={vehiculos.filter(v => v.rutDueno === formData.rutCliente)}
              getOptionLabel={(v) => `${v.marca} ${v.modelo} - ${v.patente}`}
              value={allVehiculos.find(v => v.patente === formData.patenteVehiculo) || null}
              onChange={(event, newValue) => {
                if (newValue) {
                  // Siempre registrar el dueño actual del vehículo como cliente de la orden
                  setFormData(prev => ({ ...prev, patenteVehiculo: newValue.patente, rutCliente: newValue.rutDueno }));
                } else {
                  setFormData(prev => ({ ...prev, patenteVehiculo: "" }));
                }
              }}
              isOptionEqualToValue={(option, value) => option.patente === value.patente}
              disabled={!formData.rutCliente}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Vehículo"
                  placeholder="Buscar por marca, modelo o patente"
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>

          {/* Fila 2 */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField label="Valor OT" value={formData.valorOt !== "" ? fmt(formData.valorOt) : ""}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth sx={selectFieldSx}>
              <InputLabel shrink>Estado</InputLabel>
              <Select
                value={formData.estado}
                label="Estado"
                onChange={e => setFormData({ ...formData, estado: e.target.value })}
              >
                <MenuItem value="ABIERTA">ABIERTA</MenuItem>
                <MenuItem value="CERRADO">CERRADO</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Fila 3 - Se mantiene kilometraje para no perder ese dato vital */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Kilometraje actual"
              type="number"
              value={formData.kilometrajeVehiculoActual}
              onChange={e => setFormData({ ...formData, kilometrajeVehiculoActual: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ px: 2, pt: 0.5 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Nivel de Combustible: {formData.nivelCombustible || 0}%
              </Typography>
              <Slider
                value={formData.nivelCombustible || 0}
                onChange={(e, val) => setFormData({ ...formData, nivelCombustible: val })}
                step={25}
                marks={[
                  { value: 0, label: 'E' },
                  { value: 25, label: '1/4' },
                  { value: 50, label: '1/2' },
                  { value: 75, label: '3/4' },
                  { value: 100, label: 'F' },
                ]}
                min={0}
                max={100}
                valueLabelDisplay="auto"
                color={
                  formData.nivelCombustible <= 25 ? "error" :
                    formData.nivelCombustible <= 50 ? "warning" : "success"
                }
              />
            </Box>
          </Grid>
        </Grid>

        {/* Observaciones (Mismo diseño de ancho completo que Descripción) */}
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            multiline
            minRows={6}
            maxRows={12}
            inputProps={{ maxLength: 4000 }}
            label="Solicitud de cliente"
            value={formData.observaciones || ""}
            onChange={e => setFormData({ ...formData, observaciones: e.target.value.toUpperCase() })}
            helperText={`${(formData.observaciones || '').length}/4000 caracteres`}
          />
        </Box>

        <Typography variant="h6" sx={{ mt: 2 }}>Detalle de Trabajo</Typography>
        <Box sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          {formData.detalleRepuesto && (
            <Button size="small" variant="contained" color="error" onClick={eliminarDetalle}>Limpiar Detalle</Button>
          )}
          <Button size="small" variant="outlined" color="primary" onClick={prepararNuevoDetalle} sx={{ ml: "auto" }}>Limpiar Campos</Button>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>Descripción Detallada (Formato Word)</Typography>
          <Box sx={{ "& .ql-container": { minHeight: "150px", fontSize: "1rem" }, "& .ql-editor": { textTransform: "uppercase" }, backgroundColor: "white" }}>
            <ReactQuill 
              theme="snow" 
              modules={quillModules}
              value={detalleTemp.descripcion} 
              onChange={val => actualizarDetalleTemp("descripcion", val)} 
            />
          </Box>
        </Box>
        <Grid container spacing={2} sx={{ mb: 1 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Valor Unitario" value={fmtDisplay(detalleTemp.valor)}
              onChange={e => actualizarDetalleTemp("valor", parseRaw(e.target.value))} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Cantidad" type="number" value={detalleTemp.cantidad}
              onChange={e => actualizarDetalleTemp("cantidad", e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Total" value={fmt(detalleTemp.total || 0)} slotProps={{ input: { readOnly: true } }} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button fullWidth variant="contained" color="success" sx={{ height: '100%', minHeight: 56 }} onClick={aplicarDetalle}>
              {formData.detalleRepuesto ? "Actualizar Detalle" : "Asignar a Orden"}
            </Button>
          </Grid>
        </Grid>

        {/* --- Sección Repuestos Orden --- */}
        <Typography variant="h6" sx={{ mt: 2 }}>Repuestos</Typography>
        <Box sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          {(formData.repuestosOrden || []).length > 0 && (
            <>
              <Button size="small" variant="outlined" onClick={irRepuestoOrdenAnterior} disabled={repuestoOrdenIndex === 0}>Anterior</Button>
              <Button size="small" variant="outlined" onClick={irRepuestoOrdenSiguiente} disabled={repuestoOrdenIndex >= (formData.repuestosOrden || []).length - 1}>Siguiente</Button>
              <Typography variant="body2" sx={{ mx: 1 }}>{repuestoOrdenIndex + 1} / {(formData.repuestosOrden || []).length}</Typography>
              <Button size="small" variant="contained" color="success" onClick={modificarRepuestoOrden}>Actualizar Item</Button>
              <Button size="small" variant="contained" color="error" onClick={eliminarRepuestoOrden}>Eliminar</Button>
            </>
          )}
          <Button size="small" variant="outlined" color="primary" onClick={prepararNuevoRepuestoOrden} sx={{ ml: "auto" }}>Limpiar / Nuevo</Button>
        </Box>
        <Box sx={{ mb: 2 }}>
          <TextField fullWidth multiline rows={2} label="Descripción" value={repuestoOrdenTemp.descripcion}
            onChange={e => actualizarRepuestoOrdenTemp("descripcion", e.target.value.toUpperCase())} />
        </Box>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={2}>
            <TextField fullWidth label="Cantidad" type="number" value={repuestoOrdenTemp.cantidad}
              onChange={e => actualizarRepuestoOrdenTemp("cantidad", e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField fullWidth label="Valor Unit." value={fmtDisplay(repuestoOrdenTemp.valor)}
              onChange={e => actualizarRepuestoOrdenTemp("valor", parseRaw(e.target.value))} />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField fullWidth label="Recargo (%)" value={repuestoOrdenTemp.porcentajeRecargo || ""}
              onChange={e => actualizarRepuestoOrdenTemp("porcentajeRecargo", e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField fullWidth label="Total Item" value={fmt(repuestoOrdenTemp.total || 0)} InputProps={{ readOnly: true }} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth label="Prestador Servicio" value={repuestoOrdenTemp.prestadorServicio}
              onChange={e => actualizarRepuestoOrdenTemp("prestadorServicio", e.target.value.toUpperCase())} />
          </Grid>
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button variant="outlined" color="primary" sx={{ height: 56, minWidth: 200 }} onClick={agregarRepuestoOrden}>Agregar Nuevo</Button>
          </Grid>
        </Grid>

        {/* --- Sección Trabajos Terceros --- */}
        <Typography variant="h6" sx={{ mt: 2 }}>Trabajos Terceros</Typography>
        <Box sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          {(formData.trabajosTerceros || []).length > 0 && (
            <>
              <Button size="small" variant="outlined" onClick={irTrabajoTerceroAnterior} disabled={trabajoTerceroIndex === 0}>Anterior</Button>
              <Button size="small" variant="outlined" onClick={irTrabajoTerceroSiguiente} disabled={trabajoTerceroIndex >= (formData.trabajosTerceros || []).length - 1}>Siguiente</Button>
              <Typography variant="body2" sx={{ mx: 1 }}>{trabajoTerceroIndex + 1} / {(formData.trabajosTerceros || []).length}</Typography>
              <Button size="small" variant="contained" color="success" onClick={modificarTrabajoTercero}>Actualizar Item</Button>
              <Button size="small" variant="contained" color="error" onClick={eliminarTrabajoTercero}>Eliminar</Button>
            </>
          )}
          <Button size="small" variant="outlined" color="primary" onClick={prepararNuevoTrabajoTercero} sx={{ ml: "auto" }}>Limpiar / Nuevo</Button>
        </Box>
        <Box sx={{ mb: 2 }}>
          <TextField fullWidth multiline rows={2} label="Descripción" value={trabajoTerceroTemp.descripcionTercero}
            onChange={e => actualizarTrabajoTerceroTemp("descripcionTercero", e.target.value.toUpperCase())} />
        </Box>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Recargo (%)" value={trabajoTerceroTemp.porcentajeRecargoTercero || ""}
              onChange={e => actualizarTrabajoTerceroTemp("porcentajeRecargoTercero", e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Valor" value={fmtDisplay(trabajoTerceroTemp.valorTercero)}
              onChange={e => actualizarTrabajoTerceroTemp("valorTercero", parseRaw(e.target.value))} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Total Item" value={fmt(trabajoTerceroTemp.totalTercero || 0)} InputProps={{ readOnly: true }} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Prestador Servicio" value={trabajoTerceroTemp.prestadorServicioTercero}
              onChange={e => actualizarTrabajoTerceroTemp("prestadorServicioTercero", e.target.value.toUpperCase())} />
          </Grid>
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button variant="outlined" color="primary" sx={{ height: 56, minWidth: 200 }} onClick={agregarTrabajoTercero}>Agregar Nuevo</Button>
          </Grid>
        </Grid>


        {formData.detalleRepuesto && (
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Detalle Trabajo Principal</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                 <TableRow sx={{ backgroundColor: 'action.hover' }}>
                     <TableCell>Descripción</TableCell>
                     <TableCell align="right">Cantidad</TableCell>
                     <TableCell align="right">Valor Unit.</TableCell>
                     <TableCell align="right">Total</TableCell>
                   </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <div 
                        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                        dangerouslySetInnerHTML={{ __html: formData.detalleRepuesto.descripcion }} 
                      />
                    </TableCell>
                    <TableCell align="right">{formData.detalleRepuesto.cantidad}</TableCell>
                    <TableCell align="right">${fmt(formData.detalleRepuesto.valor)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>${fmt(formData.detalleRepuesto.total)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {formData.repuestosOrden && formData.repuestosOrden.length > 0 && (
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Resumen Repuestos</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Prestador</TableCell>
                    <TableCell align="right">Valor Unit.</TableCell>
                    <TableCell align="right">Cant.</TableCell>
                    <TableCell align="right">Recargo (%)</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.repuestosOrden.map((ro, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{ro.descripcion}</TableCell>
                      <TableCell>{ro.prestadorServicio || "-"}</TableCell>
                      <TableCell align="right">${fmt(ro.valor)}</TableCell>
                      <TableCell align="right">{ro.cantidad || 1}</TableCell>
                      <TableCell align="right">{ro.porcentajeRecargo || 0}%</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>${fmt(ro.total)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell colSpan={5} align="right" sx={{ fontWeight: 'bold' }}>Total Repuestos:</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      ${fmt(formData.repuestosOrden.reduce((acc, curr) => acc + Number(curr.total || 0), 0))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {formData.trabajosTerceros && formData.trabajosTerceros.length > 0 && (
          <Box sx={{ mt: 3, mb: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Resumen Trabajos Terceros</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Prestador</TableCell>
                    <TableCell align="right">Valor Base</TableCell>
                    <TableCell align="right">Recargo (%)</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.trabajosTerceros.map((tt, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{tt.descripcionTercero}</TableCell>
                      <TableCell>{tt.prestadorServicioTercero || "-"}</TableCell>
                      <TableCell align="right">${fmt(tt.valorTercero)}</TableCell>
                      <TableCell align="right">{tt.porcentajeRecargoTercero || 0}%</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>${fmt(tt.totalTercero)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>Total Trabajos Terceros:</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      ${fmt(formData.trabajosTerceros.reduce((acc, curr) => acc + Number(curr.totalTercero || 0), 0))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}



        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button variant="contained" color="primary" onClick={guardarOrden}>
            {editMode ? "Actualizar Orden" : "Crear Orden"}
          </Button>
          {editMode && (
            <Button variant="outlined" color="secondary" onClick={resetForm}>
              Cancelar
            </Button>
          )}
        </Box>
      </Paper>

      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
        <Typography variant="h6">Lista de Órdenes de Trabajo</Typography>
        <TextField
          fullWidth
          label="Buscar orden"
          placeholder="Número, cliente, patente, kilometraje, valor o estado"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ mt: 2 }}
        />
        <TableContainer component={Paper} sx={{ mt: 2, borderRadius: 2, overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Número Orden</TableCell>
                <TableCell>Cliente (RUT)</TableCell>
                <TableCell>Nombre Cliente</TableCell>
                <TableCell>Vehículo</TableCell>
                <TableCell>Marca/Modelo</TableCell>
                <TableCell>Kilometraje</TableCell>
                <TableCell>Valor OT</TableCell>
                <TableCell>Fecha Creación</TableCell>
                <TableCell>Fecha Término</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ordenesFiltradas
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((o) => (
                  <TableRow
                    key={o.id}
                    sx={{
                      backgroundColor: o.estado === "CERRADO" ? "#ffebee" : "#e8f5e9"
                    }}
                  >
                    <TableCell>{o.numeroOrden}</TableCell>
                    <TableCell>{formatearRut(o.rutCliente)}</TableCell>
                    <TableCell>{getNombreCliente(o.rutCliente)}</TableCell>
                    <TableCell>{o.patenteVehiculo}</TableCell>
                    <TableCell>{getMarcaModelo(o.patenteVehiculo)}</TableCell>
                    <TableCell>{o.kilometrajeVehiculoActual ? fmt(o.kilometrajeVehiculoActual) : "-"}</TableCell>
                    <TableCell>${fmt(o.valorOt)}</TableCell>
                    <TableCell>
                      {o.fechaIngreso ? (() => {
        const fechaStr = o.fechaIngreso;
        if (!fechaStr || fechaStr.includes('null')) return '-';
        try {
          const fecha = new Date(fechaStr);
          if (isNaN(fecha.getTime())) {
            const partes = fechaStr.split(/[\/\s:]/);
            if (partes.length >= 3) {
              const dia = partes[0];
              const mes = partes[1] - 1;
              const anio = partes[2].length === 2 ? '20' + partes[2] : partes[2];
              const hora = partes[3] || '00';
              const min = partes[4] || '00';
              const seg = partes[5] || '00';
              return new Date(anio, mes, dia, hora, min, seg).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
            }
            return '-';
          }
          return fecha.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
        } catch {
          return '-';
        }
      })() : "-"}
                    </TableCell>
                    <TableCell>
                      {o.fechaCerrado ? (() => {
        const fechaStr = o.fechaCerrado;
        if (!fechaStr || fechaStr === 'null' || fechaStr === 'null') return '-';
        try {
          const fecha = new Date(fechaStr);
          if (isNaN(fecha.getTime())) {
            const partes = fechaStr.split(/[\/\s:]/);
            if (partes.length >= 3) {
              const dia = partes[0];
              const mes = partes[1] - 1;
              const anio = partes[2].length === 2 ? '20' + partes[2] : partes[2];
              const hora = partes[3] || '00';
              const min = partes[4] || '00';
              const seg = partes[5] || '00';
              return new Date(anio, mes, dia, hora, min, seg).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
            }
            return '-';
          }
          return fecha.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
        } catch {
          return '-';
        }
      })() : "-"}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        color: o.estado === "CERRADO" ? "error.main" : "success.main"
                      }}
                    >
                      {o.estado}
                    </TableCell>
                    <TableCell>
                      {o.estado === "CERRADO" ? (
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          onClick={() => abrirModalVisualizar(o)}
                        >
                          Visualizar
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="small"
                            onClick={() => editarOrden(o)}
                            sx={{ mr: 1 }}
                            variant="outlined"
                          >Editar</Button>
                          <Button size="small" color="error" onClick={() => eliminarOrden(o)} variant="contained">
                            Eliminar
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={ordenesFiltradas.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Órdenes por página"
        />
      </Paper>
      {notificacion}
      {/* Modal Visualizar Orden Cerrada */}
      <Dialog
        open={modalVisualizar.open}
        onClose={cerrarModalVisualizar}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { maxHeight: '90vh' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Orden de Trabajo {modalVisualizar.orden?.numeroOrden || ''}
          </Typography>
          <IconButton onClick={cerrarModalVisualizar} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ "&::-webkit-scrollbar": { display: "none" }, msOverflowStyle: "none", scrollbarWidth: "none" }}>
          {modalVisualizar.orden && (
            <Box>
              {/* Encabezado */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                <Box sx={{ flex: '1 1 200px' }}>
                  <Typography variant="body2" color="text.secondary">Cliente</Typography>
                  <Typography>{formatearRut(modalVisualizar.orden.rutCliente)}</Typography>
                  <Typography variant="body2" color="text.secondary">{getNombreCliente(modalVisualizar.orden.rutCliente)}</Typography>
                </Box>
                <Box sx={{ flex: '1 1 200px' }}>
                  <Typography variant="body2" color="text.secondary">Vehículo</Typography>
                  <Typography>{modalVisualizar.orden.patenteVehiculo}</Typography>
                  <Typography variant="body2" color="text.secondary">{getMarcaModelo(modalVisualizar.orden.patenteVehiculo)}</Typography>
                </Box>
                <Box sx={{ flex: '1 1 200px' }}>
                  <Typography variant="body2" color="text.secondary">Código</Typography>
                  <Typography>{modalVisualizar.orden.codigo || '-'}</Typography>
                </Box>
                <Box sx={{ flex: '1 1 200px' }}>
                  <Typography variant="body2" color="text.secondary">Estado</Typography>
                  <Chip
                    label={modalVisualizar.orden.estado}
                    color={modalVisualizar.orden.estado === "CERRADO" ? "error" : "success"}
                    size="small"
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Valor y Margen */}
              <Box sx={{ display: 'flex', gap: 4, mb: 2 }}>
                <Typography variant="h6">
                  Valor OT: ${modalVisualizar.orden.valorOt ? fmt(modalVisualizar.orden.valorOt) : '0'}
                </Typography>
                <Typography variant="body1" color="success.main" sx={{ fontWeight: 'bold' }}>
                  Margen OT: ${fmt(calcularMargenOt(modalVisualizar.orden))}
                </Typography>
              </Box>

              {/* Fecha Creación */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Fecha Creación</Typography>
                <Typography>
                  {(() => {
                    const fechaStr = modalVisualizar.orden.fechaIngreso;
                    if (!fechaStr || fechaStr.includes('null')) return '-';
                    try {
                      const fecha = new Date(fechaStr);
                      if (isNaN(fecha.getTime())) {
                        const partes = fechaStr.split(/[\/\s:]/);
                        if (partes.length >= 3) {
                          const d = partes[0].padStart(2,'0');
                          const m = partes[1].padStart(2,'0');
                          const a = partes[2];
                          const h = (partes[3] || '00').padStart(2,'0');
                          const min = (partes[4] || '00').padStart(2,'0');
                          return `${d}/${m}/${a} ${h}:${min}`;
                        }
                        return '-';
                      }
                      return fecha.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
                    } catch {
                      return '-';
                    }
                  })()}
                </Typography>
              </Box>

              {/* Observaciones */}
              {modalVisualizar.orden.observaciones && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Observaciones</Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {(() => {
                      const obs = modalVisualizar.orden.observaciones;
                      // Strip HTML简单
                      return obs.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').trim();
                    })()}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Trabajos Realizados (detalle) */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Trabajos Realizados</Typography>
                {(() => {
                  const { detalleRepuestos } = obtenerSeccionesOrden(modalVisualizar.orden);
                  if (!detalleRepuestos || detalleRepuestos.length === 0) {
                    return <Typography variant="body2" color="text.secondary">No hay trabajos registrados</Typography>;
                  }
                  return (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Descripción</TableCell>
                          <TableCell align="right">Valor</TableCell>
                          <TableCell align="right">Cant.</TableCell>
                          <TableCell align="right">Recargo</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detalleRepuestos.map((d, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <div
                                style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                                dangerouslySetInnerHTML={{ __html: d.descripcion || '-' }}
                              />
                            </TableCell>
                            <TableCell align="right">${fmt(d.valor || 0)}</TableCell>
                            <TableCell align="right">{d.cantidad || 1}</TableCell>
                            <TableCell align="right">{d.porcentajeRecargo ? d.porcentajeRecargo + '%' : '0%'}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>${fmt(d.total || 0)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>Total Mano de obra:</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            ${fmt(detalleRepuestos.reduce((acc, d) => acc + Number(d.total || 0), 0))}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  );
                })()}
              </Box>

              {/* Repuestos */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Repuestos</Typography>
                {(() => {
                  const { repuestos } = obtenerSeccionesOrden(modalVisualizar.orden);
                  if (!repuestos || repuestos.length === 0) {
                    return <Typography variant="body2" color="text.secondary">No hay repuestos registrados</Typography>;
                  }
                  return (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Descripción</TableCell>
                          <TableCell align="right">Cant.</TableCell>
                          <TableCell align="right">Valor Unit.</TableCell>
                          <TableCell align="right">Recargo</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {repuestos.map((r, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{r.descripcion || r.descripcionGeneral || '-'}</TableCell>
                            <TableCell align="right">{r.cantidadGeneral || r.cantidad || 1}</TableCell>
                            <TableCell align="right">${fmt(r.valor || r.valorGeneral || 0)}</TableCell>
                            <TableCell align="right">{((r.porcentajeRecargoGeneral ?? r.porcentajeRecargo) || 0) + '%'}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>${fmt(r.total || r.totalGeneral || 0)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>Total Repuestos:</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            ${fmt(repuestos.reduce((acc, r) => acc + Number(r.total || r.totalGeneral || 0), 0))}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  );
                })()}
              </Box>

              {/* Trabajos Terceros */}
              <Box sx={{ mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Trabajos Terceros</Typography>
                {(() => {
                  const { trabajosTerceros } = obtenerSeccionesOrden(modalVisualizar.orden);
                  if (!trabajosTerceros || trabajosTerceros.length === 0) {
                    return <Typography variant="body2" color="text.secondary">No hay trabajos terceros registrados</Typography>;
                  }
                  return (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Descripción</TableCell>
                          <TableCell align="right">Valor</TableCell>
                          <TableCell align="right">Recargo</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {trabajosTerceros.map((tt, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{tt.descripcionTercero || tt.descripcion || '-'}</TableCell>
                            <TableCell align="right">${fmt(tt.valorTercero || tt.valor || 0)}</TableCell>
                            <TableCell align="right">{((tt.porcentajeRecargoTercero ?? tt.porcentajeRecargo) || 0)}%</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>${fmt(tt.total || tt.totalTercero || 0)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>Total Trabajos Terceros:</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            ${fmt(trabajosTerceros.reduce((acc, tt) => acc + Number(tt.total || tt.totalTercero || 0), 0))}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  );
                })()}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarModalVisualizar}>Cerrar</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

export default OrdenTrabajoCRUD;
