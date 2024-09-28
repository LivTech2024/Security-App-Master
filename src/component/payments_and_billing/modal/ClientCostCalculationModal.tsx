import { useState } from 'react';
import Dialog from '../../../common/Dialog';
import {
  ICalloutsCollection,
  IInvoiceItems,
  ILocationsCollection,
  IPatrolsCollection,
  IShiftsCollection,
} from '../../../@types/database';
import SwitchWithSideHeader from '../../../common/switch/SwitchWithSideHeader';
import InputDate from '../../../common/inputs/InputDate';
import { closeModalLoader, showModalLoader } from '../../../utilities/TsxUtils';
import CustomError, { errorHandler } from '../../../utilities/CustomError';
import DbClient from '../../../firebase_configs/DB/DbClient';
import {
  getHoursDiffInTwoTimeString,
  roundNumber,
  toDate,
} from '../../../utilities/misc';
import DbPatrol from '../../../firebase_configs/DB/DbPatrol';
import dayjs from 'dayjs';
import { getShiftActualHours } from '../../../utilities/scheduleHelper';

const ClientCostCalculationModal = ({
  opened,
  setOpened,
  selectedLocation,
  setInvoiceItems,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
  selectedLocation: ILocationsCollection | null;
  setInvoiceItems: React.Dispatch<React.SetStateAction<IInvoiceItems[]>>;
}) => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [isCalculationReqForPatrol, setIsCalculationReqForPatrol] =
    useState(false);

  const [isCalculationReqForShift, setIsCalculationReqForShift] =
    useState(false);

  const [isCalculationReqForCallout, setIsCalculationReqForCallout] =
    useState(false);

  const onSubmit = async () => {
    try {
      if (!startDate || !endDate) {
        throw new CustomError('Start and end dates are required');
      }

      if (!selectedLocation) {
        throw new CustomError('Please select a location');
      }

      if (
        !isCalculationReqForPatrol &&
        !isCalculationReqForShift &&
        !isCalculationReqForCallout
      ) {
        throw new CustomError(
          'Please select at least one required calculation'
        );
      }

      //*Calculation start
      showModalLoader({});

      setInvoiceItems((prev) =>
        prev.filter((item) => item.ItemDescription.length > 0)
      );

      const {
        LocationShiftHourlyRate,
        LocationPatrolPerHitRate,
        LocationCalloutDetails,
        LocationId,
      } = selectedLocation;

      if (isCalculationReqForShift) {
        const shiftSnapshot = await DbClient.getAllShiftsOfLocation(
          LocationId,
          startDate as Date,
          endDate as Date
        );
        const shifts = shiftSnapshot.docs.map(
          (doc) => doc.data() as IShiftsCollection
        );

        let totalShiftCostToClient = 0;
        let totalShiftHours = 0;

        await Promise.all(
          shifts?.map(async (shift) => {
            const { ShiftAssignedUserId, ShiftCurrentStatus } = shift;

            if (
              Array.isArray(ShiftCurrentStatus) &&
              ShiftCurrentStatus.some((status) => status.Status === 'completed')
            ) {
              let { shiftHours } = getShiftActualHours({
                shift,
                timeMarginInMins: 0,
              });

              shiftHours = shiftHours * (ShiftAssignedUserId.length || 0);

              totalShiftCostToClient += shiftHours * LocationShiftHourlyRate;
              totalShiftHours += shiftHours;
            }
          })
        );

        setInvoiceItems((prev) => [
          ...prev,
          {
            ItemDescription: 'Shifts Costs',
            ItemPrice: roundNumber(LocationShiftHourlyRate),
            ItemQuantity: roundNumber(totalShiftHours),
            ItemTotal: roundNumber(totalShiftCostToClient),
          },
        ]);
      }

      if (isCalculationReqForPatrol) {
        const patrolSnapshot =
          await DbClient.getAllPatrolsOfLocation(LocationId);
        const patrolData = patrolSnapshot.docs.map(
          (doc) => doc.data() as IPatrolsCollection
        );

        let totalPatrols = 0;

        await Promise.all(
          patrolData.map(async (res) => {
            const patrolLogsSnapshot = await DbPatrol.getPatrolLogs({
              patrolId: res.PatrolId,
              startDate,
              endDate,
            });
            totalPatrols += patrolLogsSnapshot.size;
          })
        );

        const totalPatrolCostToClient = totalPatrols * LocationPatrolPerHitRate;

        setInvoiceItems((prev) => [
          ...prev,
          {
            ItemDescription: 'Patrol Costs',
            ItemPrice: roundNumber(LocationPatrolPerHitRate),
            ItemQuantity: roundNumber(totalPatrols),
            ItemTotal: roundNumber(totalPatrolCostToClient),
          },
        ]);
      }

      if (isCalculationReqForCallout) {
        const calloutSnapshot = await DbClient.getAllCalloutsOfLocation(
          LocationId,
          startDate,
          endDate
        );
        const callOutData = calloutSnapshot?.docs?.map(
          (doc) => doc.data() as ICalloutsCollection
        );

        if (callOutData && callOutData?.length > 0) {
          const {
            CalloutCostInitialCost,
            CalloutCostInitialMinutes,
            CalloutCostPerHour,
          } = LocationCalloutDetails;

          let calloutCost = 0;

          const totalCallouts = callOutData.length;

          callOutData.map((data) => {
            const { CalloutStatus } = data;
            CalloutStatus.map((status) => {
              const { StatusStartedTime, StatusEndedTime, Status } = status;
              if (
                Status === 'completed' &&
                StatusStartedTime &&
                StatusEndedTime
              ) {
                let totalHours = getHoursDiffInTwoTimeString(
                  dayjs(toDate(StatusStartedTime)).format('HH:mm'),
                  dayjs(toDate(StatusEndedTime)).format('HH:mm')
                );

                const CalloutCostInitialHrs = CalloutCostInitialMinutes / 60;

                if (totalHours > CalloutCostInitialHrs) {
                  calloutCost += CalloutCostInitialCost;
                  totalHours = totalHours - CalloutCostInitialHrs;
                }

                calloutCost += totalHours * CalloutCostPerHour;
              }
            });
          });

          if (calloutCost) {
            setInvoiceItems((prev) => [
              ...prev,
              {
                ItemDescription: 'Callout Costs',
                ItemPrice: roundNumber(CalloutCostPerHour),
                ItemQuantity: roundNumber(totalCallouts),
                ItemTotal: roundNumber(calloutCost),
              },
            ]);
          }
        }
      }

      closeModalLoader();
      setOpened(false);
    } catch (error) {
      console.log(error);
      closeModalLoader();
      errorHandler(error);
    }
  };

  return (
    <Dialog
      opened={opened}
      setOpened={setOpened}
      title="Client Cost Calculation"
      size="60%"
      positiveLabel="Submit"
      positiveCallback={onSubmit}
      isFormModal
    >
      <div className="grid grid-cols-2 gap-4">
        <InputDate
          label="Start Date"
          value={startDate}
          setValue={setStartDate}
        />
        <InputDate label="End Date" value={endDate} setValue={setEndDate} />

        <SwitchWithSideHeader
          label="Generate Patrol Cost"
          className="bg-onHoverBg px-4  py-2 rounded"
          checked={isCalculationReqForPatrol}
          onChange={() =>
            setIsCalculationReqForPatrol(!isCalculationReqForPatrol)
          }
        />
        <SwitchWithSideHeader
          label="Generate Shift Cost"
          className="bg-onHoverBg px-4  py-2 rounded"
          checked={isCalculationReqForShift}
          onChange={() =>
            setIsCalculationReqForShift(!isCalculationReqForShift)
          }
        />
        <SwitchWithSideHeader
          label="Generate Callout Cost"
          className="bg-onHoverBg px-4  py-2 rounded"
          checked={isCalculationReqForCallout}
          onChange={() =>
            setIsCalculationReqForCallout(!isCalculationReqForCallout)
          }
        />
      </div>
    </Dialog>
  );
};

export default ClientCostCalculationModal;
