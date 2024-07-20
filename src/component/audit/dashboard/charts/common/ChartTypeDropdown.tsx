import { useState } from 'react';
import PopupMenu from '../../../../../common/PopupMenu';
import { FaAngleDown } from 'react-icons/fa';

interface ChartTypeDropdownProps {
  selectedChartType: 'line' | 'bar';
  setSelectedChartType: React.Dispatch<React.SetStateAction<'line' | 'bar'>>;
}

const ChartTypeDropdown = ({
  selectedChartType,
  setSelectedChartType,
}: ChartTypeDropdownProps) => {
  const [opened, setOpened] = useState(false);

  return (
    <PopupMenu
      opened={opened}
      setOpened={setOpened}
      target={
        <div
          onClick={() => setOpened(true)}
          className="capitalize cursor-pointer w-[100px] border border-inputBorder px-2 py-1 rounded"
        >
          <div className="flex items-center justify-between">
            <span>{selectedChartType}</span>
            <FaAngleDown />
          </div>
        </div>
      }
      withArrow
      position="bottom-start"
      width="100px"
    >
      <div className="flex flex-col w-full">
        <div
          className="px-4 py-2 hover:bg-onHoverBg cursor-pointer"
          onClick={() => {
            setSelectedChartType('line');
            setOpened(false);
          }}
        >
          Line
        </div>
        <div
          className="px-4 py-2 hover:bg-onHoverBg cursor-pointer"
          onClick={() => {
            setSelectedChartType('bar');
            setOpened(false);
          }}
        >
          Bar
        </div>
      </div>
    </PopupMenu>
  );
};

export default ChartTypeDropdown;
