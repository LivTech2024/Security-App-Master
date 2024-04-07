import axios from "axios";

const baseUrl = import.meta.env.VITE_SERVER_BASE_URL;

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
  password,
}: {
  email: string;
  password: string;
  userId: string;
}) => {
  return axios.put<{
    email: string;
    user_id: string;
    password: string;
  }>(`${baseUrl}/api/auth_user`, {
    email,
    password,
    user_id: userId,
  });
};

export const deleteAuthUser = (userId: string) => {
  return axios.delete(`${baseUrl}/api/auth_user/${userId}`);
};
