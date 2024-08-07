import InputSelect from '../inputs/InputSelect';
import { IEmployeesCollection } from '../../@types/database';

interface EmpAutoCompleteInputProps {
  employees: IEmployeesCollection[];
  selectedEmpId: string;
  setSelectedEmpId: React.Dispatch<React.SetStateAction<string>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  error?: string | null;
  label?: string;
}

const EmpAutoCompleteInput = ({
  selectedEmpId,
  setSelectedEmpId,
  error,
  label,
  employees,
  searchQuery,
  setSearchQuery,
}: EmpAutoCompleteInputProps) => {
  return (
    <InputSelect
      label={label ?? 'Select employee'}
      data={employees.map((res) => {
        return { label: res.EmployeeName, value: res.EmployeeId };
      })}
      searchValue={searchQuery}
      onSearchChange={(query) => {
        setSearchQuery(query);
        if (query.length < searchQuery.length) {
          setSelectedEmpId(''); // Clear selected value on backspace
        }
      }}
      onChange={(e) => setSelectedEmpId(e as string)}
      value={selectedEmpId}
      searchable
      className="w-full"
      error={error}
    />
  );
};

export default EmpAutoCompleteInput;
