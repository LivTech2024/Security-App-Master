import { twMerge } from "tailwind-merge";

interface IInputHeaderProps {
  title: string;
  className?: string;
  fontClassName?: string;
}
const InputHeader = ({
  title,
  className = "w-full",
  fontClassName,
}: IInputHeaderProps) => {
  return (
    <div className={`flex ${className}`}>
      <span
        className={` ${twMerge(
          "text-xs line-clamp-1 font-sfProTextMedium font-medium",
          fontClassName
        )}`}
      >
        {title}
      </span>
    </div>
  );
};

export default InputHeader;
