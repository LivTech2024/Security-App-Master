import { useState } from 'react';
import DateFilterDropdown from '../../common/dropdown/DateFilterDropdown';
import InputSelect from '../../common/inputs/InputSelect';
import useFetchEmployees from '../../hooks/fetch/useFetchEmployees';
import { useAuthState } from '../../store';
import useFetchClientEmployees from '../../hooks/fetch/useFetchClientEmployees';
import SelectLocation from '../../common/SelectLocation';

interface EmpDarListMenusProps {
  startDate: Date | string | null;
  setStartDate: React.Dispatch<React.SetStateAction<Date | string | null>>;
  endDate: Date | string | null;
  setEndDate: React.Dispatch<React.SetStateAction<Date | string | null>>;
  isLifeTime?: boolean;
  setIsLifeTime?: React.Dispatch<React.SetStateAction<boolean>>;
  selectedEmpId: string;
  setSelectedEmpId: React.Dispatch<React.SetStateAction<string>>;
  selectedLocation: string;
  setSelectedLocation: React.Dispatch<React.SetStateAction<string>>;
}

const EmpDarListMenus = ({
  endDate,
  setEndDate,
  setStartDate,
  startDate,
  isLifeTime,
  setIsLifeTime,
  selectedEmpId,
  setSelectedEmpId,
  selectedLocation,
  setSelectedLocation,
}: EmpDarListMenusProps) => {
  const { admin, company } = useAuthState();

  const [empSearchQuery, setEmpSearchQuery] = useState('');

  const { data: employees } = useFetchEmployees({
    limit: 5,
    searchQuery: empSearchQuery,
  });

  const { data: clientEmployees } = useFetchClientEmployees();

  return (
    <div className="flex items-center justify-between w-full gap-4 p-4 rounded bg-surface shadow">
      <DateFilterDropdown
        endDate={endDate}
        isLifetime={isLifeTime}
        setEndDate={setEndDate}
        setIsLifetime={setIsLifeTime}
        setStartDate={setStartDate}
        startDate={startDate}
      />

      <div className="flex items-center gap-4">
        <SelectLocation
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
        />
        <InputSelect
          value={selectedEmpId}
          onChange={(e) => setSelectedEmpId(e as string)}
          data={(admin && company ? employees : clientEmployees).map((emp) => {
            return { label: emp.EmployeeName, value: emp.EmployeeId };
          })}
          searchValue={empSearchQuery}
          onSearchChange={setEmpSearchQuery}
          searchable
          clearable
          placeholder="Select employee"
        />
      </div>
    </div>
  );
};

export default EmpDarListMenus;
