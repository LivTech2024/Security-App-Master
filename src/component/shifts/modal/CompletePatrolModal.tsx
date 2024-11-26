import { useState } from 'react';
import {
  IShiftLinkedPatrolsChildCollection,
  IShiftsCollection,
} from '../../../@types/database';
import Dialog from '../../../common/Dialog';
import { useShowLoader } from '../../../hooks/useShowLoader';
import DbPatrol from '../../../firebase_configs/DB/DbPatrol';
import { toDate } from '../../../utilities/misc';
import InputWithTopHeader from '../../../common/inputs/InputWithTopHeader';
import InputDate from '../../../common/inputs/InputDate';
import { errorHandler } from '../../../utilities/CustomError';
import { useAuthState } from '../../../store';

interface CompletePatrolModalProps {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
  linkedPatrol: IShiftLinkedPatrolsChildCollection | null;
  empDetails: { EmpName: string; EmpId: string } | null;
  shift: IShiftsCollection;
  hitCount: number;
  shouldRefetch: React.Dispatch<React.SetStateAction<boolean>>;
}

const CompletePatrolModal = ({
  opened,
  setOpened,
  linkedPatrol,
  empDetails,
  shift,
  hitCount,
  shouldRefetch,
}: CompletePatrolModalProps) => {
  const { settings } = useAuthState();

  const [loading, setLoading] = useState(false);

  const [startedAt, setStartedAt] = useState<Date | null>(null);

  const [endedAt, setEndedAt] = useState<Date | null>(null);

  const onSubmit = async () => {
    if (
      !linkedPatrol ||
      !shift ||
      !empDetails ||
      !startedAt ||
      !endedAt ||
      !settings?.SettingIsPatrolCompleteOptionEnabled
    )
      return;
    try {
      const reqHitCount = linkedPatrol.LinkedPatrolReqHitCount;
      setLoading(true);
      await DbPatrol.createPatrolLog({
        empDetails,
        reqHitCount,
        shiftId: shift.ShiftId,
        shiftDate: toDate(shift.ShiftDate),
        endedAt,
        startedAt,
        hitCount,
        patrolId: linkedPatrol.LinkedPatrolId,
      });
      setLoading(false);
      shouldRefetch((prev) => !prev);
    } catch (error) {
      errorHandler(error);
      console.log(error);
      setLoading(false);
    }
  };

  useShowLoader(loading);

  if (!linkedPatrol || !empDetails) {
    return <div></div>;
  }

  return (
    <Dialog
      opened={opened}
      setOpened={setOpened}
      title={`Complete patrol`}
      size="60%"
      positiveCallback={onSubmit}
      disableSubmit={
        !startedAt ||
        !endedAt ||
        !settings?.SettingIsPatrolCompleteOptionEnabled
      }
    >
      <div className="flex flex-col gap-4">
        {/* Patrol details */}
        <div className="flex flex-col">
          <div className="flex items-center gap-4 justify-between w-full">
            <div>
              <span className="font-semibold">Patrol Name:</span>{' '}
              {linkedPatrol.LinkedPatrolName}
            </div>
            <div>
              <span className="font-semibold">Employee Name:</span>{' '}
              {empDetails.EmpName}
            </div>
          </div>
          <div className="flex items-center gap-4 justify-between w-full">
            <div>
              <span className="font-semibold">Required Hit:</span>{' '}
              {linkedPatrol.LinkedPatrolReqHitCount}
            </div>
            <div>
              <span className="font-semibold">Completed Hit:</span> {0}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputWithTopHeader
            className="mx-0"
            label="Hit count"
            value={hitCount}
            disabled
          />
          <InputDate
            label="Started At"
            value={startedAt}
            type="date_time"
            setValue={setStartedAt}
          />
          <InputDate
            label="Ended At"
            value={endedAt}
            type="date_time"
            setValue={setEndedAt}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default CompletePatrolModal;
