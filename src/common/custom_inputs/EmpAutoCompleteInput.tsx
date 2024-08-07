import { IEmployeesCollection } from '../../@types/database';
import empDefaultPlaceHolder from '../../../public/assets/avatar.png';
import { Avatar, Select, SelectProps, Text } from '@mantine/core';
import InputHeader from '../inputs/InputHeader';
import { MdCheck } from 'react-icons/md';

interface EmpAutoCompleteInputProps {
  employees: IEmployeesCollection[];
  selectedEmpId: string;
  setSelectedEmpId: React.Dispatch<React.SetStateAction<string>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  error?: string | null;
  label?: string;
}

// Extend SelectItemProps to include custom fields

// Transform employees data for Autocomplete

const EmpAutoCompleteInput = ({
  selectedEmpId,
  setSelectedEmpId,
  error,
  label,
  employees,
  searchQuery,
  setSearchQuery,
}: EmpAutoCompleteInputProps) => {
  const employeesData: Record<string, { image: string; email: string }> =
    employees.reduce(
      (acc, employee) => {
        acc[employee.EmployeeId] = {
          image: employee.EmployeeImg || empDefaultPlaceHolder,
          email: employee.EmployeeEmail,
        };
        return acc;
      },
      {} as Record<string, { image: string; email: string }>
    );

  // Custom render option function
  const renderAutocompleteOption: SelectProps['renderOption'] = ({
    option,
    checked,
  }) => (
    <div className="flex items-center gap-2 w-full">
      <Avatar src={employeesData[option.value].image} size={36} radius="xl" />
      <div className="flex items-center justify-between w-full">
        <div className="flex flex-col">
          <Text size="sm">{option?.label}</Text>
          <Text size="xs" opacity={0.8}>
            {employeesData[option.value]?.email}
          </Text>
        </div>
        {checked && <MdCheck className="ml-auto text-lg text-textSecondary" />}
      </div>
    </div>
  );

  const data = employees.map((employee) => ({
    value: employee.EmployeeId,
    label: employee.EmployeeName,
    email: employee.EmployeeEmail,
    image: employee.EmployeeImg,
  }));

  return (
    <div className={` gap-1 flex flex-col w-full`}>
      {label ? <InputHeader title={label ?? 'Select Employee'} /> : null}
      <Select
        placeholder="Search employee"
        data={data}
        renderOption={renderAutocompleteOption}
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
        styles={{
          input: {
            border: `1px solid #0000001A`,
            fontWeight: 'normal',
            fontSize: '18px',
            borderRadius: '4px',
            background: '#FFFFFF',
            color: '#000000',
            padding: '22px 26px 22px 12px',
          },
        }}
      />
    </div>
  );
};

export default EmpAutoCompleteInput;
