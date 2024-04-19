import { useEffect, useState } from 'react';
import { IoArrowBackCircle } from 'react-icons/io5';
import Button from '../../common/button/Button';
import { useEditFormStore } from '../../store';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IClientsCollection, IShiftsCollection } from '../../@types/database';
import DbClient from '../../firebase_configs/DB/DbClient';
import NoSearchResult from '../../common/NoSearchResult';
import { PageRoutes } from '../../@types/enum';
import { Client } from '../../store/slice/editForm.slice';
import {
  formatDate,
  getHoursDiffInTwoTimeString,
  toDate,
} from '../../utilities/misc';
import { numberFormatter } from '../../utilities/NumberFormater';
import DbEmployee from '../../firebase_configs/DB/DbEmployee';

const ClientView = () => {
  const { setClientEditData } = useEditFormStore();

  const [searchParam] = useSearchParams();

  const clientId = searchParam.get('id');

  const [loading, setLoading] = useState(true);

  /* const [startDate, setStartDate] = useState<Date | string | null>(
    dayjs().startOf("M").toDate()
  );

  const [endDate, setEndDate] = useState<Date | string | null>(
    dayjs().endOf("M").toDate()
  );

  const [isLifeTime, setIsLifeTime] = useState(false); */

  const [data, setData] = useState<IClientsCollection | null>(null);

  const [totalClientExpToDate, setTotalClientExpToDate] = useState(0);

  const [totalProfitToDate, setTotalProfitToDate] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    if (!clientId) return;
    DbClient?.getClientById(clientId).then(async (snapshot) => {
      const clientData = snapshot.data() as IClientsCollection;
      if (clientData) {
        setData(clientData);
        const shiftSnapshot = await DbClient.getAllShiftsOfClient(
          clientData.ClientId,
          toDate(clientData.ClientContractStartDate),
          toDate(clientData.ClientContractEndDate)
        );
        const shifts = shiftSnapshot.docs?.map(
          (doc) => doc.data() as IShiftsCollection
        );

        let totalCost = 0;
        let totalCostToClient = 0;

        await Promise.all(
          shifts?.map(async (shift) => {
            const {
              ShiftAssignedUserId,
              ShiftStartTime,
              ShiftEndTime,
              ShiftCurrentStatus,
            } = shift;

            if (
              ShiftCurrentStatus.some((status) => status.Status === 'completed')
            ) {
              const shiftHours = getHoursDiffInTwoTimeString(
                ShiftStartTime,
                ShiftEndTime
              );

              totalCostToClient += shiftHours * clientData.ClientHourlyRate;

              await Promise.all(
                ShiftAssignedUserId?.map(async (empId) => {
                  const empData = await DbEmployee.getEmpById(empId);
                  if (empData) {
                    const { EmployeePayRate } = empData;
                    totalCost += EmployeePayRate * shiftHours;
                  }
                })
              );
            }
          })
        );

        setTotalClientExpToDate(totalCost);
        setTotalProfitToDate(totalCostToClient - totalCost);
      }
      setLoading(false);
    });
  }, [clientId]);

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
        <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
          <div
            onClick={() => navigate(-1)}
            className="flex items-center gap-4 cursor-pointer "
          >
            <div className="cursor-pointer">
              <IoArrowBackCircle className="h-6 w-6" />
            </div>
            <div className="font-semibold text-lg">Client data</div>
          </div>
        </div>
        <div className="h-[40vh] bg-shimmerColor w-full animate-pulse"></div>
      </div>
    );
  }

  if (data)
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6">
        <div className="flex justify-between w-full p-4 rounded bg-primaryGold  items-center">
          <div
            onClick={() => navigate(-1)}
            className="flex items-center gap-4 cursor-pointer "
          >
            <div className="cursor-pointer">
              <IoArrowBackCircle className="h-6 w-6" />
            </div>
            <div className="font-semibold text-lg">Client data</div>
          </div>
          <Button
            type="black"
            onClick={() => {
              setClientEditData(data as unknown as Client);
              navigate(PageRoutes.CLIENT_CREATE_OR_EDIT);
            }}
            className="bg-primary text-surface px-4 py-2 rounded"
            label="Edit Client"
          />
        </div>

        {/* <div className="bg-surface shadow-md rounded-lg p-4 flex gap-4">
          <DateFilterDropdown
            endDate={endDate}
            isLifetime={isLifeTime}
            setEndDate={setEndDate}
            setIsLifetime={setIsLifeTime}
            setStartDate={setStartDate}
            startDate={startDate}
          />
        </div> */}
        <div className="bg-surface shadow-md rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
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
              <p className="font-semibold">Contract Start Date:</p>
              <p>{formatDate(data?.ClientContractStartDate)}</p>
            </div>
            <div>
              <p className="font-semibold">Contract End Date:</p>
              <p>{formatDate(data?.ClientContractEndDate)}</p>
            </div>
            <div>
              <p className="font-semibold">Contract Amount:</p>
              <p>{numberFormatter(data?.ClientContractAmount, true)}</p>
            </div>
            <div>
              <p className="font-semibold">Client Hourly Rate:</p>
              <p>{numberFormatter(data?.ClientHourlyRate, true)}</p>
            </div>
            <div>
              <p className="font-semibold">Client Total Expense To Date:</p>
              <p>{numberFormatter(totalClientExpToDate, true)}</p>
            </div>
            <div>
              <p className="font-semibold">Total Profit To Date:</p>
              <p>{numberFormatter(totalProfitToDate, true)}</p>
            </div>
            <div>
              <p className="font-semibold">Client Balance To Date:</p>
              <p>{numberFormatter(data?.ClientBalance, true)}</p>
            </div>
          </div>
        </div>
      </div>
    );
};

export default ClientView;
