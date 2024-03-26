import { useState } from "react";
import DateFilterDropdown from "../../common/dropdown/DateFilterDropdown";
import dayjs from "dayjs";
import { useAuthState } from "../../store";
import InputSelect from "../../common/inputs/InputSelect";
import { FaRegFilePdf } from "react-icons/fa";

const Reports = () => {
  const { empRoles } = useAuthState();

  const [startDate, setStartDate] = useState<Date | string | null>(
    dayjs().startOf("M").toDate()
  );

  const [endDate, setEndDate] = useState<Date | string | null>(
    dayjs().endOf("M").toDate()
  );

  const [isLifetime, setIsLifetime] = useState(false);

  const [selectedPosition, setSelectedPosition] = useState("all_positions");
  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
        <span className="font-semibold text-xl">Reports</span>
      </div>
      <div className="flex items-center justify-between w-full gap-4 p-4 rounded bg-surface shadow">
        <DateFilterDropdown
          endDate={endDate}
          isLifetime={isLifetime}
          setEndDate={setEndDate}
          setIsLifetime={setIsLifetime}
          setStartDate={setStartDate}
          startDate={startDate}
        />
        <InputSelect
          value={selectedPosition}
          onChange={(e) => setSelectedPosition(e as string)}
          placeholder="Select position"
          data={[
            { label: "All Positions", value: "all_positions" },
            ...empRoles.map((role) => {
              return {
                label: role.EmployeeRoleName,
                value: role.EmployeeRoleId,
              };
            }),
          ]}
        />
      </div>
      <div className="flex flex-col w-full p-4 rounded bg-surface shadow gap-2">
        <div className="text-lg font-semibold mb-2">Shift Details Reports</div>

        <div className="p-4 bg-onHoverBg  flex items-center justify-between rounded">
          <div className="font-medium">By Employee - Detailed</div>
          <FaRegFilePdf className="text-textPrimaryBlue text-lg cursor-pointer hover:scale-110 duration-100" />
        </div>
        <div className="p-4 bg-onHoverBg  flex items-center justify-between rounded">
          <div className="font-medium">By Position - Detailed</div>
          <FaRegFilePdf className="text-textPrimaryBlue text-lg cursor-pointer hover:scale-110 duration-100" />
        </div>
      </div>
    </div>
  );
};

export default Reports;
