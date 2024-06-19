import { useEffect, useState } from 'react';
import Dialog from '../../../common/Dialog';
import useFetchLocations from '../../../hooks/fetch/useFetchLocations';
import InputSelect from '../../../common/inputs/InputSelect';
import {
  ICalloutsCollection,
  IInvoiceItems,
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
import { useFormContext } from 'react-hook-form';
import { InvoiceFormFields } from '../../../utilities/zod/schema';

const ClientCostCalculationModal = ({
  opened,
  setOpened,
  clientId,
  setInvoiceItems,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
  clientId: string;
  setInvoiceItems: React.Dispatch<React.SetStateAction<IInvoiceItems[]>>;
}) => {
  const { setValue } = useFormContext<InvoiceFormFields>();

  const [locationSearchQuery, setLocationSearchQuery] = useState('');

  const [locationId, setLocationId] = useState('');

  const { data: locations } = useFetchLocations({
    clientId: clientId,
    searchQuery: locationSearchQuery,
    limit: 5,
  });

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

      if (!locationId) {
        throw new CustomError('Please select location');
      }

      const selectedLocation = locations.find(
        (loc) => loc.LocationId === locationId
      );

      if (!selectedLocation) {
        throw new CustomError('Please select location');
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
      } = selectedLocation;

      if (isCalculationReqForShift) {
        const shiftSnapshot = await DbClient.getAllShiftsOfLocation(
          locationId,
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
            const {
              ShiftAssignedUserId,
              ShiftStartTime,
              ShiftEndTime,
              ShiftCurrentStatus,
            } = shift;

            if (
              Array.isArray(ShiftCurrentStatus) &&
              ShiftCurrentStatus.some((status) => status.Status === 'completed')
            ) {
              let shiftHours = getHoursDiffInTwoTimeString(
                ShiftStartTime,
                ShiftEndTime
              );

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
          await DbClient.getAllPatrolsOfLocation(locationId);
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
          locationId,
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

  useEffect(() => {
    const selectedLocation = locations.find(
      (loc) => loc.LocationId === locationId
    );
    if (selectedLocation) {
      setValue('InvoiceLocationId', locationId);
      setValue('InvoiceLocationName', selectedLocation.LocationName);
    } else {
      setValue('InvoiceLocationId', null);
      setValue('InvoiceLocationName', null);
    }
  }, [locationId]);

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
        <InputSelect
          label="Select Location"
          value={locationId}
          onChange={(e) => setLocationId(e as string)}
          data={locations.map((res) => {
            return { label: res.LocationName, value: res.LocationId };
          })}
          searchValue={locationSearchQuery}
          onSearchChange={setLocationSearchQuery}
          searchable
          clearable
          className="col-span-2"
        />

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
