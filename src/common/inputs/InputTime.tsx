import { useRef } from 'react';
import { TimeInput } from '@mantine/dates';
import { FaRegClock } from 'react-icons/fa';
import InputHeader from './InputHeader';

interface InputTimeProps {
  label?: string;
  fontClassName?: string;
  value: string;
  onChange: React.Dispatch<React.SetStateAction<string>>;
  disabled?: boolean;
  showSeconds?: boolean;
  error?: string | null;
}

const InputTime = ({
  value,
  disabled,
  fontClassName,
  label,
  onChange,
  showSeconds = false,
  error,
}: InputTimeProps) => {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div className={` gap-1 flex flex-col `}>
      {label ? (
        <InputHeader title={label} fontClassName={fontClassName} />
      ) : null}

      <div
        className={`flex items-center bg-white w-full h-11  rounded border border-[#ccc]  ${
          error
            ? 'border-red-400'
            : 'border-inputBorder focus-within:ring-[2px]'
        }   overflow-hidden`}
      >
        <TimeInput
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2"
          styles={{
            input: {
              border: 'none',
              fontWeight: '400',
              fontSize: '18px',
              backgroundColor: 'transparent',
              padding: '0px',
            },
          }}
          withSeconds={showSeconds}
          disabled={disabled}
        />

        <div
          onClick={() => ref.current?.showPicker()}
          className="px-2 pt-2 pb-[9px] h-full flex justify-center items-center cursor-pointer hover:bg-onHoverBg "
        >
          <FaRegClock className="w-4 h-4 text-textTertiary" />
        </div>
      </div>
      {error && (
        <small className="text-red-600 text-xs px-1 text-start">{error}</small>
      )}
    </div>
  );
};

export default InputTime;
