import { useEffect, useState } from 'react';
import { useAuthState } from '../../store';
import { IEmployeesCollection } from '../../@types/database';
import DbEmployee from '../../firebase_configs/DB/DbEmployee';
import { QueryConstraint } from 'firebase/firestore';

interface Props {
  limit?: number;
  empRole?: string | null;
  searchQuery?: string | null;
  additionalQuery?: QueryConstraint[];
}

const useFetchEmployees = ({
  limit,
  searchQuery,
  empRole,
  additionalQuery,
}: Props) => {
  const [data, setData] = useState<IEmployeesCollection[]>([]);

  const { company } = useAuthState();

  useEffect(() => {
    if (!company) return;

    if (
      searchQuery &&
      searchQuery.trim().length > 0 &&
      searchQuery.trim().length < 1
    )
      return;
    const fetchInitialCategories = async () => {
      const snapshot = await DbEmployee.getEmployees({
        lmt: limit,
        lastDoc: null,
        searchQuery:
          searchQuery && searchQuery.trim().length >= 1
            ? searchQuery.trim()
            : undefined,
        cmpId: company.CompanyId,
        empRole: empRole,
        additionalQuery,
      });
      return snapshot.docs
        .map((doc) => {
          const data = doc.data() as IEmployeesCollection;
          if (data) {
            return data;
          }
          return null;
        })
        .filter((item) => item !== null) as IEmployeesCollection[];
    };

    try {
      fetchInitialCategories().then((arr) => {
        setData(arr);
      });
    } catch (error) {
      console.log(error);
    }
  }, [limit, company, searchQuery, empRole]);

  return { data };
};

export default useFetchEmployees;
