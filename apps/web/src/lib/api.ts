import axios from "axios";

/**
 * API Base URL Strategy:
 * 
 * The app is served through Nginx gateway which proxies:
 *   /api/* → backend:8000/*  (strips /api prefix)
 *   /*      → frontend:3000  
 *
 * So we always use relative /api path. This works for:
 * - http://localhost:8080  (local docker)
 * - https://sterility-glimmer-fruit.ngrok-free.dev  (ngrok)
 * - Any other domain as long as nginx is gateway
 *
 * NEVER use http://localhost:8000 directly because:
 * - It won't work from browser via ngrok
 * - CORS issues
 */
const API_URL = "/api";

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
        // Bypass ngrok browser warning page for AJAX requests
        "ngrok-skip-browser-warning": "69420",
    },
});

// Request interceptor — attach JWT token from localStorage
api.interceptors.request.use(
    (config) => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("token");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — handle 401 Unauthorized globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== "undefined") {
                // Clear stale auth data and redirect to login
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;