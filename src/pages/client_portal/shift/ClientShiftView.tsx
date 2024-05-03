import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { IShiftsCollection } from '../../../@types/database';
import DbShift from '../../../firebase_configs/DB/DbShift';
import NoSearchResult from '../../../common/NoSearchResult';
import { formatDate } from '../../../utilities/misc';
import DbEmployee from '../../../firebase_configs/DB/DbEmployee';
import PageHeader from '../../../common/PageHeader';

const ClientShiftView = () => {
  const [searchParam] = useSearchParams();

  const shiftId = searchParam.get('id');

  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<IShiftsCollection | null>(null);

  const [assignedUsers, setAssignedUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!shiftId) return;
    DbShift.getShiftById(shiftId).then(async (snapshot) => {
      const shiftData = snapshot.data() as IShiftsCollection;
      if (shiftData) {
        setData(shiftData);

        const { ShiftAssignedUserId } = shiftData;

        await Promise.all(
          ShiftAssignedUserId.map(async (id) => {
            const empData = await DbEmployee.getEmpById(id);

            setAssignedUsers((prev) => {
              if (!prev.includes(empData.EmployeeName)) {
                return [...prev, empData.EmployeeName];
              }
              return prev;
            });
          })
        );
      }
      setLoading(false);
    });
  }, [shiftId]);

  if (!data && !loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <NoSearchResult />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6 animate-pulse">
        <PageHeader title="Shift data" />

        <div className="h-[40vh] bg-shimmerColor w-full"></div>
      </div>
    );
  }

  if (data)
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6">
        <PageHeader title="Shift data" />

        <div className="bg-surface shadow-md rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold">Shift Name:</p>
              <p>{data?.ShiftName || 'N/A'}</p>
            </div>
            <div>
              <p className="font-semibold">Shift Position:</p>
              <p>{data?.ShiftPosition || 'N/A'}</p>
            </div>
            <div>
              <p className="font-semibold">Shift Date:</p>
              <p>{data?.ShiftDate ? formatDate(data?.ShiftDate) : 'N/A'}</p>
            </div>
            <div>
              <p className="font-semibold">Shift Start Time:</p>
              <p>{data?.ShiftStartTime || 'N/A'}</p>
            </div>
            <div>
              <p className="font-semibold">Shift End Time:</p>
              <p>{data?.ShiftEndTime || 'N/A'}</p>
            </div>
            <div>
              <p className="font-semibold">Shift Location:</p>
              <p>{data?.ShiftLocationName || 'N/A'}</p>
              {data?.ShiftLocationAddress && (
                <p>{data?.ShiftLocationAddress}</p>
              )}
            </div>
            <div>
              <p className="font-semibold">Shift Restricted Radius:</p>
              <p>
                {data?.ShiftEnableRestrictedRadius
                  ? `${data?.ShiftRestrictedRadius} meters`
                  : 'Not enabled'}
              </p>
            </div>
            <div>
              <p className="font-semibold">Shift Description:</p>
              <p>{data?.ShiftDescription || 'N/A'}</p>
            </div>
            <div>
              <p className="font-semibold">Shift Assigned Users:</p>
              <p className="flex flex-col">
                {assignedUsers.join(' , ') || 'N/A'}
              </p>
            </div>

            <div>
              <p className="font-semibold">Shift Current Status</p>
              <ul className="px-4">
                {data?.ShiftCurrentStatus &&
                data?.ShiftCurrentStatus?.length > 0 ? (
                  data?.ShiftCurrentStatus?.map((data, idx) => {
                    return (
                      <li key={idx} className="capitalize list-decimal">
                        {data.Status} by {data.StatusReportedByName}
                      </li>
                    );
                  })
                ) : (
                  <li className="capitalize list-decimal">Pending</li>
                )}
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-1 mt-4">
            <p className="font-semibold">Shift Tasks</p>
            <div className="flex flex-wrap gap-6 h-full">
              {data.ShiftTask.length > 0
                ? data.ShiftTask.map((task, idx) => {
                    return (
                      <div className="flex flex-col ">
                        <span className="text-lg font-semibold">
                          {idx + 1}. {task.ShiftTask}
                        </span>
                        {task?.ShiftTaskStatus?.length > 0 ? (
                          <div className="flex flex-col gap-4 h-full w-full justify-between">
                            {task.ShiftTaskStatus?.map((s) => {
                              return (
                                <div className="justify-between h-full bg-onHoverBg rounded p-4 ">
                                  <div className=" flex flex-col ">
                                    <span className="capitalize">
                                      Status: {s.TaskStatus}
                                    </span>
                                    <span>
                                      Employee: {s.TaskCompletedByName}
                                    </span>
                                    <span>
                                      Completion Time:{' '}
                                      {formatDate(
                                        s.TaskCompletionTime,
                                        'DD MMM-YY hh-mm A'
                                      )}
                                    </span>
                                    {s.TaskPhotos?.length ? (
                                      <span>Images: </span>
                                    ) : null}
                                    {s.TaskPhotos?.map((img, idx) => {
                                      return (
                                        <a
                                          key={img}
                                          href={img}
                                          target="_blank"
                                          className="cursor-pointer text-textPrimaryBlue"
                                        >
                                          {idx + 1}. {img.slice(0, 30)}...
                                        </a>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="pl-4">Status: Pending</span>
                        )}
                      </div>
                    );
                  })
                : 'N/A'}
            </div>
          </div>

          {/* <div className="flex flex-col gap-1 mt-4">
            <p className="font-semibold">Wellness report</p>
            <div className="flex flex-wrap gap-6">
              {data?.ShiftGuardWellnessReport.length > 0
                ? data?.ShiftGuardWellnessReport?.map((res, idx) => {
                    return (
                      <div key={idx} className="flex flex-col">
                        {res.WellnessEmpName && (
                          <div>Employee Name: {res?.WellnessEmpName}</div>
                        )}
                        {res.WellnessReportedAt && (
                          <div>
                            Reported At:{' '}
                            {formatDate(
                              res?.WellnessReportedAt,
                              'DD MMM-YY hh:mm A'
                            )}
                          </div>
                        )}
                        {res.WellnessComment && (
                          <div>Comment: {res?.WellnessComment}</div>
                        )}
                        {res.WellnessImg && (
                          <div>
                            Image:{' '}
                            <a
                              href={res?.WellnessImg}
                              className="text-textPrimaryBlue cursor-pointer"
                            >
                              {res?.WellnessImg?.slice(0, 30)}...
                            </a>{' '}
                          </div>
                        )}
                      </div>
                    );
                  })
                : 'N/A'}
            </div>
          </div> */}
        </div>
      </div>
    );
};

export default ClientShiftView;
