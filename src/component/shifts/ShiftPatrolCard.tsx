import { useEffect, useState } from 'react';
import {
  IPatrolLogsCollection,
  IShiftLinkedPatrolsChildCollection,
  IShiftsCollection,
} from '../../@types/database';
import DbShift from '../../firebase_configs/DB/DbShift';
import Button from '../../common/button/Button';
import CompletePatrolModal from './modal/CompletePatrolModal';
import { useAuthState } from '../../store';
import { useSearchParams } from 'react-router-dom';
import { IDevelopmentDetails } from '../../@types/enum';

interface ShiftPatrolCardProps {
  data: IShiftsCollection;
  assignedUsers: { EmpName: string; EmpId: string }[];
}

const ShiftPatrolCard = ({ assignedUsers, data }: ShiftPatrolCardProps) => {
  const { settings } = useAuthState();

  const [searchParam] = useSearchParams();

  const dev = searchParam.get('dev');

  const [patrolLogsOfShift, setPatrolLogsOfShift] = useState<
    IPatrolLogsCollection[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [completePatrolModal, setCompletePatrolModal] = useState(false);

  const [shouldRefetch, setShouldRefetch] = useState(false);

  useEffect(() => {
    const totalPatrol = data.ShiftLinkedPatrols.reduce((acc, obj) => {
      return acc + obj.LinkedPatrolReqHitCount;
    }, 0);
    DbShift.getPatrolLogsOfShift({
      shiftId: data.ShiftId,
      lmt: totalPatrol ? totalPatrol : 1,
    })
      .then((snapshot) => {
        const logs = snapshot.docs.map(
          (doc) => doc.data() as IPatrolLogsCollection
        );
        setPatrolLogsOfShift(logs);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, [data, shouldRefetch]);

  const getEmpPatrolLog = (patrolId: string, empId: string) => {
    return patrolLogsOfShift.filter(
      (log) => log.PatrolId === patrolId && log.PatrolLogGuardId === empId
    );
  };

  const [selectedPatrol, setSelectedPatrol] = useState<{
    linkedPatrol: IShiftLinkedPatrolsChildCollection | null;
    empDetails: { EmpName: string; EmpId: string } | null;
    hitCount: number;
  }>({ empDetails: null, linkedPatrol: null, hitCount: 0 });

  if (
    loading ||
    !data.ShiftLinkedPatrols.reduce((acc, obj) => {
      return acc + obj.LinkedPatrolReqHitCount;
    }, 0)
  ) {
    return <div></div>;
  }

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
                  const completedCount =
                    getEmpPatrolLog(patrol.LinkedPatrolId, user.EmpId).length ||
                    0;
                  return (
                    <div
                      key={user.EmpId}
                      className={`py-2 px-[10px] rounded mt-2 ${
                        completedCount === 0
                          ? 'bg-pending'
                          : completedCount === patrol.LinkedPatrolReqHitCount
                            ? 'bg-completed'
                            : 'bg-started'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">Employee:</span>{' '}
                        {user.EmpName}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">
                          Completed Hit count:
                        </span>{' '}
                        {completedCount}
                      </div>
                      {completedCount < patrol.LinkedPatrolReqHitCount &&
                        settings?.SettingIsPatrolCompleteOptionEnabled &&
                        dev == IDevelopmentDetails.DEV_NAME && (
                          <Button
                            label="Complete"
                            onClick={() => {
                              setCompletePatrolModal(true);
                              setSelectedPatrol({
                                linkedPatrol: patrol,
                                empDetails: user,
                                hitCount: completedCount + 1,
                              });
                            }}
                            type="black"
                            className="mt-1 text-xs px-2 py-[6px]"
                          />
                        )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        <CompletePatrolModal
          opened={completePatrolModal}
          setOpened={setCompletePatrolModal}
          linkedPatrol={selectedPatrol?.linkedPatrol}
          empDetails={selectedPatrol?.empDetails}
          shift={data}
          hitCount={selectedPatrol.hitCount}
          shouldRefetch={setShouldRefetch}
        />
      </div>
    </div>
  );
};

export default ShiftPatrolCard;
