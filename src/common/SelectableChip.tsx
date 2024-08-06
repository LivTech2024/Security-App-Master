import React from 'react';

interface SelectableChipProps {
  value: string;
  selected?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setSelected: React.Dispatch<React.SetStateAction<string | any>>;
  label: string;
}

const SelectableChip = ({
  selected,
  setSelected,
  value,
  label,
}: SelectableChipProps) => {
  return (
    <div
      onClick={() =>
        setSelected((prev: string) => (prev === value ? '' : value))
      }
      className={`px-[10px] py-[6px] rounded cursor-pointer font-semibold border border-inputBorder shadow  ${selected === value ? 'bg-primaryVariant/50' : 'bg-onHoverBg'}`}
    >
      {label}
    </div>
  );
};

export default SelectableChip;
