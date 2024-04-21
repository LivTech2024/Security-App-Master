import { useEffect, useState } from 'react';
import { useAuthState } from '../../store';
import { IEmployeesCollection } from '../../@types/database';
import DbClient from '../../firebase_configs/DB/DbClient';

const useFetchClientEmployees = () => {
  const [data, setData] = useState<IEmployeesCollection[]>([]);

  const { client } = useAuthState();

  useEffect(() => {
    if (!client) return;

    const fetchInitialEmployees = async () => {
      try {
        const employees = await DbClient.getClientEmployees(client.ClientId);
        return employees;
      } catch (error) {
        console.log(error, 'error in hook');
        return [];
      }
    };

    try {
      fetchInitialEmployees().then((arr) => {
        setData(arr);
      });
    } catch (error) {
      console.log(error);
    }
  }, [client]);

  return { data };
};

export default useFetchClientEmployees;
