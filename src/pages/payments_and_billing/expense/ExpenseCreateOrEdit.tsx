import { openContextModal } from '@mantine/modals';
import Button from '../../../common/button/Button';
import PageHeader from '../../../common/PageHeader';
import {
  useAuthState,
  useEditFormStore,
  usePaymentState,
  useUIState,
} from '../../../store';
import InputSelect from '../../../common/inputs/InputSelect';
import expenseCategory from '../../../../public/assets/json/ExpenseCategories.json';
import InputWithTopHeader from '../../../common/inputs/InputWithTopHeader';
import InputDate from '../../../common/inputs/InputDate';
import TextareaWithTopHeader from '../../../common/inputs/TextareaWithTopHeader';
import {
  ExpenseCreateFormFields,
  expenseCreateSchema,
} from '../../../utilities/zod/schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChangeEvent, useEffect, useState } from 'react';
import { roundNumber, toDate } from '../../../utilities/misc';
import { numberFormatter } from '../../../utilities/NumberFormater';
import { errorHandler } from '../../../utilities/CustomError';
import DbPayment from '../../../firebase_configs/DB/DbPayment';
import { showSnackbar } from '../../../utilities/TsxUtils';
import { useNavigate } from 'react-router-dom';
import { PageRoutes } from '../../../@types/enum';
import { FaImage } from 'react-icons/fa';
import { AiOutlinePlus } from 'react-icons/ai';

const ExpenseCreateOrEdit = () => {
  const { expenseEditData } = useEditFormStore();

  const { recentExpenseNumber } = usePaymentState();

  const isEdit = !!expenseEditData;

  console.log(recentExpenseNumber, 'here');

  const {
    register,
    formState: { errors },
    watch,
    setValue,
    handleSubmit,
  } = useForm<ExpenseCreateFormFields>({
    resolver: zodResolver(expenseCreateSchema),
    defaultValues: isEdit
      ? {
          ExpenseAmount: expenseEditData.ExpenseAmount,
          ExpenseBalanceAmount: expenseEditData.ExpenseBalanceAmount,
          ExpenseCategory: expenseEditData.ExpenseCategory,
          ExpenseCompanyBranchId: expenseEditData.ExpenseCompanyBranchId,
          ExpenseDate: toDate(expenseEditData.ExpenseDate),
          ExpenseDescription: expenseEditData.ExpenseDescription,
          ExpenseNumber: expenseEditData.ExpenseNumber,
          ExpensePaidAmount: expenseEditData.ExpensePaidAmount,
          ExpensePaymentRef: expenseEditData.ExpensePaymentRef,
          ExpensePaymentType: expenseEditData.ExpensePaymentType,
        }
      : { ExpenseNumber: String(recentExpenseNumber + 1) },
  });

  const navigate = useNavigate();

  const { company, companyBranches } = useAuthState();

  const { setLoading } = useUIState();

  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  const onSubmit = async (data: ExpenseCreateFormFields) => {
    if (!company) return;

    try {
      setLoading(true);

      if (isEdit) {
        await DbPayment.updateExpense({
          cmpId: company.CompanyId,
          data,
          receiptImg: receiptImage,
          expenseId: expenseEditData.ExpenseId,
        });
        showSnackbar({
          message: 'Expense updated successfully',
          type: 'success',
        });
      } else {
        await DbPayment.createExpense(company.CompanyId, data, receiptImage);
        showSnackbar({
          message: 'Expense created successfully',
          type: 'success',
        });
      }

      setLoading(false);

      navigate(PageRoutes.EXPENSE_LIST);
    } catch (error) {
      console.log(error);
      errorHandler(error);
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!isEdit) return;
    try {
      setLoading(true);

      await DbPayment.deleteExpense(expenseEditData.ExpenseId);

      showSnackbar({
        message: 'Expense deleted successfully',
        type: 'success',
      });

      setLoading(false);

      navigate(PageRoutes.EXPENSE_LIST);
    } catch (error) {
      console.log(error);
      errorHandler(error);
      setLoading(false);
    }
  };

  console.log(errors);

  const [expenseAmt, paidAmt, paymentType] = watch([
    'ExpenseAmount',
    'ExpensePaidAmount',
    'ExpensePaymentType',
  ]);

  useEffect(() => {
    setValue('ExpenseBalanceAmount', roundNumber(expenseAmt - paidAmt));
  }, [expenseAmt, paidAmt]);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <PageHeader
        title="Create Expense"
        rightSection={
          <div className="flex gap-4 items-center">
            {isEdit && (
              <Button
                label="Delete"
                onClick={() => {
                  openContextModal({
                    modal: 'confirmModal',
                    withCloseButton: false,
                    centered: true,
                    closeOnClickOutside: true,
                    innerProps: {
                      title: 'Confirm',
                      body: 'Are you sure to delete this expense',
                      onConfirm: () => {
                        onDelete();
                      },
                    },
                    size: '30%',
                    styles: {
                      body: { padding: '0px' },
                    },
                  });
                }}
                type="blue"
                className="px-6 py-2"
              />
            )}
            <Button
              label={isEdit ? 'Update' : 'Save'}
              onClick={handleSubmit(onSubmit)}
              type="black"
              className="px-6 py-2"
            />
          </div>
        }
      />

      <div className=" p-4 flex flex-col gap-4">
        <div className="flex items-start justify-between w-full gap-4">
          <div className="bg-surface shadow rounded flex flex-col gap-4 p-4 w-full max-w-xl">
            <div className="font-semibold">Expense Details</div>
            <InputSelect
              data={expenseCategory}
              label="Expense Category"
              value={watch('ExpenseCategory')}
              onChange={(e) => setValue('ExpenseCategory', e as string)}
              error={errors.ExpenseCategory?.message}
              searchable
            />

            <InputWithTopHeader
              className="mx-0"
              label="Sub category (Optional)"
              register={register}
              name="ExpenseSubCategory"
              error={errors.ExpenseSubCategory?.message}
            />

            <InputWithTopHeader
              className="mx-0"
              label="Expense Amount"
              register={register}
              name="ExpenseAmount"
              error={errors.ExpenseAmount?.message}
              decimalCount={2}
              leadingIcon={<div>$</div>}
            />
          </div>
          <div className="bg-surface shadow rounded flex flex-col gap-4 p-4 w-full max-w-xl">
            <div className="font-semibold">Transaction Details</div>
            <InputDate
              label="Expense Date"
              value={watch('ExpenseDate')}
              setValue={(e) => setValue('ExpenseDate', e as Date)}
              error={errors.ExpenseDate?.message}
            />
            <InputWithTopHeader
              className="mx-0"
              label="Expense Number"
              register={register}
              name="ExpenseNumber"
              error={errors.ExpenseNumber?.message}
              decimalCount={0}
            />
            <InputSelect
              label="Branch"
              data={companyBranches.map((branch) => {
                return {
                  label: branch.CompanyBranchName,
                  value: branch.CompanyBranchId,
                };
              })}
              value={watch('ExpenseCompanyBranchId') || ''}
              onChange={(e) => setValue('ExpenseCompanyBranchId', e as string)}
              searchable
              nothingFoundMessage={
                <div
                  onClick={() => {
                    navigate(PageRoutes.COMPANY_BRANCHES);
                  }}
                  className="bg-primaryGold text-surface font-medium p-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <AiOutlinePlus size={18} />
                    <span>Add new branch</span>
                  </div>
                </div>
              }
              error={errors.ExpenseCompanyBranchId?.message}
            />
          </div>
        </div>
        <div className="bg-surface shadow rounded flex flex-col gap-4 p-4 w-full">
          <div className="font-semibold">Pricing & Additional Details</div>

          <div className="flex items-start gap-8 w-full justify-between">
            <div className="flex flex-col w-full max-w-xl border border-inputBorder rounded bg-onHoverBg gap-4">
              <div className="font-semibold text-lg border-b-[2px] border-inputBorder p-4">
                Add Description
              </div>
              <div className="px-4 pb-4">
                <TextareaWithTopHeader
                  placeholder="Add description"
                  className="mx-0 w-full"
                  register={register}
                  name="ExpenseDescription"
                  error={errors.ExpenseDescription?.message}
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 w-full max-w-xl border border-inputBorder rounded bg-onHoverBg h-full">
              <div className="flex items-center justify-between font-semibold text-lg border-b-[2px] border-inputBorder p-4">
                <div>Total Amount: </div>
                <div>{numberFormatter(expenseAmt, true)}</div>
              </div>
              <div className="px-4 pb-4 flex flex-col gap-4">
                <div className="flex items-center gap-4 justify-between w-full">
                  <div className="text-lg">Paid</div>
                  <InputWithTopHeader
                    className="mx-0"
                    register={register}
                    name="ExpensePaidAmount"
                    error={errors.ExpensePaidAmount?.message}
                    leadingIcon={<div>$</div>}
                    decimalCount={2}
                  />
                </div>

                {paymentType === 'cheque' && (
                  <div className="flex items-center gap-4 justify-between w-full">
                    <div className="text-lg">Payment Ref</div>
                    <InputWithTopHeader
                      className="mx-0"
                      register={register}
                      name="ExpensePaymentRef"
                      error={errors.ExpensePaymentRef?.message}
                    />
                  </div>
                )}

                <div className="flex items-center gap-4 justify-between w-full">
                  <div className="text-base">Payment mode</div>
                  <select {...register('ExpensePaymentType')}>
                    <option value={'cash'}>Cash</option>
                    <option value={'cheque'}>Cheque</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 bg-surface p-4 rounded shadow">
          <div className="font-semibold">Upload receipt image</div>
          <label
            htmlFor="img"
            className="flex flex-col items-center justify-center border border-dashed border-black rounded-md p-4 cursor-pointer"
          >
            {receiptImage ? (
              <img
                src={receiptImage}
                alt={'Void check'}
                className="w-1/2 max-h-[800px] rounded"
              />
            ) : (
              <>
                <FaImage className="text-3xl" />
                <span className="text-textPrimaryBlue cursor-pointer">
                  Upload receipt
                </span>
              </>
            )}
            <input
              id="img"
              type="file"
              accept="image/*"
              hidden
              className="hidden"
              onChange={handleImageUpload}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default ExpenseCreateOrEdit;
