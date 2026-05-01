import { useState } from "react";
import { Snackbar, Alert } from "@mui/material";

export function useNotificacion() {
  const [snack, setSnack] = useState({ open: false, mensaje: "", severity: "success" });

  const mostrarExito = (mensaje) => setSnack({ open: true, mensaje, severity: "success" });
  const mostrarError = (mensaje) => setSnack({ open: true, mensaje: mensaje || "Ocurrió un error", severity: "error" });

  const cerrar = (_, reason) => {
    if (reason === "clickaway") return;
    setSnack(prev => ({ ...prev, open: false }));
  };

  const notificacion = (
    <Snackbar
      open={snack.open}
      autoHideDuration={4000}
      onClose={cerrar}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert onClose={cerrar} severity={snack.severity} variant="filled" sx={{ width: "100%" }}>
        {snack.mensaje}
      </Alert>
    </Snackbar>
  );

  return { mostrarExito, mostrarError, notificacion };
}
