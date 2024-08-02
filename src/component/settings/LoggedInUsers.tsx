import { useInfiniteQuery } from '@tanstack/react-query';
import { DisplayCount, IUserType, REACT_QUERY_KEYS } from '../../@types/enum';
import { useAuthState } from '../../store';
import DbCompany from '../../firebase_configs/DB/DbCompany';
import {
  IAdminsCollection,
  ILoggedInUsersCollection,
} from '../../@types/database';
import DbEmployee from '../../firebase_configs/DB/DbEmployee';
import { DocumentData } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { formatDate } from '../../utilities/misc';
import { MdOutlinePhoneAndroid } from 'react-icons/md';
import { FaApple, FaChrome } from 'react-icons/fa';

export interface LoggedInUsersCollection extends ILoggedInUsersCollection {
  LoggedInUserName: string;
  LoggedInUserEmail: string;
  LoggedInUserPhone: string;
}

const LoggedInUsers = () => {
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
    queryKey: [REACT_QUERY_KEYS.LOGGEDIN_USERS_LIST, company!.CompanyId],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbCompany.getLoggedInUserOfCompany({
        lmt: DisplayCount.LOGGEDIN_USERS_LIST,
        lastDoc: pageParam,
        cmpId: company!.CompanyId,
      });

      const docData: LoggedInUsersCollection[] = [];

      await Promise.all(
        snapshot?.docs.map(async (doc) => {
          const data = doc.data() as ILoggedInUsersCollection;
          const { LoggedInUserId, LoggedInUserType } = data;

          let LoggedInUserEmail = '',
            LoggedInUserName = '',
            LoggedInUserPhone = '';

          if (LoggedInUserType === IUserType.ADMIN) {
            const adminSnapshot = await DbCompany.getAdminById(LoggedInUserId);
            const admin = adminSnapshot.data() as IAdminsCollection;
            LoggedInUserEmail = admin.AdminEmail;
            LoggedInUserName = admin.AdminName;
            LoggedInUserPhone = admin.AdminPhone;
          } else if (LoggedInUserType === IUserType.EMPLOYEE) {
            const employee = await DbEmployee.getEmpById(LoggedInUserId);
            LoggedInUserEmail = employee.EmployeeEmail;
            LoggedInUserName = employee.EmployeeName;
            LoggedInUserPhone = employee.EmployeePhone;
          }

          docData.push({
            ...data,
            LoggedInUserEmail,
            LoggedInUserName,
            LoggedInUserPhone,
          });
        })
      );
      return { docs: snapshot.docs, docData: docData };
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.docs?.length === 0) {
        return null;
      }
      if (lastPage.docs?.length === DisplayCount.LOGGEDIN_USERS_LIST) {
        return lastPage.docs.at(-1);
      }
      return null;
    },
    initialPageParam: null as null | DocumentData,
  });

  const fetchDataFromSnapshot = () => {
    if (snapshotData) {
      const docData: LoggedInUsersCollection[] = [];
      snapshotData.pages?.forEach((page) => {
        page.docData?.forEach(async (data) => {
          docData.push(data);
        });
      });
      return docData;
    }

    return [];
  };

  const [data, setData] = useState<LoggedInUsersCollection[]>(() =>
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
  return (
    <div className="bg-surface p-4 rounded shadow-md flex flex-col gap-6">
      <div className="font-semibold text-lg">LoggedIn Users</div>
      {/* Received Messages list */}
      <div className="grid grid-cols-2 h-full gap-4 overflow-auto remove-vertical-scrollbar">
        {data.map((res) => {
          return (
            <div
              key={res.LoggedInId}
              className="grid-cols-2 grid bg-onHoverBg p-4 rounded w-full gap-2"
            >
              <div className="flex items-center gap-1">
                <span>Name:</span>
                <span className="font-semibold">
                  {res.LoggedInUserName} ({res.LoggedInUserType.toUpperCase()})
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span>Email:</span>
                <span className="font-semibold">{res.LoggedInUserEmail}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Phone:</span>
                <span className="font-semibold uppercase">
                  {res.LoggedInUserPhone}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span>LoggedIn Time:</span>
                <span className="font-semibold uppercase">
                  {formatDate(res.LoggedInCreatedAt, 'DD MMM-YY HH:mm')}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span>LoggedIn Platform:</span>
                <div className="flex items-center gap-1 font-semibold">
                  <span className="capitalize">{res.LoggedInPlatform}</span>
                  {res?.LoggedInPlatform == 'android' ? (
                    <MdOutlinePhoneAndroid className="text-lg text-textSecondaryLight dark:text-textSecondaryDark" />
                  ) : res.LoggedInPlatform === 'web' ? (
                    <FaChrome className="text-lg text-textSecondaryLight dark:text-textSecondaryDark" />
                  ) : (
                    <FaApple className="text-lg text-textSecondaryLight dark:text-textSecondaryDark" />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={ref}>
          <div>&nbsp;</div>
          {(isLoading || isFetchingNextPage) &&
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="animate-pulse w-full mt-2">
                <div className="h-[150px] bg-shimmerColor w-full"></div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default LoggedInUsers;
