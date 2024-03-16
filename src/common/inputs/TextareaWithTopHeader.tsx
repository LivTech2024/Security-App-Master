import { DeepMap, FieldError, Path, UseFormRegister } from 'react-hook-form';

import InputError from './InputError';
import InputHeader from './InputHeader';

interface TextareaWithTopHeaderProps<
  FormFields extends Record<string, unknown>
> {
  title?: string;
  placeholder?: string;
  className?: string;
  leadingIcon?: JSX.Element;
  tailIcon?: JSX.Element;
  onTailIconClick?: () => void;
  fontClassName?: string;
  register?: UseFormRegister<FormFields>;
  name?: Path<FormFields>;
  errors?: Partial<DeepMap<FormFields, FieldError>>;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement> | undefined;
  disabled?: boolean;
  inputMaxLength?: number;
}

const TextareaWithTopHeader = <FormFields extends Record<string, unknown>>({
  title,
  placeholder,
  className = 'mx-4',
  fontClassName,
  leadingIcon,
  tailIcon,
  onTailIconClick,
  register,
  errors,
  name,
  value,
  onChange,
  disabled = false,
  inputMaxLength
}: TextareaWithTopHeaderProps<FormFields>) => {
  const errorMessage = errors && name && errors[name]?.message;
  const hasError = !!(errors && errorMessage);
  return (
    <div className={`gap-1 flex flex-col ${className}`}>
      {title ? (
        <InputHeader
          title={title}
          className="w-full"
          fontClassName={fontClassName}
        />
      ) : null}

      <div
        className={`flex justify-center items-center border ${
          hasError && errorMessage
            ? 'border-textPrimaryRed'
            : 'border-inputBorderLight dark:border-inputBorderDark'
        } bg-surfaceLight w-full rounded   dark:bg-primaryVariantDark focus-within:ring-[2px]`}
      >
        {leadingIcon ? (
          <div className="px-2 pt-2 pb-[9px] h-full flex  cursor-pointer hover:bg-onHoverBgLight   dark:hover:bg-black">
            {leadingIcon}
          </div>
        ) : null}
        {register && name ? (
          <textarea
            {...register(name)}
            onInput={e => {
              const input = e.target as HTMLInputElement;
              if (!inputMaxLength || inputMaxLength === 0) return;
              if (input.value.length > inputMaxLength) {
                input.value = input.value.slice(0, inputMaxLength);
              }
            }}
            className="w-full text-sm py-1 pl-2 pr-0 outline-none dark:bg-primaryVariantDark"
            placeholder={placeholder}
            style={{ resize: 'none' }}
            rows={4}
            disabled={disabled}
          />
        ) : (
          <textarea
            value={value}
            onInput={e => {
              const input = e.target as HTMLInputElement;
              if (!inputMaxLength || inputMaxLength === 0) return;
              if (input.value.length > inputMaxLength) {
                input.value = input.value.slice(0, inputMaxLength);
              }
            }}
            onChange={onChange}
            className="w-full text-sm py-1 pl-2 pr-0 outline-none dark:bg-primaryVariantDark"
            placeholder={placeholder}
            style={{ resize: 'none' }}
            rows={4}
            disabled={disabled}
          />
        )}

        {tailIcon ? (
          <div
            onClick={onTailIconClick}
            className="px-2 pt-2 pb-[9px] h-full flex cursor-pointer hover:bg-onHoverBgLight dark:hover:bg-black"
          >
            {tailIcon}
          </div>
        ) : null}
      </div>
      {hasError && errorMessage && <InputError errorMessage={errorMessage} />}
    </div>
  );
};

export default TextareaWithTopHeader;
