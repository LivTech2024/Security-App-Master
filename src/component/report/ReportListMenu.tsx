import { IReportCategoriesCollection } from '../../@types/database';
import SelectBranch from '../../common/SelectBranch';
import DateFilterDropdown from '../../common/dropdown/DateFilterDropdown';
import InputSelect from '../../common/inputs/InputSelect';

interface ReportListMenuProps {
  startDate: Date | string | null;
  setStartDate: React.Dispatch<React.SetStateAction<Date | string | null>>;
  endDate: Date | string | null;
  setEndDate: React.Dispatch<React.SetStateAction<Date | string | null>>;
  isLifeTime: boolean;
  setIsLifeTime: React.Dispatch<React.SetStateAction<boolean>>;
  categoryId: string;
  setCategoryId: React.Dispatch<React.SetStateAction<string>>;
  branchId: string;
  setBranchId: React.Dispatch<React.SetStateAction<string>>;
  categories: IReportCategoriesCollection[];
}

const ReportListMenu = ({
  endDate,
  isLifeTime,
  setEndDate,
  setIsLifeTime,
  setStartDate,
  startDate,
  branchId,
  categoryId,
  setBranchId,
  setCategoryId,
  categories,
}: ReportListMenuProps) => {
  return (
    <div className="flex items-center justify-between w-full gap-4 p-4 rounded bg-surface shadow">
      <DateFilterDropdown
        endDate={endDate}
        isLifetime={isLifeTime}
        setEndDate={setEndDate}
        setIsLifetime={setIsLifeTime}
        setStartDate={setStartDate}
        startDate={startDate}
      />
      <div className="flex items-center gap-4">
        <InputSelect
          placeholder="Select Category"
          searchable
          clearable
          data={categories.map((cat) => {
            return {
              label: cat.ReportCategoryName,
              value: cat.ReportCategoryId,
            };
          })}
          value={categoryId}
          onChange={(e) => setCategoryId(e as string)}
        />
        <SelectBranch
          selectedBranch={branchId}
          setSelectedBranch={setBranchId}
        />
      </div>
    </div>
  );
};

export default ReportListMenu;
