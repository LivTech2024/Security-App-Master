import { useEffect, useState } from 'react';
import Button from '../../common/button/Button';
import { useEditFormStore } from '../../store';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  IClientsCollection,
  ILocationsCollection,
  IPatrolsCollection,
  IShiftsCollection,
} from '../../@types/database';
import DbClient from '../../firebase_configs/DB/DbClient';
import NoSearchResult from '../../common/NoSearchResult';
import { PageRoutes } from '../../@types/enum';
import { Client } from '../../store/slice/editForm.slice';

import { numberFormatter } from '../../utilities/NumberFormater';
import PageHeader from '../../common/PageHeader';
import DateFilterDropdown from '../../common/dropdown/DateFilterDropdown';
import dayjs from 'dayjs';
import { formatDate, getHoursDiffInTwoTimeString } from '../../utilities/misc';
import DbEmployee from '../../firebase_configs/DB/DbEmployee';
import { closeModalLoader, showModalLoader } from '../../utilities/TsxUtils';
import DbPatrol from '../../firebase_configs/DB/DbPatrol';

interface ILocationCostDetails {
  LocationId: string;
  LocationTotalCompletedShift: number;
  LocationTotalCompletedShiftHours: number;
  LocationTotalShiftCostToCompany: number;
  LocationTotalShiftCostToClient: number;
  LocationTotalCompletedPatrol: number;
  LocationTotalPatrolCostToClient: number;
}

const ClientView = () => {
  const { setClientEditData } = useEditFormStore();

  const [searchParam] = useSearchParams();

  const clientId = searchParam.get('id');

  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState<Date | string | null>(
    dayjs().startOf('M').toDate()
  );

  const [endDate, setEndDate] = useState<Date | string | null>(
    dayjs().endOf('M').toDate()
  );

  const [data, setData] = useState<IClientsCollection | null>(null);

  const [locationCostDetails, setLocationCostDetails] = useState<
    ILocationCostDetails[]
  >([]);

  const [locations, setLocations] = useState<ILocationsCollection[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    if (!clientId) return;
    DbClient?.getClientById(clientId).then(async (snapshot) => {
      const clientData = snapshot.data() as IClientsCollection;
      if (clientData) {
        setData(clientData);
      }
      const locationSnapshot = await DbClient.getClientLocations(clientId);
      const locationData = locationSnapshot.docs.map(
        (doc) => doc.data() as ILocationsCollection
      );
      setLocations(locationData);
      setLoading(false);
    });
  }, [clientId]);

  useEffect(() => {
    setLocationCostDetails([]);
  }, [startDate, endDate]);

  const getLocationCostDetails = async (
    locationId: string,
    shiftHourlyRate: number,
    patrolPerHitRate: number
  ) => {
    if (!startDate || !endDate) return;
    try {
      showModalLoader({});
      //* Fetch Shift Data

      const shiftSnapshot = await DbClient.getAllShiftsOfLocation(
        locationId,
        startDate as Date,
        endDate as Date
      );
      const shifts = shiftSnapshot.docs.map(
        (doc) => doc.data() as IShiftsCollection
      );

      let totalShiftCostToCompany = 0;
      let totalShiftCostToClient = 0;
      let totalShifts = 0;
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
            totalShifts += 1;
            let shiftHours = getHoursDiffInTwoTimeString(
              ShiftStartTime,
              ShiftEndTime
            );

            shiftHours = shiftHours * (ShiftAssignedUserId.length || 1);

            totalShiftCostToClient += shiftHours * shiftHourlyRate;
            totalShiftHours += shiftHours;

            await Promise.all(
              ShiftAssignedUserId?.map(async (empId) => {
                const empData = await DbEmployee.getEmpById(empId);
                if (empData) {
                  const { EmployeePayRate } = empData;
                  totalShiftCostToCompany += EmployeePayRate * shiftHours;
                }
              })
            );
          }
        })
      );

      //*Fetch Patrol Data
      const patrolSnapshot = await DbClient.getAllPatrolsOfLocation(locationId);
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

      const totalPatrolCostToClient = totalPatrols * patrolPerHitRate;

      setLocationCostDetails((prev) => [
        ...prev,
        {
          LocationId: locationId,
          LocationTotalCompletedPatrol: totalPatrols,
          LocationTotalCompletedShift: totalShifts,
          LocationTotalCompletedShiftHours: totalShiftHours,
          LocationTotalPatrolCostToClient: totalPatrolCostToClient,
          LocationTotalShiftCostToClient: totalShiftCostToClient,
          LocationTotalShiftCostToCompany: totalShiftCostToCompany,
        },
      ]);

      closeModalLoader();
      console.log(locationId);
    } catch (error) {
      console.log(error);
      closeModalLoader();
    }
  };

  if (!data && !loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <NoSearchResult />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6 ">
        <PageHeader title="Client data" />

        <div className="h-[40vh] bg-shimmerColor w-full animate-pulse"></div>
      </div>
    );
  }

  if (data)
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6">
        <PageHeader
          title="Client data"
          rightSection={
            <Button
              type="black"
              onClick={() => {
                setClientEditData(data as unknown as Client);
                navigate(PageRoutes.CLIENT_CREATE_OR_EDIT);
              }}
              className="bg-primary text-surface px-4 py-2 rounded"
              label="Edit Client"
            />
          }
        />

        <div className="bg-surface shadow rounded p-4 flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="font-semibold">Client Name:</p>
              <p>{data?.ClientName}</p>
            </div>
            <div>
              <p className="font-semibold">Client Phone:</p>
              <p>{data?.ClientPhone}</p>
            </div>
            <div>
              <p className="font-semibold">Client Email:</p>
              <p>{data?.ClientEmail}</p>
            </div>
            <div>
              <p className="font-semibold">Client Address:</p>
              <p>{data?.ClientAddress ?? 'N/A'}</p>
            </div>

            <div>
              <p className="font-semibold">Client Balance To Date:</p>
              <p>{numberFormatter(data?.ClientBalance, true)}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface shadow rounded p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between w-full gap-4">
            <div className="font-semibold text-lg mt-2">Client Locations</div>
            <DateFilterDropdown
              endDate={endDate}
              setEndDate={setEndDate}
              setStartDate={setStartDate}
              startDate={startDate}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {locations.map((loc) => {
              const costDetails = locationCostDetails.find(
                (res) => res.LocationId === loc.LocationId
              );
              return (
                <div className="grid grid-cols-2 bg-onHoverBg rounded shadow p-4 gap-x-4 gap-y-2">
                  <div className="flex gap-1 items-center even:justify-end">
                    <span className="font-semibold">Location Name: </span>
                    <span>{loc.LocationName}</span>
                  </div>
                  <div className="flex gap-1 items-center even:justify-end">
                    <span className="font-semibold">Contract Amount: </span>
                    <span>
                      {numberFormatter(loc.LocationContractAmount, true)}
                    </span>
                  </div>
                  <div className="flex gap-1 items-center even:justify-end">
                    <span className="font-semibold">Contract Start Date: </span>
                    <span>{formatDate(loc.LocationContractStartDate)}</span>
                  </div>
                  <div className="flex gap-1 items-center even:justify-end">
                    <span className="font-semibold">Contract Start Date: </span>
                    <span>{formatDate(loc.LocationContractEndDate)}</span>
                  </div>
                  <div className="flex gap-1 items-center even:justify-end">
                    <span className="font-semibold">Patrol Per Hit Rate: </span>
                    <span>
                      {numberFormatter(loc.LocationPatrolPerHitRate, true)}
                    </span>
                  </div>
                  <div className="flex gap-1 items-center even:justify-end">
                    <span className="font-semibold">Shift Hourly Rate: </span>
                    <span>
                      {numberFormatter(loc.LocationShiftHourlyRate, true)}
                    </span>
                  </div>
                  {costDetails ? (
                    <div className="flex flex-col gap-4 col-span-2">
                      <div className="grid grid-cols-3 mt-4 bg-primaryGold/50 p-4 rounded gap-2 col-span-2">
                        <div className="flex gap-1 items-center justify-start">
                          <span className="font-semibold">
                            Total Shifts Done:{' '}
                          </span>
                          <span>
                            {numberFormatter(
                              costDetails.LocationTotalCompletedShift,
                              false,
                              1
                            )}
                          </span>
                        </div>
                        <div className="flex gap-1 items-center justify-end col-span-2">
                          <span className="font-semibold">
                            Total Shifts Hours:{' '}
                          </span>
                          <span>
                            {numberFormatter(
                              costDetails.LocationTotalCompletedShiftHours,
                              false,
                              1
                            )}
                          </span>
                        </div>
                        <div className="flex gap-1 items-center">
                          <span className="font-semibold">
                            Cost To Company:{' '}
                          </span>
                          <span>
                            {numberFormatter(
                              costDetails.LocationTotalShiftCostToCompany,
                              true
                            )}
                          </span>
                        </div>
                        <div className="flex gap-1 items-center justify-center">
                          <span className="font-semibold">
                            Cost To Client:{' '}
                          </span>
                          <span>
                            {numberFormatter(
                              costDetails.LocationTotalShiftCostToClient,
                              true
                            )}
                          </span>
                        </div>
                        <div className="flex gap-1 items-center justify-end">
                          <span className="font-semibold">Profit: </span>
                          <span>
                            {numberFormatter(
                              costDetails.LocationTotalShiftCostToClient -
                                costDetails.LocationTotalShiftCostToCompany,
                              true
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 mt-4 bg-primaryGold/50 p-4 rounded gap-2 col-span-2">
                        <div className="flex gap-1 items-center even:justify-end col-span-3">
                          <span className="font-semibold">
                            Total Patrol Done:{' '}
                          </span>
                          <span>
                            {numberFormatter(
                              costDetails.LocationTotalCompletedPatrol,
                              false,
                              1
                            )}
                          </span>
                        </div>
                        <div className="flex gap-1 items-center">
                          <span className="font-semibold">
                            Cost To Client:{' '}
                          </span>
                          <span>
                            {numberFormatter(
                              costDetails.LocationTotalPatrolCostToClient,
                              true
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button
                      label="View Cost Details"
                      onClick={() =>
                        getLocationCostDetails(
                          loc.LocationId,
                          loc.LocationShiftHourlyRate,
                          loc.LocationPatrolPerHitRate
                        )
                      }
                      type="black"
                      className="mt-4"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
};

export default ClientView;
