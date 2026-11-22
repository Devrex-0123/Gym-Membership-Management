import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000/api', // Your backend URL
});

// Add a request interceptor to attach the JWT token automatically
API.interceptors.request.use((req) => {
    const user = JSON.parse(localStorage.getItem('userInfo'));
    if (user?.token) {
        req.headers.Authorization = `Bearer ${user.token}`;
    }
    return req;
});

export default API;