import { useEffect, useState } from 'react';
import InputSelect from '../../../common/inputs/InputSelect';
import useFetchEmployees from '../../../hooks/fetch/useFetchEmployees';
import { useFormContext } from 'react-hook-form';
import { PayStubCreateFormFields } from '../../../utilities/zod/schema';

const EmpDetails = () => {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<PayStubCreateFormFields>();

  const [empSearchQuery, setEmpSearchQuery] = useState('');

  const { data: employees } = useFetchEmployees({
    limit: 5,
    searchQuery: empSearchQuery,
  });

  const selectedEmpRole = watch('PayStubEmpRole');

  useEffect(() => {
    const selectedEmp = employees.find(
      (emp) => emp.EmployeeName === empSearchQuery
    );

    if (selectedEmp) {
      setValue('PayStubEmpId', selectedEmp.EmployeeId);
      setValue('PayStubEmpName', selectedEmp.EmployeeName);
      setValue('PayStubEmpRole', selectedEmp.EmployeeRole);
    } else {
      setValue('PayStubEmpId', '');
      setValue('PayStubEmpName', '');
      setValue('PayStubEmpRole', '');
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
        error={errors.PayStubEmpId?.message}
      />

      {selectedEmpRole && (
        <div className="flex items-center gap-2">
          <span>Role:</span>
          <span className="font-medium">{selectedEmpRole}</span>
        </div>
      )}
    </div>
  );
};

export default EmpDetails;
