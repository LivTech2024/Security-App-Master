import InputHeader from './InputHeader';
import { ComboboxData, ComboboxItem, Select } from '@mantine/core';

interface InputSelectProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: ((value: string | null, option: ComboboxItem) => void) | undefined;
  className?: string;
  fontClassName?: string;
  data: ComboboxData;
  error?: string | null;
  searchValue?: string;
  onSearchChange?: React.Dispatch<React.SetStateAction<string>>;
  searchable?: boolean;
  clearable?: boolean;
  nothingFoundMessage?: React.ReactNode;
  limit?: number;
}

const InputSelect = ({
  label,
  onChange,
  value,
  placeholder,
  className,
  fontClassName,
  data,
  error,
  onSearchChange,
  searchValue,
  clearable,
  searchable,
  nothingFoundMessage,
  limit,
}: InputSelectProps) => {
  return (
    <div className={` gap-1 flex flex-col ${className}`}>
      {label ? (
        <InputHeader title={label} fontClassName={fontClassName} />
      ) : null}

      <Select
        error={error}
        placeholder={placeholder}
        allowDeselect={false}
        value={value}
        onChange={onChange}
        data={data}
        className={className}
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
        clearable={clearable}
        searchable={searchable}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        nothingFoundMessage={nothingFoundMessage}
        limit={limit}
      />
    </div>
  );
};

export default InputSelect;
