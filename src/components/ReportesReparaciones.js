import React, { useEffect, useState } from "react";
import api from "../services/api";
import {
  Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  TextField, Button
} from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatearRut, validarRut } from "../utils/validar";


function ReportesReparaciones() {
  const [ordenes, setOrdenes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [allVehiculos, setAllVehiculos] = useState([]);
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroPatente, setFiltroPatente] = useState("");

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
  useEffect(() => {
    api.get("/ordenTrabajo/all").then(res => setOrdenes(res.data)).catch(err => console.error(err));
    api.get("/clientes/all").then(res => setClientes(res.data)).catch(err => console.error(err));
    api.get("/vehiculos/all").then(res => setAllVehiculos(res.data)).catch(err => console.error(err));
  }, []);

  const getNombreCliente = (rutCliente) => {
    const c = clientes.find(c => c.rut === rutCliente);
    return c ? `${c.nombre} ${c.apellido}` : "-";
  };

  const getMarcaModelo = (patente) => {
    const v = allVehiculos.find(v => v.patente === patente);
    return v ? `${v.marca} ${v.modelo}` : "-";
  };

  // Filtrar por cliente (RUT o nombre) o patente y ordenar (ABIERTA primero)
  const ordenesFiltradas = ordenes
    .filter(o => {
      const nombreCliente = getNombreCliente(o.rutCliente);
      return (filtroCliente
        ? o.rutCliente.includes(filtroCliente) || nombreCliente.toLowerCase().includes(filtroCliente.toLowerCase())
        : true) &&
        (filtroPatente ? o.patenteVehiculo.toUpperCase().includes(filtroPatente.toUpperCase()) : true);
    })
    .sort((a, b) => {
      if (a.estado === "ABIERTA" && b.estado !== "ABIERTA") return -1;
      if (a.estado !== "ABIERTA" && b.estado === "ABIERTA") return 1;
      return 0;
    });

  // Formatea números con separador de miles
  const fmt = (n) => {
    const num = Number(n);
    if (isNaN(num) || n === "" || n === null || n === undefined) return "-";
    return num.toLocaleString("es-CL");
  };

  // Versión para PDF (misma lógica, fuera del scope de React)
  const fmtPDF = (n) => {
    const num = Number(n);
    if (isNaN(num) || n === "" || n === null || n === undefined) return "-";
    return num.toLocaleString("es-CL");
  };

  // Convierte HTML enriquecido (ReactQuill) a texto plano respetando estructura
  const stripHtml = (html) => {
    if (!html) return '-';
    let t = html;
    // Listas con indentación (ReactQuill usa ql-indent-N)
    t = t.replace(/<li[^>]*class="[^"]*ql-indent-(\d+)[^"]*"[^>]*>/gi,
      (_, lvl) => '    '.repeat(Number(lvl)) + '• ');
    t = t.replace(/<li[^>]*>/gi, '• ');
    t = t.replace(/<\/li>/gi, '\n');
    // Párrafos y saltos
    t = t.replace(/<\/p>/gi, '\n');
    t = t.replace(/<br\s*\/?>/gi, '\n');
    t = t.replace(/<\/div>/gi, '\n');
    // Quitar etiquetas restantes
    t = t.replace(/<[^>]*>/g, '');
    // Decodificar entidades HTML
    t = t.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
         .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
         .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    return t.replace(/\n{3,}/g, '\n\n').trim() || '-';
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

// Dibuja un gauge semicircular de combustible usando primitivas jsPDF
// cx, cy = centro del semicírculo; r = radio (mm); nivel = 0..100
const dibujarGaugeCombustible = (doc, cx, cy, r, nivel) => {
  const pct = Math.max(0, Math.min(100, Number(nivel) || 0));
  // Ángulo: 180° (izq) → 0° (der), el gauge va de PI a 0
  // nivel 0% → aguja apunta a izquierda (180°), 100% → derecha (0°)
  const toRad = (deg) => (deg * Math.PI) / 180;

  // Segmentos de color del arco (en grados, 0=derecha, antihorario)
  // Dibujamos semicírculo de 180° en 4 segmentos con colores diferentes
  const segments = [
    { from: 180, to: 135, color: [220, 50, 50] },   // Rojo: E → 1/4
    { from: 135, to: 90,  color: [230, 140, 30] },  // Naranja: 1/4 → 1/2
    { from: 90,  to: 45,  color: [200, 200, 30] },  // Amarillo: 1/2 → 3/4
    { from: 45,  to: 0,   color: [40, 160, 60] },   // Verde: 3/4 → F
  ];

  const arcThick = r * 0.28; // grosor del arco
  const rOuter = r;
  const rInner = r - arcThick;

  // Función para trazar un arco via puntos (jsPDF no tiene arc nativo con fill sencillo)
  const arcPoints = (cx, cy, radius, startDeg, endDeg, steps = 20) => {
    const pts = [];
    const step = (endDeg - startDeg) / steps;
    for (let i = 0; i <= steps; i++) {
      const a = toRad(startDeg + i * step);
      pts.push([cx + radius * Math.cos(a), cy - radius * Math.sin(a)]);
    }
    return pts;
  };

  // Dibujar cada segmento coloreado
  segments.forEach(seg => {
    const outerPts = arcPoints(cx, cy, rOuter, seg.from, seg.to);
    const innerPts = arcPoints(cx, cy, rInner, seg.to, seg.from);
    const allPts = [...outerPts, ...innerPts];
    doc.setFillColor(...seg.color);
    doc.setDrawColor(...seg.color);
    doc.lines(
      allPts.slice(1).map((p, i) => [p[0] - allPts[i][0], p[1] - allPts[i][1]]),
      allPts[0][0], allPts[0][1],
      [1, 1], 'FD', true
    );
  });

  // Borde exterior del semicírculo
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.4);

  // Marcas y etiquetas
  const etiquetas = [
    { pct: 0,   label: 'E' },
    { pct: 25,  label: '1/4' },
    { pct: 50,  label: '1/2' },
    { pct: 75,  label: '3/4' },
    { pct: 100, label: 'F' },
  ];
  doc.setFontSize(6);
  doc.setTextColor(60, 60, 60);
  etiquetas.forEach(({ pct: p, label }) => {
    const angleDeg = 180 - (p / 100) * 180;
    const angleRad = toRad(angleDeg);
    // Tick exterior
    const tickOuter = rOuter + 1.5;
    const tickInner = rOuter - 0.5;
    doc.setDrawColor(80, 80, 80);
    doc.setLineWidth(0.5);
    doc.line(
      cx + tickInner * Math.cos(angleRad), cy - tickInner * Math.sin(angleRad),
      cx + tickOuter * Math.cos(angleRad), cy - tickOuter * Math.sin(angleRad)
    );
    // Etiqueta
    const labelR = rOuter + 4;
    const lx = cx + labelR * Math.cos(angleRad);
    const ly = cy - labelR * Math.sin(angleRad);
    doc.text(label, lx, ly, { align: 'center', baseline: 'middle' });
  });

  // Aguja
  const needleAngleDeg = 180 - (pct / 100) * 180;
  const needleAngleRad = toRad(needleAngleDeg);
  const needleLen = rInner * 0.9;
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.8);
  doc.line(
    cx, cy,
    cx + needleLen * Math.cos(needleAngleRad),
    cy - needleLen * Math.sin(needleAngleRad)
  );

  // Círculo central (hub)
  doc.setFillColor(50, 50, 50);
  doc.setDrawColor(50, 50, 50);
  doc.circle(cx, cy, 2, 'F');

  // Texto con porcentaje + etiqueta debajo del hub
  doc.setFontSize(7);
  doc.setTextColor(30, 30, 30);
  doc.text(`Combustible: ${pct}%`, cx, cy + 5, { align: 'center' });

  // Resetear colores
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
};

const generarPDFInterno = (ot) => {
  const doc = new jsPDF();
  const { detalleRepuestos, repuestos, trabajosTerceros } = obtenerSeccionesOrden(ot);

  doc.setFontSize(16);
  doc.text("Reporte Orden de Trabajo", 14, 20);
  doc.setFontSize(12);
  doc.text(`Fecha Creación: ${formatearFecha(ot.fechaIngreso)}`, 14, 30);

  // Fila 1
  doc.text(`Número Orden: ${ot.numeroOrden}`, 14, 40);
  doc.text(`Cliente: ${formatearRut(ot.rutCliente)}`, 75, 40);
  doc.text(`Vehículo: ${ot.patenteVehiculo}`, 130, 40);

  // Fila 1b - Nombre y Marca/Modelo
  doc.setFontSize(10);
  doc.text(`${getNombreCliente(ot.rutCliente)}`, 75, 47);
  doc.text(`${getMarcaModelo(ot.patenteVehiculo)}`, 130, 47);
  doc.setFontSize(12);

  // Fila 2
  doc.text(`Valor OT: $${fmtPDF(ot.valorOt)}`, 14, 55);
  const margenOt = calcularMargenOt(ot);
  doc.setTextColor(0, 100, 0);
  doc.text(`Margen OT: $${fmtPDF(margenOt)}`, 75, 55);
  doc.setTextColor(0, 0, 0);
  doc.text(`Estado: ${ot.estado}`, 130, 55);
  // Gauge gráfico de combustible (esquina derecha del encabezado)
  const nivelCombustible = ot.nivelCombustible ?? ot.nivel_combustible ?? 0;
  dibujarGaugeCombustible(doc, 183, 40, 11, nivelCombustible);

  // Observaciones
  doc.setFontSize(12);
  const obsText = `Observaciones: ${ot.observaciones || "-"}`;
  const obsLines = doc.splitTextToSize(obsText, 160);
  doc.text(obsLines, 14, 65);

  const startYRepuestos = 65 + (obsLines.length * 6) + 5;

  const detalles = detalleRepuestos.map(d => [
    stripHtml(d.descripcion),
    fmtPDF(d.valor || 0),
    d.cantidad || 1,
    (d.porcentajeRecargo ? d.porcentajeRecargo + "%" : "0%"),
    `$${fmtPDF(d.total || 0)}`
  ]);
  const totalRepuestos = detalleRepuestos.reduce((acc, d) => acc + Number(d.total || 0), 0);
  detalles.push([
    { content: "Total Mano de obra:", colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
    { content: `$${fmtPDF(totalRepuestos)}`, styles: { fontStyle: 'bold' } }
  ]);

  const tblMargin = { left: 14, right: 14 };
  const tblStyles = { overflow: 'linebreak', cellPadding: 3, fontSize: 10 };

  doc.setFontSize(13);
  doc.text("Trabajos Realizados", 14, startYRepuestos);
  autoTable(doc, {
    startY: startYRepuestos + 5,
    head: [["Descripción", "Valor", "Cantidad", "Recargo (%)", "Total"]],
    body: detalles,
    margin: tblMargin,
    styles: tblStyles,
    columnStyles: {
      0: { cellWidth: 86 },
      1: { cellWidth: 28, halign: 'right' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 28, halign: 'right' }
    }
  });

  const rep = repuestos.map(r => [
    r.descripcion || r.descripcionGeneral || "",
    fmtPDF(r.valor || r.valorGeneral || 0),
    (r.porcentajeRecargoGeneral ?? r.porcentajeRecargo ?? 0) + "%",
    `$${fmtPDF(r.total || 0)}`
  ]);
  const totalRep = repuestos.reduce((acc, r) => acc + Number(r.total || r.totalGeneral || 0), 0);
  rep.push([
    { content: "Total Repuestos:", colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
    { content: `$${fmtPDF(totalRep)}`, styles: { halign: 'right', fontStyle: 'bold' } }
  ]);

  doc.setFontSize(13);
  doc.text("Repuestos", 14, doc.lastAutoTable.finalY + 10);
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 15,
    head: [["Descripción", "Valor", "Recargo (%)", "Total"]],
    body: rep,
    margin: tblMargin,
    styles: tblStyles,
    columnStyles: {
      0: { cellWidth: 98 },
      1: { cellWidth: 28, halign: 'right' },
      2: { cellWidth: 28, halign: 'center' },
      3: { cellWidth: 28, halign: 'right' }
    }
  });

  const terceros = trabajosTerceros.map(tt => [
    tt.descripcionTercero || tt.descripcion || "",
    fmtPDF(tt.valorTercero || tt.valor || 0),
    (tt.porcentajeRecargoTercero ?? tt.porcentajeRecargo ?? 0) + "%",
    `$${fmtPDF(tt.total || tt.totalTercero || 0)}`
  ]);
  const totalTerceros = trabajosTerceros.reduce((acc, tt) => acc + Number(tt.total || tt.totalTercero || 0), 0);
  terceros.push([
    { content: "Total Trabajos Terceros:", colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
    { content: `$${fmtPDF(totalTerceros)}`, styles: { halign: 'right', fontStyle: 'bold' } }
  ]);

  doc.setFontSize(13);
  doc.text("Trabajos Terceros", 14, doc.lastAutoTable.finalY + 10);
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 15,
    head: [["Descripción", "Valor", "Recargo (%)", "Total"]],
    body: terceros,
    margin: tblMargin,
    styles: tblStyles,
    columnStyles: {
      0: { cellWidth: 98 },
      1: { cellWidth: 28, halign: 'right' },
      2: { cellWidth: 28, halign: 'center' },
      3: { cellWidth: 28, halign: 'right' }
    }
  });

  doc.save(`OrdenTrabajo_Interna_${ot.numeroOrden}.pdf`);
};

  const generarPDF = (ot) => {
    const doc = new jsPDF();
    const { detalleRepuestos, repuestos, trabajosTerceros } = obtenerSeccionesOrden(ot);

    doc.setFontSize(16);
    doc.text("Reporte Orden de Trabajo", 14, 20);
    doc.setFontSize(12);
    doc.text(`Fecha Creación: ${formatearFecha(ot.fechaIngreso)}`, 14, 30);

    // Fila 1
    doc.text(`Número Orden: ${ot.numeroOrden}`, 14, 40);
    doc.text(`Cliente: ${formatearRut(ot.rutCliente)}`, 75, 40);
    doc.text(`Vehículo: ${ot.patenteVehiculo}`, 130, 40);

    // Fila 1b - Nombre y Marca/Modelo
    doc.setFontSize(10);
    doc.text(`${getNombreCliente(ot.rutCliente)}`, 75, 47);
    doc.text(`${getMarcaModelo(ot.patenteVehiculo)}`, 130, 47);
    doc.setFontSize(12);

    // Fila 2
    doc.text(`Valor OT: $${fmtPDF(ot.valorOt)}`, 14, 55);
    doc.text(`Estado: ${ot.estado}`, 75, 55);
    // Gauge gráfico de combustible (esquina derecha del encabezado)
    const nivelCombustible = ot.nivelCombustible ?? ot.nivel_combustible ?? 0;
    dibujarGaugeCombustible(doc, 183, 40, 11, nivelCombustible);

    // Observaciones
    doc.setFontSize(12);
    const obsText = `Observaciones: ${ot.observaciones || "-"}`;
    const obsLines = doc.splitTextToSize(obsText, 160);
    doc.text(obsLines, 14, 65);

    const startYRepuestos = 65 + (obsLines.length * 6) + 5;

    const detalles = detalleRepuestos.map(d => [
      stripHtml(d.descripcion),
      d.cantidad || 1,
      `$${fmtPDF(d.total || 0)}`
    ]);
    const totalRepuestos = detalleRepuestos.reduce((acc, d) => acc + Number(d.total || 0), 0);
    detalles.push([
      { content: "Total Mano de obra:", colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: `$${fmtPDF(totalRepuestos)}`, styles: { fontStyle: 'bold' } }
    ]);

    const tblMargin = { left: 14, right: 14 };
    const tblStyles = { overflow: 'linebreak', cellPadding: 3, fontSize: 10 };

    doc.setFontSize(13);
    doc.text("Trabajos Realizados", 14, startYRepuestos);
    autoTable(doc, {
      startY: startYRepuestos + 5,
      head: [["Descripción", "Cantidad", "Total"]],
      body: detalles,
      margin: tblMargin,
      styles: tblStyles,
      columnStyles: {
        0: { cellWidth: 136 },
        1: { cellWidth: 18, halign: 'center' },
        2: { cellWidth: 28, halign: 'right' }
      }
    });

    const rep = repuestos.map(r => [
      r.descripcion || "",
      `$${fmtPDF(r.total || 0)}`
    ]);
    const totalRep = repuestos.reduce((acc, r) => acc + Number(r.total || 0), 0);
    rep.push([
      { content: "Total Repuestos:", colSpan: 1, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: `$${fmtPDF(totalRep)}`, styles: { halign: 'right', fontStyle: 'bold' } }
    ]);

    doc.setFontSize(13);
    doc.text("Repuestos", 14, doc.lastAutoTable.finalY + 10);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [["Descripción", "Total"]],
      body: rep,
      margin: tblMargin,
      styles: tblStyles,
      columnStyles: {
        0: { cellWidth: 154 },
        1: { cellWidth: 28, halign: 'right' }
      }
    });

    const terceros = trabajosTerceros.map(tt => [
      tt.descripcionTercero || tt.descripcion || "",
      `$${fmtPDF(tt.total || tt.totalTercero || 0)}`
    ]);
    const totalTerceros = trabajosTerceros.reduce((acc, tt) => acc + Number(tt.total || tt.totalTercero || 0), 0);
    terceros.push([
      { content: "Total Trabajos Terceros:", colSpan: 1, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: `$${fmtPDF(totalTerceros)}`, styles: { halign: 'right', fontStyle: 'bold' } }
    ]);

    doc.setFontSize(13);
    doc.text("Trabajos Terceros", 14, doc.lastAutoTable.finalY + 10);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [["Descripción", "Total"]],
      body: terceros,
      margin: tblMargin,
      styles: tblStyles,
      columnStyles: {
        0: { cellWidth: 154 },
        1: { cellWidth: 28, halign: 'right' }
      }
    });

    doc.save(`OrdenTrabajo_${ot.numeroOrden}.pdf`);
  };

  return (
    <Paper sx={{ padding: 2, marginTop: 2 }}>
      <Typography variant="h5">Reportes de Órdenes de Trabajo</Typography>

      {/* Filtros */}
      <TextField
        label="Filtrar por Cliente (RUT)"
        value={filtroCliente}
        onChange={e => setFiltroCliente(e.target.value)}
        sx={{ mr: 2, mt: 2 }}
      />
      <TextField
        label="Filtrar por Patente"
        value={filtroPatente}
        onChange={e => setFiltroPatente(e.target.value)}
        sx={{ mt: 2 }}
      />

      {/* Tabla de órdenes */}
      <Table sx={{ mt: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell>Número Orden</TableCell>
            <TableCell>Cliente (RUT)</TableCell>
            <TableCell>Nombre Cliente</TableCell>
            <TableCell>Vehículo</TableCell>
            <TableCell>Marca/Modelo</TableCell>
            <TableCell>Fecha Creación</TableCell>
            <TableCell>Código</TableCell>
            <TableCell>Valor OT</TableCell>
            <TableCell>Margen OT</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>OT</TableCell>
            <TableCell>OT Interna</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ordenesFiltradas.map(o => (
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
              <TableCell>{formatearFecha(o.fechaIngreso)}</TableCell>
               <TableCell>{o.codigo}</TableCell>
              <TableCell>${fmt(o.valorOt)}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: o.estado === "CERRADO" ? "error.main" : "success.main" }}>
                ${fmt(calcularMargenOt(o))}
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: o.estado === "CERRADO" ? "error.main" : "success.main" }}>
                {o.estado}
              </TableCell>
              <TableCell>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => generarPDF(o)}
                >
                  Generar PDF
                </Button>
              </TableCell>
              <TableCell>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => generarPDFInterno(o)}
                >
                  Generar PDF Interno
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

export default ReportesReparaciones;

