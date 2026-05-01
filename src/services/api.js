import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8080",
  // Evita que un JSON malformado (referencias circulares del backend) rompa las promesas.
  // Si el JSON falla, devuelve null — los callbacks no dependen del body de la respuesta.
  transformResponse: [(data) => {
    if (typeof data !== "string") return data;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }],
});

export default api;
