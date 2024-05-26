import { useEffect, useState } from 'react';
import PageHeader from '../../common/PageHeader';
import dayjs from 'dayjs';
import useFetchEmployees from '../../hooks/fetch/useFetchEmployees';
import InputSelect from '../../common/inputs/InputSelect';
import { useAuthState } from '../../store';
import DateFilterDropdown from '../../common/dropdown/DateFilterDropdown';
import {
  IPatrolLogsCollection,
  IShiftsCollection,
} from '../../@types/database';
import DbEmployee from '../../firebase_configs/DB/DbEmployee';
import { formatDate } from '../../utilities/misc';
import { MdAdsClick } from 'react-icons/md';
import { numberFormatter } from '../../utilities/NumberFormater';

const PerformanceAssurance = () => {
  const { company } = useAuthState();

  const [startDate, setStartDate] = useState<Date | string | null>(
    dayjs().startOf('M').toDate()
  );

  const [endDate, setEndDate] = useState<Date | string | null>(
    dayjs().endOf('M').toDate()
  );

  const [empSearchQuery, setEmpSearchQuery] = useState('');

  const { data: employees } = useFetchEmployees({
    limit: 5,
    searchQuery: empSearchQuery,
  });

  const [selectedEmpId, setSelectedEmpId] = useState('');

  const [empShifts, setEmpShifts] = useState<IShiftsCollection[]>([]);

  const [empPatrolLogs, setEmpPatrolLogs] = useState<IPatrolLogsCollection[]>(
    []
  );

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEmpReport = async () => {
      if (!company) return;

      if (!selectedEmpId || !startDate || !endDate) {
        setEmpShifts([]);
        setEmpPatrolLogs([]);
        return;
      }
      try {
        setLoading(true);

        setEmpPatrolLogs([]);
        setEmpShifts([]);

        //* Fetch all the shifts of employee
        const shiftSnapshot = await DbEmployee.getEmpShifts({
          companyId: company.CompanyId,
          empId: selectedEmpId,
          startDate,
          endDate,
        });

        if (shiftSnapshot.size > 0) {
          const shiftData = shiftSnapshot.docs.map(
            (doc) => doc.data() as IShiftsCollection
          );
          setEmpShifts(shiftData);
        } else {
          setEmpShifts([]);
        }

        //*Fetch all the patrol logs of employee
        const patrolLogSnapshot = await DbEmployee.getEmpPatrolLogs({
          empId: selectedEmpId,
          startDate,
          endDate,
        });

        if (patrolLogSnapshot.size > 0) {
          const patrolLogData = patrolLogSnapshot.docs.map(
            (doc) => doc.data() as IPatrolLogsCollection
          );
          setEmpPatrolLogs(patrolLogData);
        } else {
          setEmpPatrolLogs([]);
        }

        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };

    fetchEmpReport();
  }, [selectedEmpId, startDate, endDate]);

  const totalSpentHrsOnShift = () => {
    if (!selectedEmpId || empShifts.length === 0) return 0;

    return empShifts.reduce((acc, obj) => {
      return (
        acc +
        (obj.ShiftCurrentStatus.find(
          (status) => status.StatusReportedById === selectedEmpId
        )?.StatusShiftTotalHrs || 0)
      );
    }, 0);
  };

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <PageHeader title="Performance Assurance" />
      <div className="flex items-center justify-between w-full gap-4 p-4 rounded bg-surface shadow">
        <InputSelect
          value={selectedEmpId}
          onChange={(e) => setSelectedEmpId(e as string)}
          data={employees.map((emp) => {
            return { label: emp.EmployeeName, value: emp.EmployeeId };
          })}
          searchValue={empSearchQuery}
          onSearchChange={setEmpSearchQuery}
          searchable
          clearable
          placeholder="Select employee"
        />
        <DateFilterDropdown
          endDate={endDate}
          setEndDate={setEndDate}
          setStartDate={setStartDate}
          startDate={startDate}
        />
      </div>
      {!selectedEmpId ? (
        <div className="flex items-center justify-center min-h-[calc(100vh-400px)]">
          <div className="flex flex-col items-center">
            <MdAdsClick className="text-5xl text-textTertiary" />
            <span className="text-textSecondary mt-1">
              Select employee to view his performance report
            </span>
          </div>
        </div>
      ) : loading ? (
        <div className="h-[400px] bg-shimmerColor animate-pulse"></div>
      ) : (
        <div className="flex flex-col w-full gap-4 p-4 rounded bg-surface shadow">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-4">
              <p className="font-semibold flex gap-2">Start Date:</p>
              <p>{formatDate(startDate)}</p>
            </div>
            <div className="flex items-center gap-4">
              <p className="font-semibold flex gap-2">End Date:</p>
              <p>{formatDate(endDate)}</p>
            </div>

            <div className="flex items-center gap-4">
              <p className="font-semibold flex gap-2">
                No of shifts completed:
              </p>
              <p>{empShifts.length}</p>
            </div>

            <div className="flex items-center gap-4">
              <p className="font-semibold flex gap-2">
                No of patrol completed:
              </p>
              <p>{empPatrolLogs.length}</p>
            </div>

            <div className="flex items-center gap-4">
              <p className="font-semibold flex gap-2">
                Total hours spent on shifts
              </p>
              <p>{numberFormatter(totalSpentHrsOnShift())}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceAssurance;
