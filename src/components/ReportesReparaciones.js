import React, { useEffect, useState } from "react";
import api from "../services/api";
import {
  Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  TextField, Button
} from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


function ReportesReparaciones() {
  const [ordenes, setOrdenes] = useState([]);
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroPatente, setFiltroPatente] = useState("");

  useEffect(() => {
    api.get("/ordenTrabajo/all")
      .then(res => setOrdenes(res.data))
      .catch(err => console.error(err));
  }, []);

  // Filtrar por cliente o patente
  const ordenesFiltradas = ordenes.filter(o =>
    (filtroCliente ? o.rutCliente.includes(filtroCliente) : true) &&
    (filtroPatente ? o.patenteVehiculo.includes(filtroPatente) : true)
  );


const generarPDFInterno = (ot) => {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Reporte Orden de Trabajo", 14, 20);

  doc.setFontSize(12);
  doc.text(`Número Orden: ${ot.numeroOrden}`, 14, 30);
  doc.text(`Cliente: ${ot.rutCliente}`, 14, 40);
  doc.text(`Vehículo: ${ot.patenteVehiculo}`, 14, 50);
  doc.text(`Código: ${ot.codigo}`, 14, 60);
  doc.text(`Valor OT: ${ot.valorOt}`, 14, 70);
  doc.text(`Estado: ${ot.estado}`, 14, 80);

  // Tabla de detalles con recargo
  const detalles = ot.detalle?.map(d => [
    d.descripcion,
    d.valor,
    d.cantidad,
    d.porcentajeRecargo ? d.porcentajeRecargo + "%" : "0%",
    d.total
  ]) || [];

  autoTable(doc, {
    startY: 90,
    head: [["Descripción", "Valor", "Cantidad", "Recargo (%)", "Total"]],
    body: detalles
  });

  doc.save(`OrdenTrabajo_Interna_${ot.numeroOrden}.pdf`);
};

  // Generar PDF de una OT
  const generarPDF = (ot) => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Reporte Orden de Trabajo", 14, 20);

    doc.setFontSize(12);
    doc.text(`Número Orden: ${ot.numeroOrden}`, 14, 30);
    doc.text(`Cliente: ${ot.rutCliente}`, 14, 40);
    doc.text(`Vehículo: ${ot.patenteVehiculo}`, 14, 50);
    doc.text(`Código: ${ot.codigo}`, 14, 60);
    doc.text(`Valor OT: ${ot.valorOt}`, 14, 70);
    doc.text(`Estado: ${ot.estado}`, 14, 80);

    // Tabla de detalles
    const detalles = ot.detalle?.map(d => [
      d.descripcion,
      //d.valor,
      d.cantidad,
      d.total//,
      //d.repuesto_id ? d.repuesto_id : "Sin repuesto"
    ]) || [];

    autoTable(doc,{
      startY: 90,
      head: [["Descripción", "Cantidad", "Total"]],//, "Repuesto"]],
      body: detalles
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
            <TableCell>Estado</TableCell>
            <TableCell>OT</TableCell>
            <TableCell>OT Interna</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ordenesFiltradas.map(o => (
            <TableRow key={o.id}>
              <TableCell>{o.numeroOrden}</TableCell>
              <TableCell>{o.rutCliente}</TableCell>
              <TableCell>{o.patenteVehiculo}</TableCell>
              <TableCell>{o.codigo}</TableCell>
              <TableCell>{o.valorOt}</TableCell>
              <TableCell>{o.estado}</TableCell>
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