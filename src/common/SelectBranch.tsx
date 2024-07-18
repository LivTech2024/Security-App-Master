import { useAuthState } from '../store';
import { LocalStorageKey, PageRoutes } from '../@types/enum';
import InputSelect from './inputs/InputSelect';
import { useEffect } from 'react';
import InputHeader from './inputs/InputHeader';
import { AiOutlinePlus } from 'react-icons/ai';
import { useNavigate } from 'react-router-dom';

const SelectBranch = ({
  selectedBranch,
  setSelectedBranch,
  label,
}: {
  label?: string;
  selectedBranch: string;
  setSelectedBranch: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const { companyBranches } = useAuthState();

  useEffect(() => {
    setSelectedBranch(
      localStorage.getItem(LocalStorageKey.SELECTED_BRANCH) || ''
    );
  }, []);

  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-1">
      {label && <InputHeader title={label} />}
      <InputSelect
        placeholder="Branch"
        value={selectedBranch}
        onChange={(e) => {
          localStorage.setItem(LocalStorageKey.SELECTED_BRANCH, e as string);
          setSelectedBranch(e as string);
        }}
        data={[
          { label: 'All branch', value: '' },
          ...companyBranches.map((branches) => {
            return {
              label: branches.CompanyBranchName,
              value: branches.CompanyBranchId,
            };
          }),
        ]}
        nothingFoundMessage={
          <div
            onClick={() => navigate(PageRoutes.COMPANY_BRANCHES)}
            className="bg-primaryGold text-surface font-medium p-2 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <AiOutlinePlus size={18} />
              <span>Add new branch</span>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default SelectBranch;
