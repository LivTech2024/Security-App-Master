import { useState } from 'react';
import Button from '../../common/button/Button';
import AddBranchModal from '../../component/company_branches/modal/AddBranchModal';
import { useAuthState, useEditFormStore } from '../../store';
import NoSearchResult from '../../common/NoSearchResult';
import { CompanyBranches as ICompanyBranches } from '../../store/slice/auth.slice';
import PageHeader from '../../common/PageHeader';

const CompanyBranches = () => {
  const [addBranchModal, setAddBranchModal] = useState(false);

  const { companyBranches } = useAuthState();
  const { setCompanyBranchEditData } = useEditFormStore();
  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <PageHeader
        title="Company Branches"
        rightSection={
          <Button
            type="black"
            label="Create New Branch"
            onClick={() => {
              setCompanyBranchEditData(null);
              setAddBranchModal(true);
            }}
            className="px-4 py-2"
          />
        }
      />

      <AddBranchModal opened={addBranchModal} setOpened={setAddBranchModal} />
      <table className="rounded overflow-hidden w-full">
        <thead className="bg-primary text-surface text-sm">
          <tr>
            <th className="uppercase px-4 py-2 w-[20%] text-start">
              Branch Name
            </th>
            <th className="uppercase px-4 py-2 w-[20%] text-center">
              Branch Email
            </th>
            <th className="uppercase px-4 py-2 w-[20%] text-center">
              Branch Phone
            </th>
            <th className="uppercase px-4 py-2 w-[30%] text-end">
              Branch Address
            </th>
          </tr>
        </thead>
        <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
          {companyBranches.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <NoSearchResult text="No company branch" />
              </td>
            </tr>
          ) : (
            companyBranches.map((branch) => {
              return (
                <tr
                  onClick={() => {
                    setCompanyBranchEditData(
                      branch as unknown as ICompanyBranches
                    );
                    setAddBranchModal(true);
                  }}
                  key={branch.CompanyBranchId}
                  className="cursor-pointer"
                >
                  <td className="px-4 py-2 text-start">
                    {branch.CompanyBranchName}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {branch.CompanyBranchEmail}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {branch.CompanyBranchPhone}
                  </td>
                  <td className="px-4 py-2 text-end">
                    <span className="line-clamp-3">
                      {branch.CompanyBranchAddress}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CompanyBranches;
