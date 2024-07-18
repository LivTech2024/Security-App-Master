import { useState } from 'react';
import PageHeader from '../../common/PageHeader';
import dayjs from 'dayjs';
import Menus from '../../component/audit/dashboard/Menus';
import TotalAmtCards from '../../component/audit/dashboard/TotalAmtCards';

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
    </div>
  );
};

export default AuditDashboard;
