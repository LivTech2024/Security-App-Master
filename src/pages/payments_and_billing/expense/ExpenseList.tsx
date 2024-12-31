import { useNavigate } from 'react-router-dom';
import { useAuthState, useEditFormStore } from '../../../store';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  DisplayCount,
  PageRoutes,
  REACT_QUERY_KEYS,
} from '../../../@types/enum';
import DbPayment from '../../../firebase_configs/DB/DbPayment';
import { DocumentData } from 'firebase/firestore';
import { IExpensesCollection } from '../../../@types/database';
import { useInView } from 'react-intersection-observer';
import PageHeader from '../../../common/PageHeader';
import Button from '../../../common/button/Button';
import DateFilterDropdown from '../../../common/dropdown/DateFilterDropdown';
import NoSearchResult from '../../../common/NoSearchResult';
import { formatDate } from '../../../utilities/misc';
import { numberFormatter } from '../../../utilities/NumberFormater';
import TableShimmer from '../../../common/shimmer/TableShimmer';
import useUpdateRecentTransactionNumbers from '../../../hooks/useUpdateRecentTransactionNumbers';
import SelectBranch from '../../../common/SelectBranch';

const ExpenseList = () => {
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState<Date | string | null>(
    dayjs().startOf('M').toDate()
  );

  const [endDate, setEndDate] = useState<Date | string | null>(
    dayjs().endOf('M').toDate()
  );

  const [isLifeTime, setIsLifeTime] = useState(false);

  const [selectedBranch, setSelectedBranch] = useState('');

  const { company } = useAuthState();

  const { setExpenseEditData } = useEditFormStore();

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
      REACT_QUERY_KEYS.EXPENSE_LIST,
      company!.CompanyId,
      isLifeTime,
      startDate,
      endDate,
      selectedBranch,
    ],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbPayment.getExpenses({
        lmt: DisplayCount.EXPENSE_LIST,
        lastDoc: pageParam,
        cmpId: company!.CompanyId,
        isLifeTime,
        startDate,
        endDate,
        branchId: selectedBranch,
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

  const [data, setData] = useState<IExpensesCollection[]>(() => {
    if (snapshotData) {
      return snapshotData.pages.flatMap((page) =>
        page.map((doc) => doc.data() as IExpensesCollection)
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
      const docData: IExpensesCollection[] = [];
      snapshotData.pages?.forEach((page) => {
        page?.forEach((doc) => {
          const data = doc.data() as IExpensesCollection;
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

  //*Hook to fetch recent expense number
  useUpdateRecentTransactionNumbers();

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <PageHeader
        title="Expenses"
        rightSection={
          <Button
            type="black"
            label="Create New Expense"
            onClick={() => {
              setExpenseEditData(null);
              navigate(PageRoutes.EXPENSE_CREATE_OR_EDIT);
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
        </div>
        <SelectBranch
          selectedBranch={selectedBranch}
          setSelectedBranch={setSelectedBranch}
        />
      </div>

      <table className="rounded overflow-hidden w-full">
        <thead className="bg-primary text-surface text-sm">
          <tr>
            <th className="uppercase px-4 py-2 w-[15%] text-start">
              Expense No.
            </th>
            <th className="uppercase px-4 py-2 w-[15%] text-start">Category</th>
            <th className="uppercase px-4 py-2 w-[10%] text-start">
              Sub-category
            </th>
            <th className="uppercase px-4 py-2 w-[10%] text-start">Date</th>

            <th className="uppercase px-4 py-2 w-[10%] text-start">Total</th>
            <th className="uppercase px-4 py-2 w-[10%] text-start">Paid</th>
            <th className="uppercase px-4 py-2 w-[5%] text-end">Receipt</th>
          </tr>
        </thead>
        <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
          {data.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={7}>
                <NoSearchResult />
              </td>
            </tr>
          ) : (
            data.map((expense) => {
              return (
                <tr key={expense.ExpenseId}>
                  <td
                    onClick={() => {
                      navigate(PageRoutes.EXPENSE_CREATE_OR_EDIT);
                      setExpenseEditData(expense);
                    }}
                    className="align-top cursor-pointer px-4 py-2 text-start "
                  >
                    <span className="line-clamp-3">
                      {expense.ExpenseNumber}
                    </span>
                  </td>
                  <td
                    onClick={() => {
                      navigate(PageRoutes.EXPENSE_CREATE_OR_EDIT);
                      setExpenseEditData(expense);
                    }}
                    className="align-top cursor-pointer px-4 py-2 text-start "
                  >
                    <span className="line-clamp-3">
                      {expense.ExpenseCategory ?? 'N/A'}
                    </span>
                  </td>
                  <td
                    onClick={() => {
                      navigate(PageRoutes.EXPENSE_CREATE_OR_EDIT);
                      setExpenseEditData(expense);
                    }}
                    className="align-top cursor-pointer px-4 py-2 text-start"
                  >
                    <span className="line-clamp-3">
                      {expense.ExpenseSubCategory ?? 'N/A'}
                    </span>
                  </td>

                  <td
                    onClick={() => {
                      navigate(PageRoutes.EXPENSE_CREATE_OR_EDIT);
                      setExpenseEditData(expense);
                    }}
                    className="align-top cursor-pointer px-4 py-2 text-start"
                  >
                    <span className="line-clamp-4">
                      {formatDate(expense.ExpenseDate)}
                    </span>
                  </td>
                  <td
                    onClick={() => {
                      navigate(PageRoutes.EXPENSE_CREATE_OR_EDIT);
                      setExpenseEditData(expense);
                    }}
                    className="align-top cursor-pointer px-4 py-2 text-start"
                  >
                    {numberFormatter(expense.ExpenseAmount, true)}
                  </td>
                  <td
                    onClick={() => {
                      setExpenseEditData(expense);
                      navigate(PageRoutes.EXPENSE_CREATE_OR_EDIT);
                    }}
                    className="align-top cursor-pointer px-4 py-2 text-start "
                  >
                    {numberFormatter(expense.ExpensePaidAmount, true)}
                  </td>
                  <td className="align-top cursor-pointer px-4 py-2 text-end">
                    {expense.ExpenseReceipt ? (
                      <a
                        href={expense.ExpenseReceipt}
                        target="_blank"
                        className="text-textPrimaryBlue underline"
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

export default ExpenseList;
