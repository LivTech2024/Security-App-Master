import { useEffect, useState } from 'react';
import { useAuthState } from '../../store';
import { MinimumQueryCharacter } from '../../@types/enum';
import { IClientsCollection } from '../../@types/database';
import DbClient from '../../firebase_configs/DB/DbClient';

interface Props {
  limit: number;
  searchQuery?: string | null;
}

const useFetchClients = ({ limit, searchQuery }: Props) => {
  const [data, setData] = useState<IClientsCollection[]>([]);

  const { company } = useAuthState();

  useEffect(() => {
    if (!company) return;

    if (
      searchQuery &&
      searchQuery.trim().length > 0 &&
      searchQuery.trim().length < MinimumQueryCharacter.LOCATION
    ) {
      return;
    }
    const fetchInitialClients = async () => {
      const snapshot = await DbClient.getClients({
        lmt: limit,
        lastDoc: null,
        searchQuery:
          searchQuery &&
          searchQuery.trim().length >= MinimumQueryCharacter.LOCATION
            ? searchQuery.trim()
            : undefined,
        cmpId: company.CompanyId,
      });
      return snapshot.docs
        .map((doc) => {
          const data = doc.data() as IClientsCollection;
          if (data) {
            return data;
          }
          return null;
        })
        .filter((item) => item !== null) as IClientsCollection[];
    };

    try {
      fetchInitialClients().then((arr) => {
        setData(arr);
      });
    } catch (error) {
      console.log(error);
    }
  }, [limit, company, searchQuery]);

  return { data };
};

export default useFetchClients;
