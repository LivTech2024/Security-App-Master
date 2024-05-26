import { useSearchParams } from 'react-router-dom';
import PageHeader from '../../common/PageHeader';
import Button from '../../common/button/Button';
import { useEditFormStore } from '../../store';
import { useEffect, useState } from 'react';
import { IKeyAllocations, IKeysCollection } from '../../@types/database';
import DbAssets from '../../firebase_configs/DB/DbAssets';
import { Key, KeyAllocation } from '../../store/slice/editForm.slice';
import AddKeyModal from '../../component/key_management/modal/AddKeyModal';
import { useInView } from 'react-intersection-observer';
import { DocumentData } from 'firebase/firestore';
import { DisplayCount, REACT_QUERY_KEYS } from '../../@types/enum';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { numberFormatter } from '../../utilities/NumberFormater';
import NoSearchResult from '../../common/NoSearchResult';
import { formatDate } from '../../utilities/misc';
import { openContextModal } from '@mantine/modals';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../utilities/TsxUtils';
import { errorHandler } from '../../utilities/CustomError';
import TableShimmer from '../../common/shimmer/TableShimmer';
import KeyAllocationModal from '../../component/key_management/modal/KeyAllocationModal';

const KeyView = () => {
  const [searchParam] = useSearchParams();

  const keyId = searchParam.get('id');

  const { setKeyEditData, setKeyAllocationEditData } = useEditFormStore();

  const [keyData, setKeyData] = useState<IKeysCollection | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!keyId) return;
    DbAssets.getKeyById(keyId).then((snapshot) => {
      const data = snapshot.data() as IKeysCollection;
      if (data) {
        setKeyData(data);
      }
      setLoading(false);
    });
  }, [keyId]);

  const {
    data: snapshotData,
    fetchNextPage,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    isFetching,
    error,
  } = useInfiniteQuery({
    queryKey: [REACT_QUERY_KEYS.KEY_ALLOCATION, keyId],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbAssets.getKeyAllocations({
        lmt: DisplayCount.KEY_ALLOCATION,
        lastDoc: pageParam,
        keyId: keyId as string,
      });

      return snapshot.docs;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage?.length === 0) {
        return null;
      }
      if (lastPage?.length === DisplayCount.KEY_ALLOCATION) {
        return lastPage.at(-1);
      }
      return null;
    },
    initialPageParam: null as null | DocumentData,
  });

  const fetchDataFromSnapshot = () => {
    if (snapshotData) {
      return snapshotData.pages.flatMap((page) =>
        page.map((doc) => doc.data() as IKeyAllocations)
      );
    }
    return [];
  };

  const [data, setData] = useState<IKeyAllocations[]>(() =>
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
  const [addKeyModal, setAddKeyModal] = useState(false);
  const [keyAllocModal, setKeyAllocModal] = useState(false);

  const queryClient = useQueryClient();

  const onMarkReturn = async (keyAllocId: string, allotedQty: number) => {
    try {
      showModalLoader({});

      await DbAssets.returnKeyFromRecipient(keyAllocId);

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.KEY_ALLOCATION],
      });

      if (keyData) {
        const updateEquipData: IKeysCollection = {
          ...keyData,
          KeyAllotedQuantity: keyData.KeyAllotedQuantity - allotedQty,
        };

        setKeyData(updateEquipData);
      }

      showSnackbar({
        message: 'Key returned successfully',
        type: 'success',
      });

      closeModalLoader();
    } catch (error) {
      console.log(error);
      closeModalLoader();
      errorHandler(error);
    }
  };

  if (!keyData && !loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <NoSearchResult />
      </div>
    );
  }

  if (loading) {
    <div className="flex flex-col w-full h-full p-6 gap-6 ">
      <PageHeader title="Key data" />
      <div className="h-[40vh] bg-shimmerColor w-full animate-pulse"></div>
    </div>;
  }

  if (keyData)
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6">
        <PageHeader
          title="Key data"
          rightSection={
            <Button
              type="black"
              onClick={() => {
                setKeyEditData(keyData as unknown as Key);
                setAddKeyModal(true);
              }}
              className="bg-primary text-surface px-4 py-2 rounded"
              label="Edit Equipment"
            />
          }
        />

        <AddKeyModal opened={addKeyModal} setOpened={setAddKeyModal} />

        <KeyAllocationModal
          opened={keyAllocModal}
          setOpened={setKeyAllocModal}
        />

        <div className="bg-surface rounded shadow p-4 flex flex-col text-lg">
          <div>
            Key Name : <span className="font-semibold">{keyData?.KeyName}</span>
          </div>
          <div>
            Total Qty :{' '}
            <span className="font-semibold">
              {numberFormatter(keyData?.KeyTotalQuantity, false, 1)}
            </span>
          </div>
          <div>
            Available Qty :{' '}
            <span className="font-semibold">
              {numberFormatter(
                keyData?.KeyTotalQuantity - keyData?.KeyAllotedQuantity,
                false,
                1
              )}
            </span>
          </div>
        </div>

        {/* All allocation of this equipment */}
        <div className="bg-surface rounded shadow p-4 flex flex-col gap-4">
          <div className="font-semibold text-lg">Key allocation details</div>
          <table className="rounded overflow-hidden w-full">
            <thead className="bg-primary text-surface text-sm">
              <tr>
                <th className="uppercase px-4 py-2 w-[15%] text-start">
                  Recipient Details
                </th>
                <th className="uppercase px-4 py-2 w-[18%] text-start">
                  Purpose
                </th>
                <th className="uppercase px-4 py-2 w-[10%] text-start">Qty</th>
                <th className="uppercase px-4 py-2 w-[10%] text-start">Date</th>

                <th className="uppercase px-4 py-2 w-[12%] text-start">
                  Start Time
                </th>
                <th className="uppercase px-4 py-2 w-[12%] text-start">
                  End Time
                </th>

                <th className="uppercase px-4 py-2 w-[12%] text-end">
                  Return Time
                </th>
              </tr>
            </thead>
            <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
              {data.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={7}>
                    <NoSearchResult text="This key is not allocated to anyone yet" />
                  </td>
                </tr>
              ) : (
                data.map((keyAlloc) => {
                  return (
                    <tr
                      key={keyAlloc.KeyAllocationId}
                      className="cursor-pointer"
                    >
                      <td
                        onClick={() => {
                          setKeyAllocationEditData(
                            keyAlloc as unknown as KeyAllocation
                          );
                          setKeyAllocModal(true);
                        }}
                        className="align-top px-4 py-2 text-start"
                      >
                        <div className="flex flex-col">
                          <span> {keyAlloc.KeyAllocationRecipientName}</span>
                          <span className="text-sm text-textSecondary">
                            {keyAlloc.KeyAllocationRecipientContact}
                          </span>
                          {keyAlloc.KeyAllocationRecipientCompany && (
                            <span className="text-sm text-textSecondary">
                              {keyAlloc.KeyAllocationRecipientCompany}
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        onClick={() => {
                          setKeyAllocationEditData(
                            keyAlloc as unknown as KeyAllocation
                          );
                          setKeyAllocModal(true);
                        }}
                        className="align-top px-4 py-2 text-start"
                      >
                        <span className="line-clamp-3">
                          {keyAlloc.KeyAllocationPurpose}
                        </span>
                      </td>
                      <td
                        onClick={() => {
                          setKeyAllocationEditData(
                            keyAlloc as unknown as KeyAllocation
                          );
                          setKeyAllocModal(true);
                        }}
                        className="align-top px-4 py-2 text-start"
                      >
                        {numberFormatter(
                          keyAlloc.KeyAllocationKeyQty,
                          false,
                          1
                        )}
                      </td>
                      <td
                        onClick={() => {
                          setKeyAllocationEditData(
                            keyAlloc as unknown as KeyAllocation
                          );
                          setKeyAllocModal(true);
                        }}
                        className="align-top px-4 py-2 text-start"
                      >
                        <span className="line-clamp-2">
                          {formatDate(keyAlloc.KeyAllocationDate)}
                        </span>
                      </td>
                      <td
                        onClick={() => {
                          setKeyAllocationEditData(
                            keyAlloc as unknown as KeyAllocation
                          );
                          setKeyAllocModal(true);
                        }}
                        className="align-top px-4 py-2 text-start"
                      >
                        {formatDate(
                          keyAlloc.KeyAllocationStartTime,
                          'DD MMM HH:mm'
                        )}
                      </td>
                      <td
                        onClick={() => {
                          setKeyAllocationEditData(
                            keyAlloc as unknown as KeyAllocation
                          );
                          setKeyAllocModal(true);
                        }}
                        className="align-top px-4 py-2 text-start "
                      >
                        {formatDate(
                          keyAlloc.KeyAllocationEndTime,
                          'DD MMM HH:mm'
                        )}
                      </td>

                      {keyAlloc.KeyAllocationIsReturned &&
                      keyAlloc?.KeyAllocationReturnedAt ? (
                        <td className="align-top px-4 py-2 text-end ">
                          {formatDate(
                            keyAlloc?.KeyAllocationReturnedAt,
                            'DD MMM HH:mm'
                          )}
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
                                    keyAlloc.KeyAllocationId,
                                    keyAlloc.KeyAllocationKeyQty
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

export default KeyView;
