import { useInView } from 'react-intersection-observer';
import SelectBranch from '../../common/SelectBranch';
import Button from '../../common/button/Button';
import SearchBar from '../../common/inputs/SearchBar';
import { useEffect, useState } from 'react';
import { IEquipmentsCollection } from '../../@types/database';
import {
  DisplayCount,
  MinimumQueryCharacter,
  PageRoutes,
  REACT_QUERY_KEYS,
} from '../../@types/enum';
import { DocumentData } from 'firebase/firestore';
import DbAssets from '../../firebase_configs/DB/DbAssets';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '@mantine/hooks';
import { useAuthState, useEditFormStore } from '../../store';
import NoSearchResult from '../../common/NoSearchResult';
import TableShimmer from '../../common/shimmer/TableShimmer';
import AddEquipmentModal from '../../component/equipment_management/modal/AddEquipmentModal';
import EquipAllocationModal from '../../component/equipment_management/modal/EquipAllocationModal';
import { numberFormatter } from '../../utilities/NumberFormater';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../../common/PageHeader';

const EquipmentList = () => {
  const navigate = useNavigate();

  const { company } = useAuthState();

  const { setEquipmentEditData } = useEditFormStore();

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
      REACT_QUERY_KEYS.EQUIPMENT_LIST,
      debouncedQuery,
      company!.CompanyId,
      branchId,
    ],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbAssets.getEquipments({
        lmt: DisplayCount.EQUIPMENT_LIST,
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
      if (lastPage?.length === DisplayCount.EQUIPMENT_LIST) {
        return lastPage.at(-1);
      }
      return null;
    },
    initialPageParam: null as null | DocumentData,
    enabled:
      debouncedQuery.trim().length > 0 &&
      debouncedQuery.trim().length < MinimumQueryCharacter.EQUIPMENT
        ? false
        : true,
  });

  const [data, setData] = useState<IEquipmentsCollection[]>(() => {
    if (snapshotData) {
      return snapshotData.pages.flatMap((page) =>
        page.map((doc) => doc.data() as IEquipmentsCollection)
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
      const docData: IEquipmentsCollection[] = [];
      snapshotData.pages?.forEach((page) => {
        page?.forEach((doc) => {
          const data = doc.data() as IEquipmentsCollection;
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

  //*Modal states
  const [addEquipmentModal, setAddEquipmentModal] = useState(false);

  const [equipAllocationModal, setEquipAllocationModal] = useState(false);

  const [searchParams] = useSearchParams();

  const action = searchParams.get('action');

  useEffect(() => {
    if (action === 'create') {
      setAddEquipmentModal(true);
    }
  }, [action]);

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <PageHeader
        title="Equipment Management"
        rightSection={
          <div className="flex items-center gap-4">
            <Button
              label="Allot Equipment"
              onClick={() => {
                setEquipAllocationModal(true);
              }}
              type="blue"
              className="px-6"
            />
            <Button
              label="Create New Equipment"
              onClick={() => {
                setEquipmentEditData(null);
                setAddEquipmentModal(true);
              }}
              type="black"
            />
          </div>
        }
      />

      <div className="flex items-center bg-surface shadow p-4 rounded w-full justify-between">
        <SearchBar
          value={query}
          setValue={setQuery}
          placeholder="Search equipment"
        />
        <SelectBranch
          selectedBranch={branchId}
          setSelectedBranch={setBranchId}
        />
      </div>

      <AddEquipmentModal
        opened={addEquipmentModal}
        setOpened={setAddEquipmentModal}
      />

      <EquipAllocationModal
        opened={equipAllocationModal}
        setOpened={setEquipAllocationModal}
      />

      <table className="rounded overflow-hidden w-full">
        <thead className="bg-primary text-surface text-sm">
          <tr>
            <th className="uppercase px-4 py-2 w-[30%] text-start">
              Equipment Name
            </th>
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
                <NoSearchResult text="No equipment" />
              </td>
            </tr>
          ) : (
            data.map((eqp) => {
              return (
                <tr
                  key={eqp.EquipmentId}
                  onClick={() =>
                    navigate(
                      PageRoutes.EQUIPMENT_VIEW + `?id=${eqp.EquipmentId}`
                    )
                  }
                  className="cursor-pointer"
                >
                  <td className="align-top px-4 py-2 text-start">
                    {eqp.EquipmentName}
                  </td>
                  <td className="align-top px-4 py-2 text-start">
                    <span className="line-clamp-2">
                      {eqp.EquipmentDescription || 'N/A'}
                    </span>
                  </td>
                  <td className="align-top px-4 py-2 text-end">
                    {numberFormatter(eqp.EquipmentTotalQuantity, false, 1)}
                  </td>
                  <td className="align-top px-4 py-2 text-end text-textPrimaryRed font-semibold">
                    {numberFormatter(eqp.EquipmentAllotedQuantity, false, 1)}
                  </td>
                  <td className="align-top px-4 py-2 text-end text-textPrimaryGreen font-extrabold">
                    {numberFormatter(
                      eqp.EquipmentTotalQuantity - eqp.EquipmentAllotedQuantity,
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

export default EquipmentList;
