import { useState } from 'react';
import PageHeader from '../../common/PageHeader';
import dayjs from 'dayjs';
import Menus from '../../component/audit/dashboard/Menus';
import TotalAmtCards from '../../component/audit/dashboard/TotalAmtCards';
import IncomeVsExpenseChart from '../../component/audit/dashboard/charts/IncomeVsExpenseChart';

const AuditDashboard = () => {
  const [startDate, setStartDate] = useState<Date | string | null>(
    dayjs().startOf('month').toDate()
  );

  const [endDate, setEndDate] = useState<Date | string | null>(
    dayjs().endOf('month').toDate()
  );

  const [selectedBranchId, setSelectedBranchId] = useState('');
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
        startDate={startDate}
        endDate={endDate}
        selectedBranchId={selectedBranchId}
      />

      <div className="flex gap-4 w-full">
        <div className="bg-surface p-4 rounded shadow w-1/2 flex flex-col gap-4">
          <div className="font-semibold">Income v/s Expense Chart</div>
          <IncomeVsExpenseChart />
        </div>
      </div>
    </div>
  );
};

export default AuditDashboard;
