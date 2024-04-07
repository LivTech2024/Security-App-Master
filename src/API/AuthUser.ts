import axios from "axios";

const baseUrl = import.meta.env.VITE_SERVER_BASE_URL;

//const baseUrl = "http://localhost:3000";

export const createAuthUser = ({
  email,
  password,
  role,
  userId,
}: {
  email: string;
  password: string;
  userId: string;
  role: "employee" | "client";
}) => {
  return axios.post<{
    email: string;
    password: string;
    user_id: string;
    role: string;
  }>(`${baseUrl}/api/auth_user`, {
    email,
    password,
    user_id: userId,
    role,
  });
};

export const updateAuthUser = ({
  email,
  userId,
}: {
  email: string;
  userId: string;
}) => {
  return axios.put<{
    email: string;
    user_id: string;
  }>(`${baseUrl}/api/auth_user`, {
    email,
    user_id: userId,
  });
};

export const deleteAuthUser = (userId: string) => {
  return axios.delete(`${baseUrl}/api/auth_user/${userId}`);
};
