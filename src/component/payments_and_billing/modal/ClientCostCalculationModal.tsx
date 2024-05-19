import { useState } from 'react';
import Dialog from '../../../common/Dialog';
import useFetchLocations from '../../../hooks/fetch/useFetchLocations';
import InputSelect from '../../../common/inputs/InputSelect';
import {
  IInvoiceItems,
  IPatrolsCollection,
  IShiftsCollection,
} from '../../../@types/database';
import SwitchWithSideHeader from '../../../common/switch/SwitchWithSideHeader';
import InputDate from '../../../common/inputs/InputDate';
import { closeModalLoader, showModalLoader } from '../../../utilities/TsxUtils';
import CustomError, { errorHandler } from '../../../utilities/CustomError';
import DbClient from '../../../firebase_configs/DB/DbClient';
import { getHoursDiffInTwoTimeString } from '../../../utilities/misc';
import DbPatrol from '../../../firebase_configs/DB/DbPatrol';

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

      if (!isCalculationReqForPatrol && !isCalculationReqForShift) {
        throw new CustomError(
          'Please select at least one required calculation'
        );
      }

      //*Calculation start
      showModalLoader({});

      const { LocationShiftHourlyRate, LocationPatrolPerHitRate } =
        selectedLocation;

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
            ItemPrice: LocationShiftHourlyRate,
            ItemQuantity: totalShiftHours,
            ItemTotal: totalShiftCostToClient,
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
            ItemPrice: LocationPatrolPerHitRate,
            ItemQuantity: totalPatrols,
            ItemTotal: totalPatrolCostToClient,
          },
        ]);
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
      </div>
    </Dialog>
  );
};

export default ClientCostCalculationModal;
