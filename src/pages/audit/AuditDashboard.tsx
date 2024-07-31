import { useEffect, useState } from 'react';
import PageHeader from '../../common/PageHeader';
import dayjs from 'dayjs';
import Menus from '../../component/audit/dashboard/Menus';
import TotalAmtCards from '../../component/audit/dashboard/TotalAmtCards';

import DbAudit from '../../firebase_configs/DB/DbAudit';
import { useAuthState } from '../../store';
import {
  IClientsCollection,
  IEmployeesCollection,
  IEquipmentsCollection,
  IInvoicesCollection,
  ILocationsCollection,
  IPatrolLogsCollection,
  IPayStubsCollection,
  IShiftsCollection,
} from '../../@types/database';
import { toDate } from '../../utilities/misc';
import IncomeChart from '../../component/audit/dashboard/charts/IncomeChart';
import ExpenseChart from '../../component/audit/dashboard/charts/ExpenseChart';
import ShiftChart from '../../component/audit/dashboard/charts/ShiftChart';
import PatrolChart from '../../component/audit/dashboard/charts/PatrolChart';

const AuditDashboard = () => {
  const { company } = useAuthState();

  const [startDate, setStartDate] = useState<Date | string | null>(
    dayjs().startOf('month').toDate()
  );

  const [endDate, setEndDate] = useState<Date | string | null>(
    dayjs().endOf('month').toDate()
  );

  const [selectedBranchId, setSelectedBranchId] = useState('');

  const [auditData, setAuditData] = useState<{
    clients: IClientsCollection[];
    locations: ILocationsCollection[];
    employees: IEmployeesCollection[];
    equipments: IEquipmentsCollection[];
    payStubs: IPayStubsCollection[];
    invoices: IInvoicesCollection[];
    shifts: IShiftsCollection[];
    patrolLogs: IPatrolLogsCollection[];
  }>({
    clients: [],
    locations: [],
    employees: [],
    equipments: [],
    invoices: [],
    payStubs: [],
    shifts: [],
    patrolLogs: [],
  });

  useEffect(() => {
    if (!company || !endDate || !startDate) return;

    DbAudit.getTotalAmounts({
      cmpId: company.CompanyId,
      endDate: endDate as Date,
      startDate: startDate as Date,
      branchId: selectedBranchId,
    }).then((data) => {
      setAuditData(data);
    });
  }, [startDate, endDate, selectedBranchId, company]);

  return (
    <div className="flex flex-col gap-4 p-6">
      <PageHeader title="Audit Dashboard" />
      <Menus
        endDate={endDate}
        selectedBranchId={selectedBranchId}
        setEndDate={setEndDate}
        setSelectedBranchId={setSelectedBranchId}
        setStartDate={setStartDate}
        startDate={startDate}
      />
      <TotalAmtCards
        Clients={{ TotalClients: auditData.clients.length, IsActionReq: false }}
        Employees={{
          TotalEmployees: auditData.employees.length,
          IsActionReq: auditData.employees.some((emp) =>
            emp.EmployeeLicenses.some(
              (l) =>
                dayjs(toDate(l.LicenseExpDate)).isSame(new Date(), 'day') ||
                dayjs(toDate(l.LicenseExpDate)).isBefore(new Date(), 'day')
            )
          ),
        }}
        TotalEquipments={auditData.equipments.length}
        TotalExpense={auditData.payStubs.reduce(
          (acc, obj) => acc + Number(obj.PayStubNetPay.Amount),
          0
        )}
        TotalIncome={auditData.invoices.reduce(
          (acc, obj) => acc + obj.InvoiceReceivedAmount,
          0
        )}
        Locations={{
          TotalLocations: auditData.locations.length,
          IsActionReq: auditData.locations.some(
            (loc) =>
              dayjs(toDate(loc.LocationContractEndDate)).isSame(
                new Date(),
                'day'
              ) ||
              dayjs(toDate(loc.LocationContractEndDate)).isBefore(
                new Date(),
                'day'
              )
          ),
        }}
      />

      <div className="grid grid-cols-2 gap-4 w-full">
        <IncomeChart
          IncomeData={auditData.invoices
            .sort(
              (a, b) =>
                toDate(a.InvoiceDate).getTime() -
                toDate(b.InvoiceDate).getTime()
            )
            .map((res) => {
              return {
                Amount: res.InvoiceReceivedAmount,
                Date: toDate(res.InvoiceDate),
              };
            })}
        />
        <ExpenseChart
          ExpenseData={auditData.payStubs
            .sort(
              (a, b) =>
                toDate(a.PayStubPayDate).getTime() -
                toDate(b.PayStubPayDate).getTime()
            )
            .map((res) => {
              return {
                Amount: res.PayStubNetPay.Amount,
                Date: toDate(res.PayStubPayDate),
              };
            })}
        />
        <ShiftChart
          shifts={auditData.shifts.sort(
            (a, b) =>
              toDate(a.ShiftDate).getTime() - toDate(b.ShiftDate).getTime()
          )}
        />

        <PatrolChart
          patrolLogs={auditData.patrolLogs.sort(
            (a, b) =>
              toDate(a.PatrolDate).getTime() - toDate(b.PatrolDate).getTime()
          )}
        />
      </div>
    </div>
  );
};

export default AuditDashboard;
