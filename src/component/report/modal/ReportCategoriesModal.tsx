import React, { useEffect, useState } from 'react';
import Dialog from '../../../common/Dialog';
import InputWithTopHeader from '../../../common/inputs/InputWithTopHeader';
import Button from '../../../common/button/Button';
import { useAuthState } from '../../../store';
import DbCompany from '../../../firebase_configs/DB/DbCompany';
import { closeModalLoader, showModalLoader } from '../../../utilities/TsxUtils';
import { errorHandler } from '../../../utilities/CustomError';
import { IReportCategoriesCollection } from '../../../@types/database';
import { FaRegTrashAlt } from 'react-icons/fa';
import { openContextModal } from '@mantine/modals';
import TableShimmer from '../../../common/shimmer/TableShimmer';
import { useQueryClient } from '@tanstack/react-query';
import { REACT_QUERY_KEYS } from '../../../@types/enum';

const ReportCategoriesModal = ({
  opened,
  setOpened,
  categories,
  isCategoriesLoading,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
  categories: IReportCategoriesCollection[];
  isCategoriesLoading: boolean;
}) => {
  const { company } = useAuthState();

  const [category, setCategory] = useState('');

  const [loading, setLoading] = useState(false);

  const queryClient = useQueryClient();

  const onSave = async () => {
    if (!company || !category) return;
    try {
      setLoading(true);

      await DbCompany.addReportCategory(category, company.CompanyId);

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.REPORT_CATEGORIES],
      });

      setLoading(false);
      setCategory('');
    } catch (error) {
      errorHandler(error);
      setLoading(false);
      console.log(error);
    }
  };

  const onDelete = async (catId: string) => {
    try {
      setLoading(true);

      await DbCompany.deleteReportCategory(catId);

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.REPORT_CATEGORIES],
      });

      setLoading(false);
    } catch (error) {
      errorHandler(error);
      setLoading(false);
      console.log(error);
    }
  };

  useEffect(() => {
    if (loading) {
      showModalLoader({});
    } else {
      closeModalLoader();
    }
    return () => closeModalLoader();
  }, [loading]);

  return (
    <Dialog
      opened={opened}
      setOpened={setOpened}
      title="Report Categories"
      size="50%"
      showBottomTool={false}
    >
      <div className="flex flex-col gap-4">
        <div className="font-semibold">Add new role</div>
        <div className="flex items-center w-full gap-4">
          <InputWithTopHeader
            placeholder="Enter category name"
            className="mx-0 w-full"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Button
            label="Save"
            onClick={onSave}
            type="black"
            className="py-[10px] px-6"
          />
        </div>

        <table>
          <thead className="">
            <tr>
              <th className="w-3/4 text-start py-2 px-2">Category Name</th>
              <th className="w-1/4 text-end"></th>
            </tr>
          </thead>
          <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
            {!isCategoriesLoading ? (
              categories.map((cat) => {
                return (
                  <tr key={cat.ReportCategoryId}>
                    <td className="py-2 px-2">{cat.ReportCategoryName}</td>
                    <td className="text-end flex justify-end py-2 px-2">
                      <FaRegTrashAlt
                        onClick={() =>
                          openContextModal({
                            modal: 'confirmModal',
                            withCloseButton: false,
                            centered: true,
                            closeOnClickOutside: true,
                            innerProps: {
                              title: 'Confirm',
                              body: 'Are you sure to delete this category',
                              onConfirm: () => onDelete(cat.ReportCategoryId),
                              onCancel: () => {
                                setOpened(true);
                              },
                            },
                            size: '30%',
                            styles: {
                              body: { padding: '0px' },
                            },
                          })
                        }
                        className="cursor-pointer text-lg text-textPrimaryRed hover:scale-[1.1]"
                      />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7}>
                  {Array.from({ length: 10 }).map((_, idx) => (
                    <TableShimmer key={idx} />
                  ))}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Dialog>
  );
};

export default ReportCategoriesModal;
