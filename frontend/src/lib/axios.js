import axios from "axios";

const axiosInstance = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? "https://real-time-chat-app-ia9k.onrender.com/api"||"http://localhost:5001/api"
      : `${import.meta.env.VITE_BACKEND_URL}/api`,
  withCredentials: true,
});

export default axiosInstance;
