import { useEffect, useState } from 'react';
import Button from '../../common/button/Button';
import PageHeader from '../../common/PageHeader';
import CreateEmergProtocolModal from '../../component/emergency_response/modal/CreateEmergProtocolModal';
import { useAuthState, useEditFormStore } from '../../store';
import { useDebouncedValue } from '@mantine/hooks';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  DisplayCount,
  MinimumQueryCharacter,
  REACT_QUERY_KEYS,
} from '../../@types/enum';
import { DocumentData } from 'firebase/firestore';
import { IEmergencyProtocolsCollection } from '../../@types/database';
import DbCompany from '../../firebase_configs/DB/DbCompany';
import { useInView } from 'react-intersection-observer';
import SearchBar from '../../common/inputs/SearchBar';
import NoSearchResult from '../../common/NoSearchResult';
import TableShimmer from '../../common/shimmer/TableShimmer';

const EmergResList = () => {
  const [createEmergProtocolModal, setCreateEmergProtocolModal] =
    useState(false);

  const { company } = useAuthState();

  const { setEmergProtocolEditData } = useEditFormStore();

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
    queryKey: [
      REACT_QUERY_KEYS.EMERG_PROTOCOLS_LIST,
      debouncedQuery,
      company!.CompanyId,
    ],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbCompany.getEmergProtocols({
        lmt: DisplayCount.EMERG_PROTOCOLS_LIST,
        lastDoc: pageParam,
        searchQuery: debouncedQuery,
        cmpId: company!.CompanyId,
      });
      return snapshot.docs;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage?.length === 0) {
        return null;
      }
      if (lastPage?.length === DisplayCount.EMERG_PROTOCOLS_LIST) {
        return lastPage.at(-1);
      }
      return null;
    },
    initialPageParam: null as null | DocumentData,
    enabled:
      debouncedQuery.trim().length > 0 &&
      debouncedQuery.trim().length < MinimumQueryCharacter.EMERG_PROTOCOLS
        ? false
        : true,
  });

  const [data, setData] = useState<IEmergencyProtocolsCollection[]>(() => {
    if (snapshotData) {
      return snapshotData.pages.flatMap((page) =>
        page.map((doc) => doc.data() as IEmergencyProtocolsCollection)
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
      const docData: IEmergencyProtocolsCollection[] = [];
      snapshotData.pages?.forEach((page) => {
        page?.forEach((doc) => {
          const data = doc.data() as IEmergencyProtocolsCollection;
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
        title="Emergency Response"
        rightSection={
          <Button
            label="Create new emergency protocol"
            type="black"
            onClick={() => {
              setEmergProtocolEditData(null);
              setCreateEmergProtocolModal(true);
            }}
          />
        }
      />
      <CreateEmergProtocolModal
        opened={createEmergProtocolModal}
        setOpened={setCreateEmergProtocolModal}
      />

      <div className="flex items-center bg-surface shadow p-4 rounded w-full justify-between">
        <SearchBar
          value={query}
          setValue={setQuery}
          placeholder="Search protocol"
        />
      </div>

      <table className="rounded overflow-hidden w-full">
        <thead className="bg-primary text-surface text-sm">
          <tr>
            <th className="uppercase px-4 py-2 w-[30%] text-start">Title</th>
            <th className="uppercase px-4 py-2 w-[60%] text-start">
              Description
            </th>
            <th className="uppercase px-4 py-2 w-[10%] text-end">video</th>
          </tr>
        </thead>
        <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
          {data.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={3}>
                <NoSearchResult text="No employee" />
              </td>
            </tr>
          ) : (
            data.map((protocol) => {
              return (
                <tr key={protocol.EmergProtocolId} className="cursor-pointer">
                  <td
                    onClick={() => {
                      setEmergProtocolEditData(protocol);
                      setCreateEmergProtocolModal(true);
                    }}
                    className="align-top px-4 py-2 text-start"
                  >
                    <span className="line-clamp-1">
                      {protocol.EmergProtocolTitle}
                    </span>
                  </td>
                  <td
                    onClick={() => {
                      setEmergProtocolEditData(protocol);
                      setCreateEmergProtocolModal(true);
                    }}
                    className="align-top px-4 py-2 text-start"
                  >
                    <span className="line-clamp-4">
                      {protocol.EmergProtocolDescription}
                    </span>
                  </td>
                  <td className="align-top px-4 py-2 text-end">
                    {protocol.EmergProtocolVideo ? (
                      <a
                        target="_blank"
                        href={protocol.EmergProtocolVideo}
                        className="line-clamp-3 text-textPrimaryBlue cursor-pointer"
                        style={{ wordBreak: 'break-all' }}
                      >
                        Click here
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </td>
                </tr>
              );
            })
          )}
          <tr ref={ref}>
            <td colSpan={3}>
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

export default EmergResList;
