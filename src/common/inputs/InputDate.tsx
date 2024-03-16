import { DateInput } from "@mantine/dates";
import React from "react";
import { MdCalendarToday } from "react-icons/md";

interface InputDateProps {
  value: Date | null;
  setValue: React.Dispatch<React.SetStateAction<Date | null>>;
  label: string;
  error?: string;
  id?: string;
}

const InputDate = ({ setValue, label, value, error, id }: InputDateProps) => {
  return (
    <div className={`gap-1 flex flex-col w-full h-full`}>
      {label ? (
        <div className={`flex`}>
          <span className={`text-xs line-clamp-1`}>{label}</span>
        </div>
      ) : null}

      <DateInput
        valueFormat="DD/MM/YYYY"
        rightSection={
          <label htmlFor={id ? id : label}>
            <MdCalendarToday size={16} className="cursor-pointer" />
          </label>
        }
        id={id ? id : label}
        value={value}
        onChange={setValue}
        popoverProps={{
          styles: {
            dropdown: {
              backgroundColor: `#FFFFFF`,
              zIndex: 300,
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.4)",
              position: "fixed",
            },
          },
        }}
        styles={{
          input: {
            border: `1px solid #ccc`,
            fontSize: "18px",
            borderRadius: "4px",
            background: "#FFFFFF",
            color: "#000000",
            padding: "22px 8px",
          },
          day: {
            color: `#000000`,
            ":hover": {
              color: "#000000",
            },
          },
        }}
      />
      {error && (
        <small className="text-red-600 text-xs px-1 text-start">{error}</small>
      )}
    </div>
  );
};

export default InputDate;
