import React, { useState } from "react";
import { Box, Button, TextField, Typography, Paper, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";

function Login() {
  const [users, setUsers] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users, pass })
      });
      
      if (!res.ok) throw new Error("Login failed");
      
      const data = await res.json();
      localStorage.setItem("user", JSON.stringify(data));
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Error al validar usuario. Revisa tus credenciales.");
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <Paper sx={{ p: 4, maxWidth: 400, width: '100%', borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
          Ingreso a Taller
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleLogin}>
          <TextField
            fullWidth
            margin="normal"
            label="Usuario"
            value={users}
            onChange={(e) => setUsers(e.target.value)}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Contraseña"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            required
          />
          <Button 
            type="submit" 
            fullWidth 
            variant="contained" 
            color="primary" 
            sx={{ mt: 3, mb: 1, height: 48 }}
          >
            Iniciar Sesión
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

export default Login;
