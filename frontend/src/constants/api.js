// "phone" builds are served by the backend itself, so API calls are same-origin
const API_BASE_URL =
  import.meta.env.MODE === "phone"
    ? ""
    : import.meta.env.VITE_API_URL || "http://localhost:5000";

export default API_BASE_URL;
