import { twMerge } from 'tailwind-merge';

interface ButtonProps {
  label: string;
  onClick: () => void;
  type: 'blue' | 'black' | 'gray' | 'white' | 'green' | 'red';
  buttonType?: 'submit' | 'reset' | 'button';
  className?: string;
  disabled?: boolean;
}

const Button = ({
  label,
  onClick,
  type,
  className,
  disabled,
  buttonType = 'button',
}: ButtonProps) => {
  if (type === 'blue') {
    return (
      <button
        type={buttonType}
        disabled={disabled}
        onClick={onClick}
        className={`${twMerge(
          'bg-secondary hover:bg-blueButtonHoverBg active:bg-blueButtonActiveBg flex items-center justify-center gap-2 px-4 py-2 rounded-[4px]  text-surface whitespace-nowrap overflow-hidden font-semibold  disabled:bg-secondaryBlueBg',
          className
        )}`}
      >
        {label}
      </button>
    );
  }
  if (type === 'black') {
    return (
      <button
        type={buttonType}
        disabled={disabled}
        onClick={onClick}
        className={`${twMerge(
          'bg-primary hover:bg-blackButtonHoverBg active:bg-blackButtonActiveBg flex items-center justify-center gap-2 px-4 py-2 rounded-[4px]  text-surface whitespace-nowrap overflow-hidden font-semibold  disabled:bg-primaryVariantDark dark:disabled:bg-switchSecondaryBlueBg',
          className
        )}`}
      >
        {label}
      </button>
    );
  }
  if (type === 'gray') {
    return (
      <button
        type={buttonType}
        disabled={disabled}
        onClick={onClick}
        className={`${twMerge(
          'bg-grayButtonBg dark:bg-grayButtonBg hover:bg-grayButtonHoverBg  active:bg-grayButtonActiveBg flex items-center justify-center gap-2 px-4 py-2 rounded-[4px]   whitespace-nowrap overflow-hidden font-semibold ',
          className
        )}`}
      >
        {label}
      </button>
    );
  }
  if (type === 'white') {
    return (
      <button
        type={buttonType}
        disabled={disabled}
        onClick={onClick}
        className={`${twMerge(
          'bg-whiteButtonBg hover:bg-whiteButtonHoverBg active:bg-whiteButtonActiveBg flex items-center justify-center gap-2 px-4 py-2 rounded-[4px]  text-textPrimary whitespace-nowrap overflow-hidden font-semibold shadow',
          className
        )}`}
      >
        {label}
      </button>
    );
  }
  if (type === 'green') {
    return (
      <button
        type={buttonType}
        disabled={disabled}
        onClick={onClick}
        className={`${twMerge(
          'bg-primaryGreen hover:bg-greenButtonHoverBg active:bg-greenButtonActiveBg flex items-center justify-center gap-2 px-4 py-2 rounded-[4px]  text-surface whitespace-nowrap overflow-hidden font-semibold ',
          className
        )}`}
      >
        {label}
      </button>
    );
  }
  if (type === 'red') {
    return (
      <button
        type={buttonType}
        disabled={disabled}
        onClick={onClick}
        className={`${twMerge(
          'bg-red-500 hover:bg-red-500/70 flex items-center justify-center gap-2 px-4 py-2 rounded-[4px]  text-surface whitespace-nowrap overflow-hidden font-semibold ',
          className
        )}`}
      >
        {label}
      </button>
    );
  }
};

export default Button;
