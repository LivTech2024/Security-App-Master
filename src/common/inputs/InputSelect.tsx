import { Path, UseFormRegister } from "react-hook-form";

import InputHeader from "./InputHeader";
import InputError from "./InputError";

interface InputSelectProps<FormFields extends Record<string, unknown>> {
  label?: string;
  placeholder?: string;
  className?: string;
  selectClassName?: string;
  options: { title: string; value: string }[];
  fontClassName?: string;
  leadingIcon?: JSX.Element;
  selected?: string;
  register?: UseFormRegister<FormFields>;
  name?: Path<FormFields>;
  error?: string | undefined;
}

const InputSelect = <FormFields extends Record<string, unknown>>({
  label,
  options,
  className,
  fontClassName,
  selectClassName,
  leadingIcon,
  selected,
  name,
  register,
  error,
}: InputSelectProps<FormFields>) => {
  return (
    <div className={` gap-1 flex flex-col ${className}`}>
      {label ? (
        <InputHeader title={label} fontClassName={fontClassName} />
      ) : null}

      <div
        className={`flex items-center w-full h-11 rounded border border-inputBorderLight dark:border-inputBorderDark focus-within:ring-[2px]  ${className} dark:bg-primaryVariantDark `}
      >
        <div>{leadingIcon}</div>
        {register && name ? (
          <select
            {...register(name)}
            className={`bg-surfaceLight  outline-none text-textPrimaryLight text-sm rounded focus:ring-secondaryLight focus:border-secondaryLight block w-full p-2  dark:border-inputBorder dark:placeholder-textQuaternaryLight  dark:text-textPrimaryDark dark:focus:ring-secondaryLight dark:focus:border-secondaryLight ${selectClassName} dark:bg-primaryVariantDark cursor-pointer`}
          >
            {selected && (
              <option value="" selected className="font-medium text-lg">
                {selected}
              </option>
            )}
            {options.map((e) => {
              return (
                <option key={e.value} value={e.value} className="text-lg">
                  {e.title}
                </option>
              );
            })}
          </select>
        ) : (
          <select
            className={`bg-surfaceLight outline-none text-textPrimaryLight text-sm rounded focus:ring-secondaryLight focus:border-secondaryLight block w-full p-2  dark:border-inputBorder dark:placeholder-textQuaternaryLight  dark:text-textPrimaryDark dark:focus:ring-secondaryLight dark:focus:border-secondaryLight ${selectClassName} dark:bg-primaryVariantDark cursor-pointer`}
          >
            {selected && (
              <option value="" selected className="font-medium">
                {selected}
              </option>
            )}
            {options.map((e) => {
              return (
                <option key={e.value} value={e.value}>
                  {e.title}
                </option>
              );
            })}
          </select>
        )}
      </div>
      {error && <InputError errorMessage={error} />}
    </div>
  );
};

export default InputSelect;
