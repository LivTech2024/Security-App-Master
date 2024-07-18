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
  IPayStubsCollection,
  IShiftsCollection,
} from '../../@types/database';
import { toDate } from '../../utilities/misc';
import IncomeChart from '../../component/audit/dashboard/charts/IncomeChart';
import ExpenseChart from '../../component/audit/dashboard/charts/ExpenseChart';
import ShiftChart from '../../component/audit/dashboard/charts/ShiftChart';

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
    employees: IEmployeesCollection[];
    equipments: IEquipmentsCollection[];
    payStubs: IPayStubsCollection[];
    invoices: IInvoicesCollection[];
    shifts: IShiftsCollection[];
  }>({
    clients: [],
    employees: [],
    equipments: [],
    invoices: [],
    payStubs: [],
    shifts: [],
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
        TotalClients={auditData.clients.length}
        TotalEmployees={auditData.employees.length}
        TotalEquipments={auditData.equipments.length}
        TotalExpense={auditData.payStubs.reduce(
          (acc, obj) => acc + Number(obj.PayStubNetPay.Amount),
          0
        )}
        TotalIncome={auditData.invoices.reduce(
          (acc, obj) => acc + obj.InvoiceReceivedAmount,
          0
        )}
      />

      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="bg-surface p-4 rounded shadow  flex flex-col gap-4">
          <div className="font-semibold">Income Chart</div>
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
        </div>
        <div className="bg-surface p-4 rounded shadow  flex flex-col gap-4">
          <div className="font-semibold">Expense Chart</div>

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
        </div>
        <div className="bg-surface p-4 rounded shadow flex flex-col gap-4">
          <div className="flex justify-between">
            <div className="font-semibold">Shift Chart</div>
            <span className=" text-textSecondary font-semibold">
              Total: {auditData.shifts.length}
            </span>
          </div>

          <ShiftChart
            shifts={auditData.shifts.sort(
              (a, b) =>
                toDate(a.ShiftDate).getTime() - toDate(b.ShiftDate).getTime()
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default AuditDashboard;
