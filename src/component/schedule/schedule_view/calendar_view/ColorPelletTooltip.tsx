import { Tooltip } from '@mantine/core';
import { MdOutlineInfo } from 'react-icons/md';

const ColorPelletTooltip = () => {
  return (
    <Tooltip
      styles={{ tooltip: { padding: 0 } }}
      label={
        <div className="bg-surface shadow p-4 rounded text-primary flex flex-col gap-2">
          <div className="flex items-center gap-4 text-base">
            <span className="size-6 bg-orange-200"></span>
            <span className="mt-1">Pending</span>
          </div>
          <div className="flex items-center gap-4 text-base">
            <span className="size-6 bg-pink-200"></span>
            <span className="mt-1">Started</span>
          </div>
          <div className="flex items-center gap-4 text-base">
            <span className="size-6 bg-green-400"></span>
            <span className="mt-1">Completed</span>
          </div>
          <div className="flex items-center gap-4 text-base">
            <span className="size-6 bg-purple-500"></span>
            <span className="mt-1">Started Late</span>
          </div>
          <div className="flex items-center gap-4 text-base">
            <span className="size-6 bg-red-500"></span>
            <span className="mt-1">Ended Early</span>
          </div>
          <div className="flex items-center gap-4 text-base">
            <span className="size-6 bg-blue-400"></span>
            <span className="mt-1">Ended Late</span>
          </div>
          <div className="flex items-center gap-4 text-base">
            <span className="size-6 bg-gradient-to-r from-purple-500 to-blue-400"></span>
            <span className="mt-1">Started Late-Ended Late</span>
          </div>

          <div className="flex items-center gap-4 text-base">
            <span className="size-6 bg-gradient-to-r from-purple-500 to-red-500"></span>
            <span className="mt-1">Started Late-Ended Early</span>
          </div>
        </div>
      }
    >
      <div className="flex items-center gap-2 mt-1 cursor-pointer font-semibold">
        <MdOutlineInfo />
        Colors pellet info
      </div>
    </Tooltip>
  );
};

export default ColorPelletTooltip;
