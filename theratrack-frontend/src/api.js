// src/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000", // your Django backend
  withCredentials: true, // important for session cookies
});

export default API;
