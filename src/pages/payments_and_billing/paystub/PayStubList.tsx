import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../common/PageHeader';
import Button from '../../../common/button/Button';
import {
  DisplayCount,
  PageRoutes,
  REACT_QUERY_KEYS,
} from '../../../@types/enum';
import { useAuthState, useEditFormStore } from '../../../store';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import DbPayment from '../../../firebase_configs/DB/DbPayment';
import { DocumentData } from 'firebase/firestore';
import { IPayStubsCollection } from '../../../@types/database';
import { useInView } from 'react-intersection-observer';
import DateFilterDropdown from '../../../common/dropdown/DateFilterDropdown';
import NoSearchResult from '../../../common/NoSearchResult';
import { formatDate } from '../../../utilities/misc';
import { numberFormatter } from '../../../utilities/NumberFormater';
import TableShimmer from '../../../common/shimmer/TableShimmer';
import { MdOutlinePrint } from 'react-icons/md';
import { errorHandler } from '../../../utilities/CustomError';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../../utilities/TsxUtils';
import { getPaystubHtml } from '../../../utilities/pdf/getPaystubHtml';
import { htmlToPdf } from '../../../API/HtmlToPdf';
import { downloadPdf } from '../../../utilities/pdf/common/downloadPdf';
import { openContextModal } from '@mantine/modals';

const PayStubList = () => {
  const navigate = useNavigate();

  const { company } = useAuthState();

  const { setPayStubEditData } = useEditFormStore();

  const [startDate, setStartDate] = useState<Date | string | null>(
    dayjs().startOf('M').toDate()
  );

  const [endDate, setEndDate] = useState<Date | string | null>(
    dayjs().endOf('M').toDate()
  );

  const [isLifeTime, setIsLifeTime] = useState(false);

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
      REACT_QUERY_KEYS.PAY_STUB_LIST,
      company!.CompanyId,
      isLifeTime,
      startDate,
      endDate,
    ],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbPayment.getPayStubs({
        lmt: DisplayCount.PAY_STUB_LIST,
        lastDoc: pageParam,
        cmpId: company!.CompanyId,
        isLifeTime,
        startDate,
        endDate,
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

  const [data, setData] = useState<IPayStubsCollection[]>(() => {
    if (snapshotData) {
      return snapshotData.pages.flatMap((page) =>
        page.map((doc) => doc.data() as IPayStubsCollection)
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
      const docData: IPayStubsCollection[] = [];
      snapshotData.pages?.forEach((page) => {
        page?.forEach((doc) => {
          const data = doc.data() as IPayStubsCollection;
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

  const downloadPayStub = async (payStub: IPayStubsCollection) => {
    if (!company) return;
    try {
      showModalLoader({});

      const html = getPaystubHtml({ companyDetails: company, payStub });

      const response = await htmlToPdf({ file_name: 'pay_stub.pdf', html });

      downloadPdf(response, `${payStub.PayStubEmpName}_pay_stub.pdf`);

      closeModalLoader();

      showSnackbar({
        message: 'PayStu downloaded successfully',
        type: 'success',
      });
    } catch (error) {
      console.log(error);
      errorHandler(error);
      closeModalLoader();
    }
  };

  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);

  const onPublish = async (paysStubId: string) => {
    try {
      setLoading(true);

      await DbPayment.publishPayStub(paysStubId);

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.PAY_STUB_LIST],
      });

      showSnackbar({
        message: 'Paystub published successfully',
        type: 'success',
      });

      setLoading(false);
    } catch (error) {
      console.log(error);
      errorHandler(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loading) {
      showModalLoader({});
    } else {
      closeModalLoader();
    }
    return () => closeModalLoader();
  }, [loading]);

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <PageHeader
        title="Payment Stubs"
        rightSection={
          <Button
            label="Generate paystub"
            type="black"
            onClick={() => navigate(PageRoutes.PAY_STUB_GENERATE)}
          />
        }
      />

      <div className="flex items-start justify-between w-full gap-4 p-4 rounded bg-surface shadow">
        <DateFilterDropdown
          endDate={endDate}
          isLifetime={isLifeTime}
          setEndDate={setEndDate}
          setIsLifetime={setIsLifeTime}
          setStartDate={setStartDate}
          startDate={startDate}
        />
      </div>

      <table className="rounded overflow-hidden w-full">
        <thead className="bg-primary text-surface text-sm">
          <tr>
            <th className="uppercase px-4 py-2 w-[20%] text-start">
              Employee Name
            </th>
            <th className="uppercase px-4 py-2 w-[15%] text-start">Role</th>
            <th className="uppercase px-4 py-2 w-[12%] text-start">
              start date
            </th>
            <th className="uppercase px-4 py-2 w-[12%] text-start">end date</th>
            <th className="uppercase px-4 py-2 w-[12%] text-start">pay date</th>

            <th className="uppercase px-4 py-2 w-[12%] text-start">Net Pay</th>
            <th className="uppercase px-4 py-2 w-[12%] text-end">Status</th>

            <th className="uppercase px-4 py-2 w-[5%] text-end"></th>
          </tr>
        </thead>
        <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
          {data.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={8}>
                <NoSearchResult />
              </td>
            </tr>
          ) : (
            data.map((payStub) => {
              return (
                <tr key={payStub.PayStubId}>
                  <td
                    onClick={() => {
                      setPayStubEditData(payStub);
                      navigate(PageRoutes.PAY_STUB_GENERATE);
                    }}
                    className="align-top cursor-pointer px-4 py-2 text-start "
                  >
                    <span className="line-clamp-3">
                      {payStub.PayStubEmpName}
                    </span>
                  </td>
                  <td
                    onClick={() => {
                      setPayStubEditData(payStub);
                      navigate(PageRoutes.PAY_STUB_GENERATE);
                    }}
                    className="align-top cursor-pointer px-4 py-2 text-start "
                  >
                    <span className="line-clamp-3">
                      {payStub.PayStubEmpRole ?? 'N/A'}
                    </span>
                  </td>
                  <td
                    onClick={() => {
                      setPayStubEditData(payStub);
                      navigate(PageRoutes.PAY_STUB_GENERATE);
                    }}
                    className="align-top cursor-pointer px-4 py-2 text-start"
                  >
                    {formatDate(payStub.PayStubPayPeriodStartDate)}
                  </td>

                  <td
                    onClick={() => {
                      setPayStubEditData(payStub);
                      navigate(PageRoutes.PAY_STUB_GENERATE);
                    }}
                    className="align-top cursor-pointer px-4 py-2 text-start"
                  >
                    {formatDate(payStub.PayStubPayPeriodEndDate)}
                  </td>
                  <td
                    onClick={() => {
                      setPayStubEditData(payStub);
                      navigate(PageRoutes.PAY_STUB_GENERATE);
                    }}
                    className="align-top cursor-pointer px-4 py-2 text-start"
                  >
                    {formatDate(payStub.PayStubPayDate)}
                  </td>
                  <td
                    onClick={() => {
                      setPayStubEditData(payStub);
                      navigate(PageRoutes.PAY_STUB_GENERATE);
                    }}
                    className="align-top cursor-pointer px-4 py-2 text-start"
                  >
                    {numberFormatter(payStub.PayStubNetPay.Amount, true)}
                  </td>
                  <td className="align-top cursor-pointer px-4 py-2 text-end">
                    {payStub.PayStubIsPublished ? (
                      <span className="">Published</span>
                    ) : (
                      <span
                        onClick={() =>
                          openContextModal({
                            modal: 'confirmModal',
                            withCloseButton: false,
                            centered: true,
                            closeOnClickOutside: true,
                            innerProps: {
                              title: 'Confirm',
                              body: 'Are you sure to publish this paystub, once you publish it cannot be edited or deleted ?',
                              onConfirm: () => {
                                onPublish(payStub.PayStubId);
                              },
                            },
                            size: '30%',
                            styles: {
                              body: { padding: '0px' },
                            },
                          })
                        }
                        className="cursor-pointer text-textPrimaryBlue hover:underline"
                      >
                        Publish
                      </span>
                    )}
                  </td>
                  <td
                    onClick={() => downloadPayStub(payStub)}
                    className="align-top cursor-pointer px-4 py-2 text-end"
                  >
                    <span className="text-textPrimaryBlue text-xl flex justify-end">
                      <MdOutlinePrint />
                    </span>
                  </td>
                </tr>
              );
            })
          )}
          <tr ref={ref}>
            <td colSpan={8}>
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

export default PayStubList;
