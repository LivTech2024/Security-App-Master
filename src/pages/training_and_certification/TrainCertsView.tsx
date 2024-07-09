import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ITrainCertsAllocationsCollection,
  ITrainingAndCertificationsCollection,
} from '../../@types/database';
import DbCompany from '../../firebase_configs/DB/DbCompany';
import NoSearchResult from '../../common/NoSearchResult';
import PageHeader from '../../common/PageHeader';
import { formatDate } from '../../utilities/misc';
import { numberFormatter } from '../../utilities/NumberFormater';
import dayjs from 'dayjs';
import DateFilterDropdown from '../../common/dropdown/DateFilterDropdown';
import useFetchEmployees from '../../hooks/fetch/useFetchEmployees';
import InputSelect from '../../common/inputs/InputSelect';
import { DisplayCount, REACT_QUERY_KEYS } from '../../@types/enum';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { DocumentData } from 'firebase/firestore';
import { useInView } from 'react-intersection-observer';
import { Status } from '../../common/Status';
import TableShimmer from '../../common/shimmer/TableShimmer';
import Button from '../../common/button/Button';
import TrainCertsAllocModal from '../../component/training_and_certifications/modal/TrainCertsAllocModal';
import AllocUpdateModal from '../../component/training_and_certifications/modal/AllocUpdateModal';
import { FaRegTrashAlt } from 'react-icons/fa';
import { errorHandler } from '../../utilities/CustomError';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../utilities/TsxUtils';
import { openContextModal } from '@mantine/modals';

const TrainCertsView = () => {
  const [searchParam] = useSearchParams();

  const trainCertId = searchParam.get('id');

  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<ITrainingAndCertificationsCollection | null>(
    null
  );

  useEffect(() => {
    if (!trainCertId) return;

    DbCompany.getTrainCertsById(trainCertId)
      .then((snapshot) => {
        const trainCertsData =
          snapshot.data() as ITrainingAndCertificationsCollection;
        setData(trainCertsData);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, [trainCertId]);

  //*Fetch all allocation of the trainCerts
  const [startDate, setStartDate] = useState<Date | string | null>(
    dayjs().startOf('M').toDate()
  );

  const [endDate, setEndDate] = useState<Date | string | null>(
    dayjs().endOf('M').toDate()
  );

  const [isLifeTime, setIsLifeTime] = useState(false);

  const [empSearchQuery, setEmpSearchQuery] = useState('');

  const [selectedEmpId, setSelectedEmpId] = useState('');

  const { data: employees } = useFetchEmployees({
    limit: 5,
    searchQuery: empSearchQuery,
  });

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
      REACT_QUERY_KEYS.TRAIN_CERTS_ALLOC_LIST,
      trainCertId,
      isLifeTime,
      startDate,
      endDate,
      selectedEmpId,
    ],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbCompany.getTrainCertsAlloc({
        lmt: DisplayCount.TRAIN_CERTS_ALLOC_LIST,
        lastDoc: pageParam,
        isLifeTime,
        startDate,
        endDate,
        empId: selectedEmpId,
        trainCertsId: trainCertId || '',
      });
      return snapshot.docs;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage?.length === 0) {
        return null;
      }
      if (lastPage?.length === DisplayCount.EMPLOYEE_LIST) {
        return lastPage.at(-1);
      }
      return null;
    },
    initialPageParam: null as null | DocumentData,
  });

  const [allocData, setAllocData] = useState<
    ITrainCertsAllocationsCollection[]
  >(() => {
    if (snapshotData) {
      return snapshotData.pages.flatMap((page) =>
        page.map((doc) => doc.data() as ITrainCertsAllocationsCollection)
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
      const docData: ITrainCertsAllocationsCollection[] = [];
      snapshotData.pages?.forEach((page) => {
        page?.forEach((doc) => {
          const data = doc.data() as ITrainCertsAllocationsCollection;
          docData.push(data);
        });
      });
      setAllocData(docData);
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

  const [trainCertsAllocModal, setTrainCertsAllocModal] = useState(false);

  const [trainCertsUpdateModal, setTrainCertsUpdateModal] = useState(false);

  const [allocUpdateModalProps, setAllocUpdateModalProps] = useState<{
    status: 'started' | 'completed';
    allocData: ITrainCertsAllocationsCollection;
  }>({ allocData: allocData[0], status: 'completed' });

  const queryClient = useQueryClient();

  const onAllocDelete = async (allocId: string) => {
    try {
      showModalLoader({});

      await DbCompany.deleteTrainCertsAlloc(allocId);

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.TRAIN_CERTS_ALLOC_LIST],
      });

      showSnackbar({
        message: 'Allocation deleted successfully',
        type: 'success',
      });

      closeModalLoader();
    } catch (error) {
      console.log(error);
      errorHandler(error);
      closeModalLoader();
    }
  };

  if (!data && !loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <NoSearchResult />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6 ">
        <PageHeader title="Training & Certifications Data" />

        <div className="h-[40vh] bg-shimmerColor w-full animate-pulse"></div>
      </div>
    );
  }

  if (data)
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6">
        <PageHeader
          title="Training & Certifications Data"
          rightSection={
            <Button
              label="Allot To New Employee"
              type="black"
              onClick={() => {
                setTrainCertsAllocModal(true);
              }}
            />
          }
        />

        <TrainCertsAllocModal
          opened={trainCertsAllocModal}
          setOpened={setTrainCertsAllocModal}
          trainCertsId={trainCertId || ''}
        />

        <AllocUpdateModal
          opened={trainCertsUpdateModal}
          setOpened={setTrainCertsUpdateModal}
          status={allocUpdateModalProps.status}
          trainCertsAlloc={allocUpdateModalProps.allocData}
        />

        <div className="bg-surface shadow rounded p-4 grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Title:</span>
            <span>{data.TrainCertsTitle}</span>
          </div>
          <div className="flex items-center gap-2 ">
            <span className="font-semibold">Description:</span>
            <span className="line-clamp-2">{data.TrainCertsDescription}</span>
          </div>
          <div className="flex items-center gap-2 ">
            <span className="font-semibold">Start Date:</span>
            <span className="line-clamp-2">
              {formatDate(data.TrainCertsStartDate)}
            </span>
          </div>
          <div className="flex items-center gap-2 ">
            <span className="font-semibold">End Date:</span>
            <span className="line-clamp-2">
              {formatDate(data.TrainCertsEndDate)}
            </span>
          </div>
          <div className="flex items-center gap-2 ">
            <span className="font-semibold">No. of trainee enrolled:</span>
            <span className="line-clamp-2">
              {numberFormatter(data.TrainCertsTotalTrainee, false, 1)}
            </span>
          </div>
          <div className="flex items-center gap-2 ">
            <span className="font-semibold">
              No. of trainee completed training:
            </span>
            <span className="line-clamp-2">
              {numberFormatter(
                data.TrainCertsTotalTraineeCompletedTraining,
                false,
                1
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 ">
            <span className="font-semibold">Duration:</span>
            <span className="line-clamp-2">
              {numberFormatter(data.TrainCertsDuration, false, 1)}
            </span>
          </div>
          <div className="flex items-center gap-2 ">
            <span className="font-semibold">Cost:</span>
            <span className="line-clamp-2">
              {numberFormatter(data.TrainCertsCost ?? 0, true)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between w-full gap-4 p-4 rounded bg-surface shadow">
          <DateFilterDropdown
            endDate={endDate}
            isLifetime={isLifeTime}
            setEndDate={setEndDate}
            setIsLifetime={setIsLifeTime}
            setStartDate={setStartDate}
            startDate={startDate}
          />
          <InputSelect
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e as string)}
            data={employees.map((emp) => {
              return { label: emp.EmployeeName, value: emp.EmployeeId };
            })}
            searchValue={empSearchQuery}
            onSearchChange={setEmpSearchQuery}
            searchable
            clearable
            placeholder="Select employee"
          />
        </div>
        <table className="rounded overflow-hidden w-full">
          <thead className="bg-primary text-surface text-sm">
            <tr>
              <th className="uppercase px-4 py-2 w-[25%] text-start">
                Employee Name
              </th>

              <th className="uppercase px-4 py-2 w-[20%] text-start">
                Allocation Date
              </th>
              <th className="uppercase px-4 py-2 w-[20%] text-start">
                Start Date
              </th>
              <th className="uppercase px-4 py-2 w-[20%] text-start">
                Completion Date
              </th>
              <th className="uppercase px-4 py-2 w-[10%] text-end">Status</th>
              <th className="w-[5%] text-end"></th>
            </tr>
          </thead>
          <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
            {allocData.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={7}>
                  <NoSearchResult />
                </td>
              </tr>
            ) : (
              allocData.map((alloc) => {
                return (
                  <tr key={alloc.TrainCertsAllocId} className="">
                    <td className="align-top px-4 py-2 text-start">
                      <span className="line-clamp-3">
                        {alloc.TrainCertsAllocEmpName}
                      </span>
                    </td>

                    <td className="align-top px-4 py-2 text-start">
                      <span className="line-clamp-2">
                        {formatDate(alloc.TrainCertsAllocDate)}
                      </span>
                    </td>
                    <td className="align-top px-4 py-2 text-start ">
                      <span className="line-clamp-2">
                        {alloc.TrainCertsAllocStartDate ? (
                          formatDate(alloc.TrainCertsAllocStartDate)
                        ) : (
                          <span
                            onClick={() => {
                              setAllocUpdateModalProps({
                                allocData: alloc,
                                status: 'started',
                              });
                              setTrainCertsUpdateModal(true);
                            }}
                            className="text-textPrimaryBlue cursor-pointer hover:underline"
                          >
                            Mark it started
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="align-top px-4 py-2 text-start ">
                      <span className="line-clamp-2">
                        {alloc.TrainCertsAllocCompletionDate ? (
                          formatDate(alloc.TrainCertsAllocCompletionDate)
                        ) : (
                          <span
                            onClick={() => {
                              if (!alloc.TrainCertsAllocStartDate) {
                                showSnackbar({
                                  message:
                                    'Please mark it started before marking it completed',
                                  type: 'error',
                                });
                                return;
                              }
                              setAllocUpdateModalProps({
                                allocData: alloc,
                                status: 'completed',
                              });
                              setTrainCertsUpdateModal(true);
                            }}
                            className="text-textPrimaryBlue cursor-pointer hover:underline"
                          >
                            Mark it completed
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="align-top px-4 py-2 text-end">
                      <div className="flex justify-end">
                        <Status status={alloc.TrainCertsAllocStatus} />
                      </div>
                    </td>
                    <td className="align-middle px-4 py-2">
                      <div className="flex justify-end">
                        <FaRegTrashAlt
                          onClick={() => {
                            openContextModal({
                              modal: 'confirmModal',
                              withCloseButton: false,
                              centered: true,
                              closeOnClickOutside: true,
                              innerProps: {
                                title: 'Confirm',
                                body: 'Are you sure to delete this branch',
                                onConfirm: () => {
                                  onAllocDelete(alloc.TrainCertsAllocId);
                                },
                              },
                              size: '30%',
                              styles: {
                                body: { padding: '0px' },
                              },
                            });
                          }}
                          className="text-textPrimaryRed cursor-pointer"
                        />
                      </div>
                    </td>
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
    );
};

export default TrainCertsView;
