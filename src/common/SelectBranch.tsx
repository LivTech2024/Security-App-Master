import { useAuthState } from '../store';
import { LocalStorageKey } from '../@types/enum';
import InputSelect from './inputs/InputSelect';
import { useEffect } from 'react';

const SelectBranch = ({
  selectedBranch,
  setSelectedBranch,
}: {
  selectedBranch: string;
  setSelectedBranch: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const { companyBranches } = useAuthState();

  useEffect(() => {
    setSelectedBranch(
      localStorage.getItem(LocalStorageKey.SELECTED_BRANCH) || ''
    );
  }, []);

  return (
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
    />
  );
};

export default SelectBranch;
