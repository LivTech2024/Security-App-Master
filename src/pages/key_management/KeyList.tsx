import { useEffect, useState } from 'react';
import PageHeader from '../../common/PageHeader';
import SelectBranch from '../../common/SelectBranch';
import Button from '../../common/button/Button';
import SearchBar from '../../common/inputs/SearchBar';
import { useDebouncedValue } from '@mantine/hooks';
import { useNavigate } from 'react-router-dom';
import { useAuthState, useEditFormStore } from '../../store';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  DisplayCount,
  MinimumQueryCharacter,
  PageRoutes,
  REACT_QUERY_KEYS,
} from '../../@types/enum';
import { DocumentData } from 'firebase/firestore';
import { IKeysCollection } from '../../@types/database';
import { useInView } from 'react-intersection-observer';
import DbAssets from '../../firebase_configs/DB/DbAssets';
import NoSearchResult from '../../common/NoSearchResult';
import { numberFormatter } from '../../utilities/NumberFormater';
import TableShimmer from '../../common/shimmer/TableShimmer';
import AddKeyModal from '../../component/key_management/modal/AddKeyModal';

const KeyList = () => {
  const navigate = useNavigate();

  const { company } = useAuthState();

  const { setKeyEditData } = useEditFormStore();

  const [query, setQuery] = useState('');

  const [branchId, setBranchId] = useState('');

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
      REACT_QUERY_KEYS.KEY_LIST,
      debouncedQuery,
      company!.CompanyId,
      branchId,
    ],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbAssets.getKeys({
        lmt: DisplayCount.KEY_LIST,
        lastDoc: pageParam,
        searchQuery: debouncedQuery,
        cmpId: company!.CompanyId,
        branchId,
      });
      return snapshot.docs;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage?.length === 0) {
        return null;
      }
      if (lastPage?.length === DisplayCount.KEY_LIST) {
        return lastPage.at(-1);
      }
      return null;
    },
    initialPageParam: null as null | DocumentData,
    enabled:
      debouncedQuery.trim().length > 0 &&
      debouncedQuery.trim().length < MinimumQueryCharacter.KEY
        ? false
        : true,
  });

  const [data, setData] = useState<IKeysCollection[]>(() => {
    if (snapshotData) {
      return snapshotData.pages.flatMap((page) =>
        page.map((doc) => doc.data() as IKeysCollection)
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
      const docData: IKeysCollection[] = [];
      snapshotData.pages?.forEach((page) => {
        page?.forEach((doc) => {
          const data = doc.data() as IKeysCollection;
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

  //modal states
  const [addKeyModal, setAddKeyModal] = useState(false);
  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <PageHeader
        title="Key Management"
        rightSection={
          <div className="flex items-center gap-4">
            <Button
              label="Allot Key"
              onClick={() => {}}
              type="blue"
              className="px-6"
            />
            <Button
              label="Create New Key"
              onClick={() => {
                setKeyEditData(null);
                setAddKeyModal(true);
              }}
              type="black"
            />
          </div>
        }
      />

      <AddKeyModal opened={addKeyModal} setOpened={setAddKeyModal} />

      <div className="flex items-center bg-surface shadow p-4 rounded w-full justify-between">
        <SearchBar value={query} setValue={setQuery} placeholder="Search key" />
        <SelectBranch
          selectedBranch={branchId}
          setSelectedBranch={setBranchId}
        />
      </div>

      <table className="rounded overflow-hidden w-full">
        <thead className="bg-primary text-surface text-sm">
          <tr>
            <th className="uppercase px-4 py-2 w-[30%] text-start">Key Name</th>
            <th className="uppercase px-4 py-2 w-[25%] text-start">
              Description
            </th>

            <th className="uppercase px-4 py-2 w-[15%] text-end">Total Qty</th>
            <th className="uppercase px-4 py-2 w-[15%] text-end">
              Alloted Qty
            </th>
            <th className="uppercase px-4 py-2 w-[15%] text-end">
              Available Qty
            </th>
          </tr>
        </thead>
        <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
          {data.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={5}>
                <NoSearchResult text="No keys" />
              </td>
            </tr>
          ) : (
            data.map((key) => {
              return (
                <tr
                  key={key.KeyId}
                  onClick={() =>
                    navigate(PageRoutes.KEY_VIEW + `?id=${key.KeyId}`)
                  }
                  className="cursor-pointer"
                >
                  <td className="align-top px-4 py-2 text-start">
                    {key.KeyName}
                  </td>
                  <td className="align-top px-4 py-2 text-start">
                    <span className="line-clamp-2">
                      {key.KeyDescription || 'N/A'}
                    </span>
                  </td>
                  <td className="align-top px-4 py-2 text-end">
                    {numberFormatter(key.KeyTotalQuantity, false, 1)}
                  </td>
                  <td className="align-top px-4 py-2 text-end text-textPrimaryRed font-semibold">
                    {numberFormatter(key.KeyAllotedQuantity, false, 1)}
                  </td>
                  <td className="align-top px-4 py-2 text-end text-textPrimaryGreen font-extrabold">
                    {numberFormatter(
                      key.KeyTotalQuantity - key.KeyAllotedQuantity,
                      false,
                      1
                    )}
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

export default KeyList;
