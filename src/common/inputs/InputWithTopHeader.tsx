import { FormEvent, useState } from 'react';
import { Path, UseFormRegister } from 'react-hook-form';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import InputHeader from './InputHeader';
import InputError from './InputError';

interface InputWithTopHeaderProps<FormFields extends Record<string, unknown>> {
  label?: string;
  placeholder?: string;
  className?: string;
  fontClassName?: string;
  leadingIcon?: JSX.Element;
  tailIcon?: JSX.Element;
  onTailIconClick?: () => void;
  register?: UseFormRegister<FormFields>;
  name?: Path<FormFields>;
  error?: string | undefined;
  value?: string | number;
  onChange?: React.ChangeEventHandler<HTMLInputElement> | undefined;
  disabled?: boolean;
  disableReason?: string;
  decimalCount?: number;
  inputRef?: React.LegacyRef<HTMLInputElement> | undefined;
  onFocus?: () => void;
  onBlur?: () => void;
  isUppercase?: boolean;
  inputMaxLength?: number;
  inputType?: 'text' | 'password' | 'date';
  inputMode?:
    | 'text'
    | 'search'
    | 'email'
    | 'tel'
    | 'url'
    | 'none'
    | 'numeric'
    | 'decimal';
  autocomplete?: React.HTMLInputAutoCompleteAttribute;
}

const InputWithTopHeader = <FormFields extends Record<string, unknown>>({
  label,
  placeholder,
  className = 'mx-4',
  fontClassName,
  leadingIcon,
  tailIcon,
  onTailIconClick,
  register,
  error,
  name,
  value,
  onChange,
  disabled,
  inputRef,
  onFocus,
  onBlur,
  isUppercase = false,
  inputType = 'text',
  inputMode = 'text',
  inputMaxLength,
  decimalCount,
  autocomplete,
}: InputWithTopHeaderProps<FormFields>) => {
  const [isInputHidden, setIsInputHidden] = useState(
    inputType === 'password' ? true : false
  );

  const handleInputChange = (event: FormEvent<HTMLInputElement>) => {
    if (isUppercase) {
      const input = event.target as HTMLInputElement;
      input.value = input.value.toUpperCase();
    }
    const input = event.target as HTMLInputElement;
    if (inputMaxLength && input.value.length > inputMaxLength) {
      input.value = input.value.slice(0, inputMaxLength);
    }
    if (typeof decimalCount === 'number') {
      if (input.value.includes('.')) {
        let decimalPart = input.value.split('.')[1];
        if (decimalPart.length > decimalCount) {
          decimalPart = decimalPart.slice(0, decimalCount);
        }
        input.value = input.value.split('.')[0] + '.' + decimalPart;
        input.value = input.value.replace(/[^\d.]/g, '');
      } else {
        input.value = input.value.replace(/[^\d.]/g, '');
      }
    } else if (decimalCount === 0) {
      const input = event.target as HTMLInputElement;
      input.value = input.value.replace(/\D/g, '');
    }
  };

  return (
    <div className={`gap-1 flex flex-col ${className}`}>
      {label ? (
        <InputHeader title={label} fontClassName={fontClassName} />
      ) : null}

      <div
        className={`flex justify-center items-center bg-white w-full h-11  rounded border border-[#ccc]  ${
          error
            ? 'border-red-400'
            : 'border-inputBorder focus-within:ring-[2px]'
        }   overflow-hidden`}
      >
        {leadingIcon ? (
          <div className="px-2 pt-2 pb-[9px] h-full flex justify-center items-center cursor-pointer hover:bg-onHoverBg ">
            {leadingIcon}
          </div>
        ) : null}

        {register && name ? (
          <input
            {...register(name)}
            type={
              inputType === 'password'
                ? isInputHidden
                  ? 'password'
                  : 'text'
                : inputType
            }
            onInput={(event) => {
              handleInputChange(event);
            }}
            onBlur={onBlur}
            className={`w-full text-lg py-2  ${
              leadingIcon ? 'pl-0' : 'pl-2'
            } outline-none ${tailIcon ? 'pr-0' : 'pr-2'} `}
            placeholder={placeholder}
            disabled={disabled}
            inputMode={inputMode}
            autoComplete={autocomplete}
          />
        ) : (
          <input
            ref={inputRef}
            onBlur={onBlur}
            onFocus={onFocus}
            value={value}
            onChange={onChange}
            type={
              inputType === 'password'
                ? isInputHidden
                  ? 'password'
                  : 'text'
                : inputType
            }
            onInput={(event) => {
              handleInputChange(event);
            }}
            className={`w-full text-lg py-2 ${
              leadingIcon ? 'pl-0' : 'pl-2'
            } outline-none ${tailIcon ? 'pr-0' : 'pr-2'} `}
            placeholder={placeholder}
            disabled={disabled}
            inputMode={inputMode}
            autoComplete={autocomplete}
          />
        )}
        {inputType === 'password' && isInputHidden ? (
          <div
            onClick={() => setIsInputHidden(!isInputHidden)}
            className="px-2 pt-2 pb-[9px] h-full flex justify-center items-center cursor-pointer hover:bg-onHoverBg  "
          >
            <AiOutlineEye className="w-5 h-5" />
          </div>
        ) : (
          inputType === 'password' &&
          !isInputHidden && (
            <div
              onClick={() => setIsInputHidden(!isInputHidden)}
              className="px-2 pt-2 pb-[9px] h-full flex justify-center items-center cursor-pointer hover:bg-onHoverBg "
            >
              <AiOutlineEyeInvisible className="w-5 h-5" />
            </div>
          )
        )}
        {tailIcon ? (
          <div
            onClick={onTailIconClick}
            className="px-2 pt-2 pb-[9px] h-full flex justify-center items-center cursor-pointer hover:bg-onHoverBg "
          >
            {tailIcon}
          </div>
        ) : null}
      </div>
      {error && <InputError errorMessage={error} />}
    </div>
  );
};

export default InputWithTopHeader;
