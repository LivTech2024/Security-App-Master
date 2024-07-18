import DateFilterDropdown from '../../../common/dropdown/DateFilterDropdown';
import SelectBranch from '../../../common/SelectBranch';

interface MenusProps {
  startDate: string | Date | null;
  setStartDate: React.Dispatch<React.SetStateAction<string | Date | null>>;
  endDate: string | Date | null;
  setEndDate: React.Dispatch<React.SetStateAction<string | Date | null>>;
  selectedBranchId: string;
  setSelectedBranchId: React.Dispatch<React.SetStateAction<string>>;
}

const Menus = ({
  startDate,
  endDate,
  selectedBranchId,
  setEndDate,
  setSelectedBranchId,
  setStartDate,
}: MenusProps) => {
  return (
    <div className="flex bg-surface shadow p-4 rounded justify-between">
      <DateFilterDropdown
        endDate={endDate}
        setEndDate={setEndDate}
        setStartDate={setStartDate}
        startDate={startDate}
      />
      <SelectBranch
        selectedBranch={selectedBranchId}
        setSelectedBranch={setSelectedBranchId}
      />
    </div>
  );
};

export default Menus;
