import { useEffect, useState } from "react";
import { useAuthState } from "../../../store";
import dayjs from "dayjs";
import DateFilterDropdown from "../../../common/dropdown/DateFilterDropdown";
import { useNavigate } from "react-router-dom";
import {
  DisplayCount,
  PageRoutes,
  REACT_QUERY_KEYS,
} from "../../../@types/enum";
import Button from "../../../common/button/Button";
import { useInfiniteQuery } from "@tanstack/react-query";
import DbPayment from "../../../firebase_configs/DB/DbPayment";
import { DocumentData } from "firebase/firestore";
import { IInvoicesCollection } from "../../../@types/database";
import { useInView } from "react-intersection-observer";
import TableShimmer from "../../../common/shimmer/TableShimmer";
import NoSearchResult from "../../../common/NoSearchResult";
import { formatDate } from "../../../utilities/misc";

const InvoiceList = () => {
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState<Date | string | null>(
    dayjs().startOf("M").toDate()
  );

  const [endDate, setEndDate] = useState<Date | string | null>(
    dayjs().endOf("M").toDate()
  );

  const [isLifeTime, setIsLifeTime] = useState(false);

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
    ],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbPayment.getInvoices({
        lmt: DisplayCount.INVOICE_LIST,
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

  const [data, setData] = useState<IInvoicesCollection[]>(() => {
    if (snapshotData) {
      return snapshotData.pages.flatMap((page) =>
        page.map((doc) => doc.data() as IInvoicesCollection)
      );
    }
    return [];
  });

  useEffect(() => {
    console.log(error, "error");
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
      <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
        <span className="font-semibold text-xl">Invoices</span>
        <Button
          type="black"
          label="Generate new invoice"
          onClick={() => navigate(PageRoutes.INVOICE_GENERATE)}
          className="px-4 py-2"
        />
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
      </div>

      <table className="rounded overflow-hidden w-full">
        <thead className="bg-primary text-surface text-sm">
          <tr>
            <th className="uppercase px-4 py-2 w-[20%] text-start">
              Customer Name
            </th>
            <th className="uppercase px-4 py-2 w-[10%] text-start">
              Invoice No.
            </th>
            <th className="uppercase px-4 py-2 w-[35%] text-start">Items</th>
            <th className="uppercase px-4 py-2 w-[15%] text-end">Date</th>

            <th className="uppercase px-4 py-2 w-[20%] text-end">
              Total Amount
            </th>
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
            data.map((invoice) => {
              return (
                <tr key={invoice.InvoiceId}>
                  <td className="align-top px-4 py-2 text-start">
                    <span className="line-clamp-3">
                      {invoice.InvoiceCustomerName}
                    </span>
                  </td>
                  <td className="align-top px-4 py-2 text-start">
                    {invoice.InvoiceNumber}
                  </td>

                  <td className="align-top px-4 py-2 text-start">
                    <span className="line-clamp-2">
                      {invoice.InvoiceItems.map((item) => item.ItemName).join(
                        ","
                      )}
                    </span>
                  </td>
                  <td className="align-top px-4 py-2 text-end">
                    {formatDate(invoice.InvoiceDate)}
                  </td>
                  <td className="align-top px-4 py-2 text-end ">
                    {invoice.InvoiceTotalAmount}
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

export default InvoiceList;
