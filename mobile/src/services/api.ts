import axios from "axios";

// O endereço vem do .env (EXPO_PUBLIC_API_URL). No celular, "localhost" não funciona:
// precisa ser o IP do computador que roda o back-end, no mesmo Wi-Fi.
const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL
})

export { api }
