import { useEffect, useState } from 'react';
import { useAuthState } from '../../store';
import { IKeysCollection } from '../../@types/database';
import DbAssets from '../../firebase_configs/DB/DbAssets';

interface Props {
  limit?: number;
  searchQuery?: string | null;
}

const useFetchKeys = ({ limit, searchQuery }: Props) => {
  const [data, setData] = useState<IKeysCollection[]>([]);

  const { company } = useAuthState();

  useEffect(() => {
    if (!company) return;

    if (
      searchQuery &&
      searchQuery.trim().length > 0 &&
      searchQuery.trim().length < 1
    )
      return;
    const fetchInitialEquipments = async () => {
      const snapshot = await DbAssets.getKeys({
        lmt: limit,
        lastDoc: null,
        searchQuery:
          searchQuery && searchQuery.trim().length > 1
            ? searchQuery.trim()
            : undefined,
        cmpId: company.CompanyId,
      });
      return snapshot.docs
        .map((doc) => {
          const data = doc.data() as IKeysCollection;
          if (data) {
            return data;
          }
          return null;
        })
        .filter((item) => item !== null) as IKeysCollection[];
    };

    try {
      fetchInitialEquipments().then((arr) => {
        setData(arr);
      });
    } catch (error) {
      console.log(error);
    }
  }, [limit, company, searchQuery]);

  return { data };
};

export default useFetchKeys;
