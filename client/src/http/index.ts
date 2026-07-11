import axios from "axios"

const SERVER_URL = import.meta.env.VITE_SERVER_URL as string

// For Unauthenticated Requests
export const API = axios.create({
      baseURL: SERVER_URL,
      withCredentials: true,
      headers:{
            "Content-Type": "application/json",
            "Accept": "application/json"
      }
})

// For Authenticated Requests
export const APIAuthenticated = axios.create({
      baseURL: SERVER_URL,
      withCredentials: true,
      headers:{
            "Content-Type": "application/json",
            "Accept": "application/json",
      }
})

// Interceptor to add the Authorization header to every request if the token is available in localStorage
APIAuthenticated.interceptors.request.use((config) => {
      const token = typeof window !== "undefined" && localStorage ? localStorage.getItem("token") : null;
      if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
      }

      // If the request data is of type FormData, set the Content-Type header to multipart/form-data
      if(config.data instanceof FormData){
            delete config.headers["Content-Type"];
      }

      return config;
},
(error) => {
      return Promise.reject(error);
})
