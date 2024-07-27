import { Tooltip } from '@mantine/core';
import { MdOutlineInfo } from 'react-icons/md';

const ColorPelletTooltip = () => {
  return (
    <Tooltip
      styles={{ tooltip: { padding: 0 } }}
      label={
        <div className="grid grid-cols-2 gap-x-4 bg-surface shadow p-4 rounded text-primary">
          <div className="flex flex-col gap-2">
            <div className="font-semibold text-base">Shift status</div>
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
          <div className="flex flex-col gap-2">
            <div className="font-semibold text-base">Employee status</div>
            <div className="flex items-center gap-4 text-base">
              <span className="size-6 bg-primaryGreen"></span>
              <span className="mt-1">Available</span>
            </div>
            <div className="flex items-center gap-4 text-base">
              <span className="size-6 bg-gray-200"></span>
              <span className="mt-1">Already Assigned</span>
            </div>
            <div className="flex items-center gap-4 text-base">
              <span className="size-6 bg-primaryRed"></span>
              <span className="mt-1">On Leave/Vacation</span>
            </div>
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
