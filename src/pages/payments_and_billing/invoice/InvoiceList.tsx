import { useEffect, useState } from 'react';
import { useAuthState, useEditFormStore } from '../../../store';
import dayjs from 'dayjs';
import DateFilterDropdown from '../../../common/dropdown/DateFilterDropdown';
import { useNavigate } from 'react-router-dom';
import {
  DisplayCount,
  PageRoutes,
  REACT_QUERY_KEYS,
} from '../../../@types/enum';
import Button from '../../../common/button/Button';
import { useInfiniteQuery } from '@tanstack/react-query';
import DbPayment from '../../../firebase_configs/DB/DbPayment';
import { DocumentData } from 'firebase/firestore';
import {
  IClientsCollection,
  IInvoicesCollection,
} from '../../../@types/database';
import { useInView } from 'react-intersection-observer';
import TableShimmer from '../../../common/shimmer/TableShimmer';
import NoSearchResult from '../../../common/NoSearchResult';
import { formatDate } from '../../../utilities/misc';
import { numberFormatter } from '../../../utilities/NumberFormater';
import {
  MdClear,
  MdIncompleteCircle,
  MdOutlineDone,
  MdOutlinePrint,
} from 'react-icons/md';
import { errorHandler } from '../../../utilities/CustomError';
import { closeModalLoader, showModalLoader } from '../../../utilities/TsxUtils';
import { generateInvoiceHTML } from '../../../utilities/pdf/generateInvoiceHtml';
import DbClient from '../../../firebase_configs/DB/DbClient';
import { htmlToPdf } from '../../../API/HtmlToPdf';
import PageHeader from '../../../common/PageHeader';
import useUpdateRecentTransactionNumbers from '../../../hooks/useUpdateRecentTransactionNumbers';
import InputSelect from '../../../common/inputs/InputSelect';
import useFetchClients from '../../../hooks/fetch/useFetchClients';
import { downloadPdf } from '../../../utilities/pdf/common/downloadPdf';
import { Company } from '../../../store/slice/auth.slice';

enum InvoiceStatus {
  settled = 'settled',
  outstanding = 'outstanding',
  partially_settled = 'partially_settled',
}

const InvoiceList = () => {
  const navigate = useNavigate();

  const { setInvoiceEditData } = useEditFormStore();

  const [startDate, setStartDate] = useState<Date | string | null>(
    dayjs().startOf('M').toDate()
  );

  const [endDate, setEndDate] = useState<Date | string | null>(
    dayjs().endOf('M').toDate()
  );

  const [isLifeTime, setIsLifeTime] = useState(false);

  const [clientId, setClientId] = useState('');

  const [clientSearchQuery, setClientSearchQuery] = useState('');

  const { data: clients } = useFetchClients({
    limit: 5,
    searchQuery: clientSearchQuery,
  });

  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus | ''>('');

  const { company } = useAuthState();

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
      REACT_QUERY_KEYS.INVOICE_LIST,
      company!.CompanyId,
      isLifeTime,
      startDate,
      endDate,
      clientId,
    ],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbPayment.getInvoices({
        lmt: DisplayCount.INVOICE_LIST,
        lastDoc: pageParam,
        cmpId: company!.CompanyId,
        isLifeTime,
        startDate,
        endDate,
        clientId,
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

  const [data, setData] = useState<IInvoicesCollection[]>(() => {
    if (snapshotData) {
      return snapshotData.pages.flatMap((page) =>
        page.map((doc) => doc.data() as IInvoicesCollection)
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
      const docData: IInvoicesCollection[] = [];
      snapshotData.pages?.forEach((page) => {
        page?.forEach((doc) => {
          const data = doc.data() as IInvoicesCollection;
          docData.push(data);
        });
      });

      //*Set data according to selected status

      if (!selectedStatus || selectedStatus?.length === 0) {
        setData(docData);
        return;
      }

      if (selectedStatus === 'outstanding') {
        setData(docData.filter((res) => res.InvoiceReceivedAmount === 0));
      }

      if (selectedStatus === 'partially_settled') {
        setData(
          docData.filter(
            (res) =>
              res.InvoiceReceivedAmount &&
              res.InvoiceReceivedAmount !== res.InvoiceTotalAmount
          )
        );
      }

      if (selectedStatus === 'settled') {
        setData(
          docData.filter(
            (res) =>
              res.InvoiceReceivedAmount &&
              res.InvoiceReceivedAmount === res.InvoiceTotalAmount
          )
        );
      }
    }
  }, [snapshotData, selectedStatus]);

  // hook for pagination
  const { ref, inView } = useInView();

  // this is for pagination
  useEffect(() => {
    if (inView && hasNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [fetchNextPage, inView, hasNextPage, isFetching]);

  const downloadInvoice = async (invoiceData: IInvoicesCollection) => {
    if (!company) return;
    try {
      showModalLoader({});

      const clientSnapshot = await DbClient.getClientById(
        invoiceData.InvoiceClientId
      );
      const clientData = clientSnapshot.data() as IClientsCollection;

      const companyDetails: Company = {
        ...company,
        CompanyEmail: invoiceData.InvoiceCompanyEmail ?? company.CompanyEmail,
        CompanyPhone: invoiceData.InvoiceCompanyPhone ?? company.CompanyPhone,
      };

      const html = generateInvoiceHTML({
        companyDetails,
        invoiceData,
        clientBalance: clientData.ClientBalance,
      });

      const response = await htmlToPdf({ file_name: 'invoice.pdf', html });

      downloadPdf(response, 'invoice.pdf');

      closeModalLoader();
    } catch (error) {
      console.log(error);
      errorHandler(error);
      closeModalLoader();
    }
  };

  //*Hook to fetch recent invoice number
  useUpdateRecentTransactionNumbers();

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <PageHeader
        title="Invoices"
        rightSection={
          <Button
            type="black"
            label="Generate new invoice"
            onClick={() => {
              setInvoiceEditData(null);
              navigate(PageRoutes.INVOICE_GENERATE);
            }}
            className="px-4 py-2"
          />
        }
      />
      <div className="flex items-start justify-between w-full gap-4 p-4 rounded bg-surface shadow">
        <div className="flex flex-col gap-4 w-full">
          <DateFilterDropdown
            endDate={endDate}
            isLifetime={isLifeTime}
            setEndDate={setEndDate}
            setIsLifetime={setIsLifeTime}
            setStartDate={setStartDate}
            startDate={startDate}
          />
          <div className="flex font-semibold gap-2 items-center">
            <span className="text-textSecondary"> Total Invoice Amount: </span>
            {numberFormatter(
              data.reduce((acc, obj) => acc + obj.InvoiceTotalAmount, 0),
              true
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-4">
          <div className="flex items-center gap-4 w-full justify-end">
            <InputSelect
              placeholder="Select Client"
              searchable
              searchValue={clientSearchQuery}
              onSearchChange={(e) => {
                setClientSearchQuery(e);
                const selectedClient = clients.find((c) => c.ClientName === e);
                if (selectedClient) {
                  setClientId(selectedClient.ClientId);
                } else {
                  setClientId('');
                }
              }}
              clearable
              data={clients.map((res) => {
                return { label: res.ClientName, value: res.ClientId };
              })}
            />
            <InputSelect
              placeholder="Status"
              searchable
              clearable
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e as InvoiceStatus)}
              data={[
                { label: 'Settled', value: InvoiceStatus.settled },
                { label: 'Outstanding', value: InvoiceStatus.outstanding },
                {
                  label: 'Partially Settled',
                  value: InvoiceStatus.partially_settled,
                },
              ]}
            />
          </div>
          <div className="flex font-semibold gap-2 items-center">
            <span className="text-textSecondary"> Total Pending Amount: </span>
            {numberFormatter(
              data.reduce(
                (acc, obj) =>
                  acc + (obj.InvoiceTotalAmount - obj.InvoiceReceivedAmount),
                0
              ),
              true
            )}
          </div>
        </div>
      </div>

      <table className="rounded overflow-hidden w-full">
        <thead className="bg-primary text-surface text-sm">
          <tr>
            <th className="uppercase px-4 py-2 w-[15%] text-start">
              Customer Name
            </th>
            <th className="uppercase px-4 py-2 w-[15%] text-start">
              Location Name
            </th>
            <th className="uppercase px-4 py-2 w-[10%] text-start">
              Invoice No.
            </th>
            <th className="uppercase px-4 py-2 w-[10%] text-start">Items</th>
            <th className="uppercase px-4 py-2 w-[15%] text-start">Date</th>

            <th className="uppercase px-4 py-2 w-[10%] text-start">Total</th>
            <th className="uppercase px-4 py-2 w-[10%] text-start">Received</th>
            <th className="uppercase px-4 py-2 w-[10%] text-start">Pending</th>
            <th className="uppercase px-4 py-2 w-[5%] text-end"></th>
          </tr>
        </thead>
        <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
          {data.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={9}>
                <NoSearchResult />
              </td>
            </tr>
          ) : (
            data.map((invoice) => {
              return (
                <tr key={invoice.InvoiceId}>
                  <td
                    onClick={() => {
                      setInvoiceEditData(invoice);
                      navigate(PageRoutes.INVOICE_GENERATE);
                    }}
                    className="align-top cursor-pointer px-4 py-2 text-start "
                  >
                    <span className="line-clamp-3">
                      {invoice.InvoiceClientName}
                    </span>
                  </td>
                  <td
                    onClick={() => {
                      setInvoiceEditData(invoice);
                      navigate(PageRoutes.INVOICE_GENERATE);
                    }}
                    className="align-top cursor-pointer px-4 py-2 text-start "
                  >
                    <span className="line-clamp-3">
                      {invoice.InvoiceLocationName ?? 'N/A'}
                    </span>
                  </td>
                  <td
                    onClick={() => {
                      setInvoiceEditData(invoice);
                      navigate(PageRoutes.INVOICE_GENERATE);
                    }}
                    className="align-top cursor-pointer px-4 py-2 text-start"
                  >
                    {invoice.InvoiceNumber}
                  </td>

                  <td
                    onClick={() => {
                      setInvoiceEditData(invoice);
                      navigate(PageRoutes.INVOICE_GENERATE);
                    }}
                    className="align-top cursor-pointer px-4 py-2 text-start"
                  >
                    <span className="line-clamp-4">
                      {invoice.InvoiceItems.map(
                        (item) => item.ItemDescription
                      ).join(',')}
                    </span>
                  </td>
                  <td
                    onClick={() => {
                      setInvoiceEditData(invoice);
                      navigate(PageRoutes.INVOICE_GENERATE);
                    }}
                    className="align-top cursor-pointer px-4 py-2 text-start"
                  >
                    {formatDate(invoice.InvoiceDate)}
                  </td>
                  <td
                    onClick={() => {
                      setInvoiceEditData(invoice);
                      navigate(PageRoutes.INVOICE_GENERATE);
                    }}
                    className="align-top cursor-pointer px-4 py-2 text-start "
                  >
                    {numberFormatter(invoice.InvoiceTotalAmount, true)}
                  </td>
                  <td
                    onClick={() => {
                      setInvoiceEditData(invoice);
                      navigate(PageRoutes.INVOICE_GENERATE);
                    }}
                    className="align-top cursor-pointer px-4 py-2 text-start "
                  >
                    <div className="flex items-center gap-4">
                      <span>
                        {numberFormatter(invoice.InvoiceReceivedAmount, true)}
                      </span>

                      {invoice.InvoiceTotalAmount ===
                        invoice.InvoiceReceivedAmount && (
                        <span className="bg-primaryGreen rounded-full size-6 p-2 flex items-center justify-center">
                          <MdOutlineDone className="font-bold min-w-[20px] text-surface" />
                        </span>
                      )}

                      {invoice.InvoiceReceivedAmount === 0 && (
                        <span className="bg-primaryRed rounded-full size-6 p-2 flex items-center justify-center">
                          <MdClear className="font-bold min-w-[20px] text-surface" />
                        </span>
                      )}

                      {invoice.InvoiceReceivedAmount > 0 &&
                        invoice.InvoiceReceivedAmount !==
                          invoice.InvoiceTotalAmount && (
                          <MdIncompleteCircle className="size-6 text-textPrimaryBlue" />
                        )}
                    </div>
                  </td>
                  <td
                    onClick={() => {
                      setInvoiceEditData(invoice);
                      navigate(PageRoutes.INVOICE_GENERATE);
                    }}
                    className="align-top cursor-pointer px-4 py-2 text-start "
                  >
                    {numberFormatter(
                      invoice.InvoiceTotalAmount -
                        invoice.InvoiceReceivedAmount,
                      true
                    )}
                  </td>
                  <td
                    onClick={() => downloadInvoice(invoice)}
                    className="align-top px-4 py-2 text-end cursor-pointer text-xl text-textPrimaryBlue "
                  >
                    <MdOutlinePrint />
                  </td>
                </tr>
              );
            })
          )}
          <tr ref={ref}>
            <td colSpan={9}>
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

export default InvoiceList;
