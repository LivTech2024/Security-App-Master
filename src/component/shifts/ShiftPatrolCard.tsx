import { useEffect, useState } from 'react';
import {
  IPatrolLogsCollection,
  IShiftsCollection,
} from '../../@types/database';
import DbShift from '../../firebase_configs/DB/DbShift';

interface ShiftPatrolCardProps {
  data: IShiftsCollection;
  assignedUsers: { EmpName: string; EmpId: string }[];
}

const ShiftPatrolCard = ({ assignedUsers, data }: ShiftPatrolCardProps) => {
  const [patrolLogsOfShift, setPatrolLogsOfShift] = useState<
    IPatrolLogsCollection[]
  >([]);

  useEffect(() => {
    const totalPatrol = data.ShiftLinkedPatrols.reduce((acc, obj) => {
      return acc + obj.LinkedPatrolReqHitCount;
    }, 0);
    DbShift.getPatrolLogsOfShift({
      shiftId: data.ShiftId,
      lmt: totalPatrol,
    }).then((snapshot) => {
      const logs = snapshot.docs.map(
        (doc) => doc.data() as IPatrolLogsCollection
      );
      setPatrolLogsOfShift(logs);
    });
  }, [data]);

  return (
    <div className="bg-surface shadow-md rounded-lg p-4 flex flex-col gap-4">
      <div className="font-semibold text-lg">
        Patrols associated with this shift
      </div>
      <div className="flex items-center gap-4 flex-wrap w-full">
        {data.ShiftLinkedPatrols?.map((patrol) => {
          return (
            <div
              key={patrol.LinkedPatrolId}
              className="flex flex-col bg-onHoverBg p-4 rounded"
            >
              <div>
                {' '}
                <span className="font-semibold">Name:</span>{' '}
                {patrol.LinkedPatrolName}
              </div>
              <div>
                <span className="font-semibold">Hit count:</span>{' '}
                {patrol.LinkedPatrolReqHitCount}
              </div>
              <div className="font-semibold mt-2">Status:</div>
              <div className="flex flex-col gap-2">
                {assignedUsers.map((user) => {
                  return (
                    <div
                      key={user.EmpId}
                      className="bg-primaryGold/50 py-2 px-[10px] rounded mt-2"
                    >
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">Employee:</span>{' '}
                        {user.EmpName}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">
                          Completed Hit count:
                        </span>{' '}
                        {
                          patrolLogsOfShift.filter(
                            (log) =>
                              log.PatrolId === patrol.LinkedPatrolId &&
                              log.PatrolLogGuardId === user.EmpId
                          ).length
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShiftPatrolCard;
