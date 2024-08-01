import axios from 'axios';

const baseUrl = import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:3000';

export const getIpDetails = () => {
  return axios.get<{
    email: string;
    password: string;
    user_id: string;
    role: string;
  }>(`${baseUrl}/api/ip_detail`);
};
