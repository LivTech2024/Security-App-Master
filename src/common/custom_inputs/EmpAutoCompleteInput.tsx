import { IEmployeesCollection } from '../../@types/database';
import empDefaultPlaceHolder from '../../../public/assets/avatar.png';
import { Avatar, Group, Select, SelectProps, Text } from '@mantine/core';
import InputHeader from '../inputs/InputHeader';

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
  }) => (
    <Group gap="sm">
      <Avatar src={employeesData[option.value].image} size={36} radius="xl" />
      <div>
        <Text size="sm">{option?.label}</Text>
        <Text size="xs" opacity={0.8}>
          {employeesData[option.value]?.email}
        </Text>
      </div>
    </Group>
  );

  const data = employees.map((employee) => ({
    value: employee.EmployeeId,
    label: employee.EmployeeName,
    email: employee.EmployeeEmail,
    image: employee.EmployeeImg,
  }));

  return (
    <div className={` gap-1 flex flex-col w-full`}>
      {label ? <InputHeader title={label} /> : null}
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
