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
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroPatente, setFiltroPatente] = useState("");

  useEffect(() => {
    api.get("/ordenTrabajo/all")
      .then(res => setOrdenes(res.data))
      .catch(err => console.error(err));
  }, []);

  // Filtrar por cliente o patente y ordenar (ABIERTA primero)
  const ordenesFiltradas = ordenes
    .filter(o =>
      (filtroCliente ? o.rutCliente.includes(filtroCliente) : true) &&
      (filtroPatente ? o.patenteVehiculo.includes(filtroPatente) : true)
    )
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

const obtenerSeccionesOrden = (ot) => {
  const detalleRepuestos = ot.detalleRepuestos || ot.detalleRepuesto || ot.detalle || ot.detalles || [];
  const repuestos = ot.repuestosOrden || ot.repuestos || ot.repuesto || [];
  const trabajosTerceros = ot.trabajosTerceros || ot.trabajoTercero || ot.trabajosTercero || [];

  return { detalleRepuestos, repuestos, trabajosTerceros };
};

const calcularMargenOt = (ot) => {
  const { detalleRepuestos, repuestos, trabajosTerceros } = obtenerSeccionesOrden(ot);
  
  const totalManoObra = detalleRepuestos.reduce((acc, d) => acc + Number(d.total || 0), 0);
  const totalRepuestos = repuestos.reduce((acc, r) => acc + Number(r.total || 0), 0);
  const totalTerceros = trabajosTerceros.reduce((acc, tt) => acc + Number(tt.total || tt.totalTercero || 0), 0);
  
  const sumaRecargosDetalle = detalleRepuestos.reduce((acc, d) => {
    const valor = Number(d.valor || 0);
    const cantidad = Number(d.cantidad || 1);
    const recargo = Number(d.porcentajeRecargo || 0);
    return acc + (valor * cantidad * recargo / 100);
  }, 0);
  
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
  
  const totalRecargos = sumaRecargosDetalle + sumaRecargosRepuestos + sumaRecargosTerceros;
  
  return totalManoObra + totalRecargos;
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
  // Fila 1
  doc.text(`Número Orden: ${ot.numeroOrden}`, 14, 35);
  doc.text(`Cliente: ${formatearRut(ot.rutCliente)}`, 75, 35);
  doc.text(`Vehículo: ${ot.patenteVehiculo}`, 120, 35);

  // Fila 2
  doc.text(`Código: ${ot.codigo}`, 14, 45);
  doc.text(`Valor OT: $${fmtPDF(ot.valorOt)}`, 75, 45);
  const margenOt = calcularMargenOt(ot);
  doc.setTextColor(0, 100, 0);
  doc.text(`Margen OT: $${fmtPDF(margenOt)}`, 120, 45);
  doc.setTextColor(0, 0, 0);
  doc.text(`Estado: ${ot.estado}`, 165, 45);

  // Gauge gráfico de combustible (esquina derecha del encabezado)
  const nivelCombustible = ot.nivelCombustible ?? ot.nivel_combustible ?? 0;
  dibujarGaugeCombustible(doc, 183, 40, 11, nivelCombustible);

  // Observaciones
  doc.setFontSize(11);
  const obsText = `Observaciones: ${ot.observaciones || "-"}`;
  const obsLines = doc.splitTextToSize(obsText, 150);
  doc.text(obsLines, 14, 55);
  doc.setFontSize(12);

  const startYRepuestos = 55 + (obsLines.length * 5) + 5;

  const detalles = detalleRepuestos.map(d => [
    d.descripcion || '-',
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

  doc.setFontSize(13);
  doc.text("Trabajos Realizados", 14, startYRepuestos);
  autoTable(doc, {
    startY: startYRepuestos + 5,
    head: [["Descripción", "Valor", "Cantidad", "Recargo (%)", "Total"]],
    body: detalles
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
    { content: `$${fmtPDF(totalRep)}`, styles: { fontStyle: 'bold' } }
  ]);

  doc.setFontSize(13);
  doc.text("Repuestos", 14, doc.lastAutoTable.finalY + 10);
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 15,
    head: [["Descripción", "Valor", "Recargo (%)", "Total"]],
    body: rep
  });

  const terceros = trabajosTerceros.map(tt => [
    tt.descripcionTercero || tt.descripcion || "",
    fmtPDF(tt.valorTercero || tt.valor || 0),
    tt.porcentajeRecargoTercero ?? tt.porcentajeRecargo ?? 0,
    `$${fmtPDF(tt.total || 0)}`
  ]);
  const totalTerceros = trabajosTerceros.reduce((acc, tt) => acc + Number(tt.total || tt.totalTercero || 0), 0);
  terceros.push([
    { content: "Total Trabajos Terceros:", colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
    { content: `$${fmtPDF(totalTerceros)}`, styles: { fontStyle: 'bold' } }
  ]);

  doc.setFontSize(13);
  doc.text("Trabajos Terceros", 14, doc.lastAutoTable.finalY + 10);
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 15,
    head: [["Descripción", "Valor", "Recargo (%)", "Total"]],
    body: terceros
  });

  doc.save(`OrdenTrabajo_Interna_${ot.numeroOrden}.pdf`);
};

  const generarPDF = (ot) => {
    const doc = new jsPDF();
    const { detalleRepuestos, repuestos, trabajosTerceros } = obtenerSeccionesOrden(ot);

    doc.setFontSize(16);
    doc.text("Reporte Orden de Trabajo", 14, 20);

    doc.setFontSize(12);
    // Fila 1
    doc.text(`Número Orden: ${ot.numeroOrden}`, 14, 35);
    doc.text(`Cliente: ${formatearRut(ot.rutCliente)}`, 75, 35);
    doc.text(`Vehículo: ${ot.patenteVehiculo}`, 120, 35);

    // Fila 2
    doc.text(`Código: ${ot.codigo}`, 14, 45);
    doc.text(`Valor OT: $${fmtPDF(ot.valorOt)}`, 75, 45);
    doc.text(`Estado: ${ot.estado}`, 120, 45);

    // Gauge gráfico de combustible (esquina derecha del encabezado)
    const nivelCombustible = ot.nivelCombustible ?? ot.nivel_combustible ?? 0;
    dibujarGaugeCombustible(doc, 183, 40, 11, nivelCombustible);

    // Observaciones
    doc.setFontSize(11);
    const obsText = `Observaciones: ${ot.observaciones || "-"}`;
    const obsLines = doc.splitTextToSize(obsText, 150);
    doc.text(obsLines, 14, 55);
    doc.setFontSize(12);

    const startYRepuestos = 55 + (obsLines.length * 5) + 5;

    const detalles = detalleRepuestos.map(d => [
      d.descripcion || '-',
      d.cantidad || 1,
      `$${fmtPDF(d.total || 0)}`
    ]);
    const totalRepuestos = detalleRepuestos.reduce((acc, d) => acc + Number(d.total || 0), 0);
    detalles.push([
      { content: "Total Mano de obra:", colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: `$${fmtPDF(totalRepuestos)}`, styles: { fontStyle: 'bold' } }
    ]);

    doc.setFontSize(13);
    doc.text("Trabajos Realizados", 14, startYRepuestos);
    autoTable(doc,{
      startY: startYRepuestos + 5,
      head: [["Descripción", "Cantidad", "Total"]],
      body: detalles
    });

    const rep = repuestos.map(r => [
      r.descripcion || "",
      `$${fmtPDF(r.total || 0)}`
    ]);
    const totalRep = repuestos.reduce((acc, r) => acc + Number(r.total || 0), 0);
    rep.push([
      { content: "Total Repuestos:", colSpan: 1, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: `$${fmtPDF(totalRep)}`, styles: { fontStyle: 'bold' } }
    ]);

    doc.setFontSize(13);
    doc.text("Repuestos", 14, doc.lastAutoTable.finalY + 10);
    autoTable(doc,{
      startY: doc.lastAutoTable.finalY + 15,
      head: [["Descripción", "Total"]],
      body: rep
    });

    const terceros = trabajosTerceros.map(tt => [
      tt.descripcionTercero || tt.descripcion || "",
      `$${fmtPDF(tt.total || 0)}`
    ]);
    const totalTerceros = trabajosTerceros.reduce((acc, tt) => acc + Number(tt.total || tt.totalTercero || 0), 0);
    terceros.push([
      { content: "Total Trabajos Terceros:", colSpan: 1, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: `$${fmtPDF(totalTerceros)}`, styles: { fontStyle: 'bold' } }
    ]);

    doc.setFontSize(13);
    doc.text("Trabajos Terceros", 14, doc.lastAutoTable.finalY + 10);
    autoTable(doc,{
      startY: doc.lastAutoTable.finalY + 15,
      head: [["Descripción", "Total"]],
      body: terceros
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
            <TableCell>Cliente</TableCell>
            <TableCell>Vehículo</TableCell>
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
              <TableCell>{o.patenteVehiculo}</TableCell>
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