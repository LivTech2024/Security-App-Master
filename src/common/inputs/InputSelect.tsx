import InputHeader from "./InputHeader";
import InputError from "./InputError";
import { ComboboxData, ComboboxItem, Select } from "@mantine/core";

interface InputSelectProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: ((value: string | null, option: ComboboxItem) => void) | undefined;
  className?: string;
  fontClassName?: string;
  data: ComboboxData;
  error?: string | null;
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
}: InputSelectProps) => {
  return (
    <div className={` gap-1 flex flex-col `}>
      {label ? (
        <InputHeader title={label} fontClassName={fontClassName} />
      ) : null}

      <Select
        placeholder={placeholder}
        allowDeselect={false}
        value={value}
        onChange={onChange}
        data={data}
        className={className}
        styles={{
          input: {
            border: `1px solid #0000001A`,
            fontWeight: "normal",
            fontSize: "18px",
            borderRadius: "4px",
            background: "#FFFFFF",
            color: "#000000",
            padding: "12px 12px",
          },
        }}
      />
      {error && <InputError errorMessage={error} />}
    </div>
  );
};

export default InputSelect;
