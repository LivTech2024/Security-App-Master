import { useEffect, useState } from "react";
import { useAuthState } from "../../store";
import { ILocationsCollection } from "../../@types/database";
import { MinimumQueryCharacter } from "../../@types/enum";
import DbCompany from "../../firebase_configs/DB/DbCompany";

interface Props {
  limit: number;
  searchQuery?: string | null;
}

const useFetchLocations = ({ limit, searchQuery }: Props) => {
  const [data, setData] = useState<ILocationsCollection[]>([]);

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
    const fetchInitialLocations = async () => {
      const snapshot = await DbCompany.getLocations({
        lmt: limit,
        lastDoc: null,
        searchQuery:
          searchQuery &&
          searchQuery.trim().length > MinimumQueryCharacter.LOCATION
            ? searchQuery.trim()
            : undefined,
        cmpId: company.CompanyId,
      });
      return snapshot.docs
        .map((doc) => {
          const data = doc.data() as ILocationsCollection;
          if (data) {
            return data;
          }
          return null;
        })
        .filter((item) => item !== null) as ILocationsCollection[];
    };

    try {
      fetchInitialLocations().then((arr) => {
        setData(arr);
      });
    } catch (error) {
      console.log(error);
    }
  }, [limit, company, searchQuery]);

  return { data };
};

export default useFetchLocations;
