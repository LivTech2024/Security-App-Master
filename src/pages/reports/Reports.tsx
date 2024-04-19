import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useAuthState } from '../../store';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { DisplayCount, PageRoutes, REACT_QUERY_KEYS } from '../../@types/enum';
import DbCompany from '../../firebase_configs/DB/DbCompany';
import { DocumentData } from 'firebase/firestore';
import {
  IReportCategoriesCollection,
  IReportsCollection,
} from '../../@types/database';
import { useInView } from 'react-intersection-observer';
import Button from '../../common/button/Button';
import ReportCategoriesModal from '../../component/report/modal/ReportCategoriesModal';
import ReportListTable from '../../component/report/ReportListTable';
import ReportListMenu from '../../component/report/ReportListMenu';

const Reports = () => {
  const [startDate, setStartDate] = useState<Date | string | null>(
    dayjs().startOf('M').toDate()
  );

  const [endDate, setEndDate] = useState<Date | string | null>(
    dayjs().endOf('M').toDate()
  );

  const [isLifeTime, setIsLifeTime] = useState(false);

  const [branchId, setBranchId] = useState('');

  const [categoryId, setCategoryId] = useState('');

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
      REACT_QUERY_KEYS.REPORT_LIST,
      company!.CompanyId,
      isLifeTime,
      startDate,
      endDate,
      branchId,
      categoryId,
    ],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbCompany.getReports({
        lmt: DisplayCount.REPORT_LIST,
        lastDoc: pageParam,
        cmpId: company!.CompanyId,
        isLifeTime,
        startDate,
        endDate,
        branchId,
        categoryId,
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

  const [data, setData] = useState<IReportsCollection[]>(() => {
    if (snapshotData) {
      return snapshotData.pages.flatMap((page) =>
        page.map((doc) => doc.data() as IReportsCollection)
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
      const docData: IReportsCollection[] = [];
      snapshotData.pages?.forEach((page) => {
        page?.forEach((doc) => {
          const data = doc.data() as IReportsCollection;
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

  const { data: categoriesSnapshot, isLoading: isCategoriesLoading } = useQuery(
    {
      queryKey: [REACT_QUERY_KEYS.REPORT_CATEGORIES, company!.CompanyId],
      queryFn: async () => {
        const snapshot = await DbCompany.getReportCategories(
          company!.CompanyId
        );
        return snapshot.docs;
      },
    }
  );

  const [categories, setCategories] = useState<IReportCategoriesCollection[]>(
    () => {
      if (categoriesSnapshot) {
        return categoriesSnapshot.map(
          (doc) => doc.data() as IReportCategoriesCollection
        );
      }
      return [];
    }
  );

  useEffect(() => {
    if (categoriesSnapshot) {
      const docData = categoriesSnapshot.map(
        (doc) => doc.data() as IReportCategoriesCollection
      );
      setCategories(docData);
    }
  }, [categoriesSnapshot]);

  const [reportCategoriesModal, setReportCategoriesModal] = useState(false);

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
        <span className="font-semibold text-xl">Reports</span>
        <Button
          label="Report Categories"
          onClick={() => setReportCategoriesModal(true)}
          type="black"
        />
      </div>
      <ReportCategoriesModal
        opened={reportCategoriesModal}
        setOpened={setReportCategoriesModal}
        categories={categories}
        isCategoriesLoading={isCategoriesLoading}
      />
      <ReportListMenu
        branchId={branchId}
        categories={categories}
        categoryId={categoryId}
        endDate={endDate}
        isLifeTime={isLifeTime}
        setBranchId={setBranchId}
        setCategoryId={setCategoryId}
        setEndDate={setEndDate}
        setIsLifeTime={setIsLifeTime}
        setStartDate={setStartDate}
        startDate={startDate}
      />
      <ReportListTable
        data={data}
        isFetchingNextPage={isFetchingNextPage}
        isLoading={isLoading}
        redirectOnClick={PageRoutes.REPORT_VIEW}
        ref={ref}
      />
    </div>
  );
};

export default Reports;
