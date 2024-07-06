import { useNavigate } from 'react-router-dom';
import Button from '../../common/button/Button';
import PageHeader from '../../common/PageHeader';
import {
  DisplayCount,
  MinimumQueryCharacter,
  PageRoutes,
  REACT_QUERY_KEYS,
} from '../../@types/enum';
import { useEffect, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { useInfiniteQuery } from '@tanstack/react-query';
import DbSuperAdmin from '../../firebase_configs/DB/DbSuperAdmin';
import { DocumentData } from 'firebase/firestore';
import { ICompaniesCollection } from '../../@types/database';
import { useInView } from 'react-intersection-observer';
import SearchBar from '../../common/inputs/SearchBar';
import NoSearchResult from '../../common/NoSearchResult';
import TableShimmer from '../../common/shimmer/TableShimmer';

const CompanyList = () => {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');

  const [debouncedQuery] = useDebouncedValue(query, 200);

  const {
    data: snapshotData,
    fetchNextPage,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    isFetching,
    error,
  } = useInfiniteQuery({
    queryKey: [REACT_QUERY_KEYS.COMPANY_LIST, debouncedQuery],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbSuperAdmin.getCompanies({
        lmt: DisplayCount.COMPANY_LIST,
        lastDoc: pageParam,
        searchQuery: debouncedQuery,
      });
      return snapshot.docs;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage?.length === 0) {
        return null;
      }
      if (lastPage?.length === DisplayCount.COMPANY_LIST) {
        return lastPage.at(-1);
      }
      return null;
    },
    initialPageParam: null as null | DocumentData,
    enabled:
      debouncedQuery.trim().length > 0 &&
      debouncedQuery.trim().length < MinimumQueryCharacter.COMPANY
        ? false
        : true,
  });

  const [data, setData] = useState<ICompaniesCollection[]>(() => {
    if (snapshotData) {
      return snapshotData.pages.flatMap((page) =>
        page.map((doc) => doc.data() as ICompaniesCollection)
      );
    }
    return [];
  });

  useEffect(() => {
    console.log(error, 'error');
  }, [error]);

  // we are looping through the snapshot returned by react-query and converting them to data
  useEffect(() => {
    if (snapshotData) {
      const docData: ICompaniesCollection[] = [];
      snapshotData.pages?.forEach((page) => {
        page?.forEach((doc) => {
          const data = doc.data() as ICompaniesCollection;
          docData.push(data);
        });
      });
      setData(docData);
    }
  }, [snapshotData]);

  // hook for pagination
  const { ref, inView } = useInView();

  // this is for pagination
  useEffect(() => {
    if (inView && hasNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [fetchNextPage, inView, hasNextPage, isFetching]);
  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <PageHeader
        title="Companies"
        rightSection={
          <Button
            label="Create new company"
            type="black"
            onClick={() => navigate(PageRoutes.SUPER_ADMIN_CREATE_NEW_COMPANY)}
          />
        }
      />

      <div className="flex items-center bg-surface shadow p-4 rounded w-full justify-between">
        <SearchBar
          value={query}
          setValue={setQuery}
          placeholder="Search company"
        />
      </div>

      <table className="rounded overflow-hidden w-full">
        <thead className="bg-primary text-surface text-sm">
          <tr>
            <th className="uppercase px-4 py-2 w-[10%] text-start">Logo</th>
            <th className="uppercase px-4 py-2 w-[25%] text-start">
              Company Name
            </th>
            <th className="uppercase px-4 py-2 w-[20%] text-start">Email</th>

            <th className="uppercase px-4 py-2 w-[20%] text-start">Phone</th>
            <th className="uppercase px-4 py-2 w-[25%] text-end">Address</th>
          </tr>
        </thead>
        <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
          {data.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={5}>
                <NoSearchResult />
              </td>
            </tr>
          ) : (
            data.map((cmp) => {
              return (
                <tr
                  onClick={() =>
                    navigate(
                      PageRoutes.SUPER_ADMIN_CREATE_NEW_COMPANY +
                        `?cmp_id=${cmp.CompanyId}`
                    )
                  }
                  key={cmp.CompanyId}
                  className="cursor-pointer"
                >
                  <td className="align-top px-4 py-2 text-start">
                    <img
                      src={cmp.CompanyLogo}
                      alt="logo"
                      className="size-[80px]"
                    />
                  </td>
                  <td className="align-top px-4 py-2 text-start">
                    <span className="line-clamp-3">{cmp.CompanyName}</span>
                  </td>

                  <td className="align-top px-4 py-2 text-start">
                    <span className="line-clamp-2">{cmp.CompanyEmail}</span>
                  </td>
                  <td className="align-top px-4 py-2 text-start">
                    <span className="line-clamp-2">{cmp.CompanyPhone}</span>
                  </td>
                  <td className="align-top px-4 py-2 text-end">
                    <span className="line-clamp-2">{cmp.CompanyAddress}</span>
                  </td>
                </tr>
              );
            })
          )}
          <tr ref={ref}>
            <td colSpan={5}>
              {(isLoading || isFetchingNextPage) &&
                Array.from({ length: 10 }).map((_, idx) => (
                  <TableShimmer key={idx} />
                ))}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default CompanyList;
