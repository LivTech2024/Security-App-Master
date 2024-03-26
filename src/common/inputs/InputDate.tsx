import { DateInput, DatePickerInput } from "@mantine/dates";
import React from "react";
import { MdCalendarToday } from "react-icons/md";

interface InputDateProps {
  value?: Date | null;
  setValue?: React.Dispatch<React.SetStateAction<Date | null>>;
  rangeValue?: [Date | null, Date | null];
  rangeOnChange?: React.Dispatch<
    React.SetStateAction<[Date | null, Date | null]>
  >;
  label?: string;
  error?: string;
  id?: string;
  type?: "default" | "range";
}

const InputDate = ({
  setValue,
  label,
  value,
  error,
  id,
  type = "default",
  rangeOnChange,
  rangeValue,
}: InputDateProps) => {
  return (
    <div className={`gap-1 flex flex-col w-full h-full`}>
      {label ? (
        <div className={`flex`}>
          <span className={`text-xs line-clamp-1`}>{label}</span>
        </div>
      ) : null}

      {type === "default" ? (
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
          className="focus-within:ring-[2px] rounded "
          popoverProps={{
            styles: {
              dropdown: {
                backgroundColor: `#FFFFFF`,
                zIndex: 300,
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.4)",
                position: "absolute",
              },
            },
          }}
          styles={{
            input: {
              border: `1px solid #0000001A`,
              fontWeight: "normal",
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
      ) : (
        type === "range" && (
          <DatePickerInput
            type="range"
            dropdownType="modal"
            placeholder="Pick dates range"
            value={rangeValue}
            onChange={rangeOnChange}
            popoverProps={{
              styles: {
                dropdown: {
                  backgroundColor: `#FFFFFF`,
                  zIndex: 300,
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.4)",
                  position: "absolute",
                },
              },
            }}
            styles={{
              input: {
                border: `1px solid #0000001A`,
                fontWeight: "normal",
                fontSize: "18px",
                borderRadius: "4px",
                background: "#FFFFFF",
                color: "#000000",
                padding: "8px 8px",
              },
              day: {
                color: `#000000`,
                ":hover": {
                  color: "#000000",
                },
              },
            }}
          />
        )
      )}
      {error && (
        <small className="text-red-600 text-xs px-1 text-start">{error}</small>
      )}
    </div>
  );
};

export default InputDate;
