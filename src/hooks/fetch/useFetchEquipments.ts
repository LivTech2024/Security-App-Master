import { useEffect, useState } from "react";
import { useAuthState } from "../../store";
import { IEquipmentsCollection } from "../../@types/database";
import DbEquipment from "../../firebase_configs/DB/DbEquipment";

interface Props {
  limit?: number;
  searchQuery?: string | null;
}

const useFetchEquipments = ({ limit, searchQuery }: Props) => {
  const [data, setData] = useState<IEquipmentsCollection[]>([]);

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
      const snapshot = await DbEquipment.getEquipments({
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
          const data = doc.data() as IEquipmentsCollection;
          if (data) {
            return data;
          }
          return null;
        })
        .filter((item) => item !== null) as IEquipmentsCollection[];
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

export default useFetchEquipments;
