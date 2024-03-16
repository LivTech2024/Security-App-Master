import { Path, UseFormRegister } from "react-hook-form";

interface InputRadioProps<FormFields extends Record<string, unknown>> {
  label?: string;
  value?: string | number;
  checked?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  type?: "radio" | "checkbox";
  disabled?: boolean;
  register?: UseFormRegister<FormFields>;
  name?: Path<FormFields>;
}

const InputRadio = <FormFields extends Record<string, unknown>>({
  label,
  value,
  checked,
  onChange,
  type = "radio",
  disabled = false,
  register,
  name,
}: InputRadioProps<FormFields>) => {
  return (
    <label className="flex gap-4 cursor-pointer items-center z-[0]">
      {register && name ? (
        <input
          type={type}
          {...register(name)}
          className="cursor-pointer "
          style={{ scale: "1.4", marginLeft: "3px" }}
          disabled={checked ? false : disabled}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          checked={checked}
          className="cursor-pointer "
          style={{ scale: "1.4", marginLeft: "3px" }}
          disabled={checked ? false : disabled}
        />
      )}

      {label ? (
        <span className="text-lg mt-[2px]">{label}</span>
      ) : (
        <span className="text-lg mt-[2px]">&nbsp;</span>
      )}
    </label>
  );
};

export default InputRadio;
