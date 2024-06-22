import { useEffect, useState } from 'react';
import InputSelect from '../../../common/inputs/InputSelect';
import useFetchEmployees from '../../../hooks/fetch/useFetchEmployees';

const EmpDetails = () => {
  const [empSearchQuery, setEmpSearchQuery] = useState('');

  const { data: employees } = useFetchEmployees({
    limit: 5,
    searchQuery: empSearchQuery,
  });

  const [selectedEmpId, setSelectedEmpId] = useState('');

  useEffect(() => {
    const selectedEmp = employees.find(
      (emp) => emp.EmployeeName === empSearchQuery
    );

    if (selectedEmp) {
      setSelectedEmpId(selectedEmp.EmployeeId);
    } else {
      setSelectedEmpId('');
    }
  }, [empSearchQuery]);

  return (
    <div className="flex flex-col gap-4 bg-surface shadow rounded p-4 items-start w-1/3 min-h-full">
      <div className="font-semibold">Employee Details</div>

      <InputSelect
        label="Select employee"
        data={employees.map((res) => {
          return { label: res.EmployeeName, value: res.EmployeeName };
        })}
        searchValue={empSearchQuery}
        onSearchChange={setEmpSearchQuery}
        searchable
        className="w-full"
      />

      {selectedEmpId && (
        <div className="flex items-center gap-2">
          <span>Role:</span>
          <span className="font-medium">
            {
              employees.find((emp) => emp.EmployeeId === selectedEmpId)
                ?.EmployeeRole
            }
          </span>
        </div>
      )}
    </div>
  );
};

export default EmpDetails;
