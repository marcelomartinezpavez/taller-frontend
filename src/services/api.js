import axios from "axios";

const api = axios.create({
  baseURL: "http://45.236.129.192:8080", // tu backend Spring Boot
  //baseURL: "http://localhost:8080",
});

export default api;