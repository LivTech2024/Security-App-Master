import { useSearchParams } from 'react-router-dom';
import Button from '../../common/button/Button';
import { useEditFormStore } from '../../store';
import { useEffect, useState } from 'react';
import AddEquipmentModal from '../../component/equipment_management/modal/AddEquipmentModal';
import { useInView } from 'react-intersection-observer';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { DisplayCount, REACT_QUERY_KEYS } from '../../@types/enum';
import DbAssets from '../../firebase_configs/DB/DbAssets';
import { DocumentData } from 'firebase/firestore';
import {
  IEquipmentAllocations,
  IEquipmentsCollection,
} from '../../@types/database';
import { Equipment } from '../../store/slice/editForm.slice';
import NoSearchResult from '../../common/NoSearchResult';
import { formatDate } from '../../utilities/misc';
import TableShimmer from '../../common/shimmer/TableShimmer';
import { numberFormatter } from '../../utilities/NumberFormater';
import DbEmployee from '../../firebase_configs/DB/DbEmployee';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../utilities/TsxUtils';
import { errorHandler } from '../../utilities/CustomError';
import { openContextModal } from '@mantine/modals';
import PageHeader from '../../common/PageHeader';

export interface EquipmentAllocations extends IEquipmentAllocations {
  EquipmentAllocationEmpEmail: string;
  EquipmentAllocationEmpPhone: string;
  EquipmentAllocationEmpName: string;
}

const EquipmentView = () => {
  const [searchParam] = useSearchParams();

  const equipId = searchParam.get('id');

  const { setEquipmentEditData } = useEditFormStore();

  const [equipmentData, setEquipmentData] =
    useState<IEquipmentsCollection | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!equipId) return;
    DbAssets.getEquipmentById(equipId).then((snapshot) => {
      const data = snapshot.data() as IEquipmentsCollection;
      if (data) {
        setEquipmentData(data);
      }
      setLoading(false);
    });
  }, [equipId]);

  const {
    data: snapshotData,
    fetchNextPage,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    isFetching,
    error,
  } = useInfiniteQuery({
    queryKey: [REACT_QUERY_KEYS.EQUIPMENT_ALLOCATION_LIST, equipId],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbAssets.getEquipAllocations({
        lmt: DisplayCount.EQUIPMENT_ALLOCATION_LIST,
        lastDoc: pageParam,
        equipmentId: equipId as string,
      });
      const docData: EquipmentAllocations[] = [];

      await Promise.all(
        snapshot?.docs?.map(async (doc) => {
          const data = doc.data() as IEquipmentAllocations;
          const { EquipmentAllocationEmpId } = data;
          const empData = await DbEmployee.getEmpById(EquipmentAllocationEmpId);
          docData.push({
            ...data,
            EquipmentAllocationEmpName: empData.EmployeeName,
            EquipmentAllocationEmpEmail: empData.EmployeeEmail,
            EquipmentAllocationEmpPhone: empData.EmployeePhone,
          } as unknown as EquipmentAllocations);
        })
      );
      return docData;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage?.length === 0) {
        return null;
      }
      if (lastPage?.length === DisplayCount.EQUIPMENT_ALLOCATION_LIST) {
        return lastPage.at(-1);
      }
      return null;
    },
    initialPageParam: null as null | DocumentData,
  });

  const fetchDataFromSnapshot = () => {
    if (snapshotData) {
      const docData: EquipmentAllocations[] = [];
      snapshotData.pages?.forEach((page) => {
        page?.forEach((data) => {
          docData.push(data);
        });
      });
      return docData;
    }

    return [];
  };

  const [data, setData] = useState<EquipmentAllocations[]>(() =>
    fetchDataFromSnapshot()
  );

  useEffect(() => {
    console.log(error, 'error');
  }, [error]);

  // we are looping through the snapshot returned by react-query and converting them to data
  useEffect(() => {
    setData(fetchDataFromSnapshot());
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

  const queryClient = useQueryClient();

  const onMarkReturn = async (equipAllocId: string, allotedQty: number) => {
    try {
      showModalLoader({});

      await DbAssets.returnEquipFromEmp(equipAllocId);

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.EQUIPMENT_ALLOCATION_LIST],
      });

      if (equipmentData) {
        const updateEquipData: IEquipmentsCollection = {
          ...equipmentData,
          EquipmentAllotedQuantity:
            equipmentData.EquipmentAllotedQuantity - allotedQty,
        };

        setEquipmentData(updateEquipData);
      }

      showSnackbar({
        message: 'Equipment returned successfully',
        type: 'success',
      });

      closeModalLoader();
    } catch (error) {
      console.log(error);
      closeModalLoader();
      errorHandler(error);
    }
  };

  if (!equipmentData && !loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <NoSearchResult />
      </div>
    );
  }

  if (loading) {
    <div className="flex flex-col w-full h-full p-6 gap-6 ">
      <PageHeader title="Equipment data" />

      <div className="h-[40vh] bg-shimmerColor w-full animate-pulse"></div>
    </div>;
  }

  if (equipmentData)
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6">
        <PageHeader
          title="Equipment data"
          rightSection={
            <Button
              type="black"
              onClick={() => {
                setEquipmentEditData(equipmentData as unknown as Equipment);
                setAddEquipmentModal(true);
              }}
              className="bg-primary text-surface px-4 py-2 rounded"
              label="Edit Equipment"
            />
          }
        />

        <AddEquipmentModal
          opened={addEquipmentModal}
          setOpened={setAddEquipmentModal}
        />

        <div className="bg-surface rounded shadow p-4 flex flex-col text-lg">
          <div>
            Equipment Name :{' '}
            <span className="font-semibold">{equipmentData.EquipmentName}</span>
          </div>
          <div>
            Equipment Total Qty :{' '}
            <span className="font-semibold">
              {numberFormatter(equipmentData.EquipmentTotalQuantity, false, 1)}
            </span>
          </div>
          <div>
            Equipment Available Qty :{' '}
            <span className="font-semibold">
              {numberFormatter(
                equipmentData.EquipmentTotalQuantity -
                  equipmentData.EquipmentAllotedQuantity,
                false,
                1
              )}
            </span>
          </div>
        </div>

        {/* All allocation of this equipment */}
        <div className="bg-surface rounded shadow p-4 flex flex-col gap-4">
          <div className="font-semibold text-lg">
            Equipment allocation details
          </div>
          <table className="rounded overflow-hidden w-full">
            <thead className="bg-primary text-surface text-sm">
              <tr>
                <th className="uppercase px-4 py-2 w-[25%] text-start">
                  Employee Details
                </th>
                <th className="uppercase px-4 py-2 w-[15%] text-start">
                  Allotment Qty
                </th>
                <th className="uppercase px-4 py-2 w-[15%] text-start">
                  Allotment Date
                </th>

                <th className="uppercase px-4 py-2 w-[12%] text-start">
                  Start Date
                </th>
                <th className="uppercase px-4 py-2 w-[12%] text-start">
                  End Date
                </th>
                <th className="uppercase px-4 py-2 w-[10%] text-end">
                  Is Returned
                </th>
                <th className="uppercase px-4 py-2 w-[16%] text-end">
                  Return Date
                </th>
              </tr>
            </thead>
            <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
              {data.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={7}>
                    <NoSearchResult text="This equipment is not allocated to anyone yet" />
                  </td>
                </tr>
              ) : (
                data.map((eqp) => {
                  return (
                    <tr
                      key={eqp.EquipmentAllocationId}
                      className="cursor-pointer"
                    >
                      <td className="align-top px-4 py-2 text-start">
                        <div className="flex flex-col">
                          <span> {eqp.EquipmentAllocationEmpName}</span>
                          <span className="text-sm text-textSecondary">
                            {' '}
                            {eqp.EquipmentAllocationEmpEmail}
                          </span>
                          <span className="text-sm text-textSecondary">
                            {' '}
                            {eqp.EquipmentAllocationEmpPhone}
                          </span>
                        </div>
                      </td>
                      <td className="align-top px-4 py-2 text-start">
                        {numberFormatter(
                          eqp.EquipmentAllocationEquipQty,
                          false,
                          1
                        )}
                      </td>
                      <td className="align-top px-4 py-2 text-start">
                        <span className="line-clamp-2">
                          {formatDate(eqp.EquipmentAllocationDate)}
                        </span>
                      </td>
                      <td className="align-top px-4 py-2 text-start">
                        {formatDate(eqp.EquipmentAllocationStartDate)}
                      </td>
                      <td className="align-top px-4 py-2 text-start ">
                        {formatDate(eqp.EquipmentAllocationEndDate)}
                      </td>
                      <td className="align-top px-4 py-2 text-end ">
                        {eqp.EquipmentAllocationIsReturned ? 'Yes' : 'No'}
                      </td>
                      {eqp.EquipmentAllocationIsReturned &&
                      eqp?.EquipmentAllocationReturnedAt ? (
                        <td className="align-top px-4 py-2 text-end ">
                          {formatDate(eqp?.EquipmentAllocationReturnedAt)}
                        </td>
                      ) : (
                        <td
                          onClick={() => {
                            openContextModal({
                              modal: 'confirmModal',
                              withCloseButton: false,
                              centered: true,
                              closeOnClickOutside: true,
                              innerProps: {
                                title: 'Confirm',
                                body: 'Are you sure to mark returned this equipment',
                                onConfirm: () => {
                                  onMarkReturn(
                                    eqp.EquipmentAllocationId,
                                    eqp.EquipmentAllocationEquipQty
                                  );
                                },
                              },
                              size: '30%',
                              styles: {
                                body: { padding: '0px' },
                              },
                            });
                          }}
                          className="align-top px-4 py-2 text-end underline text-textPrimaryBlue cursor-pointer"
                        >
                          Mark return
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
              <tr ref={ref}>
                <td colSpan={7}>
                  {(isLoading || isFetchingNextPage) &&
                    Array.from({ length: 10 }).map((_, idx) => (
                      <TableShimmer key={idx} />
                    ))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
};

export default EquipmentView;
