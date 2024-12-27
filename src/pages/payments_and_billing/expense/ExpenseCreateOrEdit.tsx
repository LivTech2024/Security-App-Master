import { openContextModal } from '@mantine/modals';
import Button from '../../../common/button/Button';
import PageHeader from '../../../common/PageHeader';
import { useEditFormStore } from '../../../store';
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
import { useEffect } from 'react';
import { roundNumber } from '../../../utilities/misc';
import { numberFormatter } from '../../../utilities/NumberFormater';

const ExpenseCreateOrEdit = () => {
  const { expenseEditData } = useEditFormStore();

  const isEdit = !!expenseEditData;

  const {
    register,
    formState: { errors },
    watch,
    setValue,
    handleSubmit,
  } = useForm<ExpenseCreateFormFields>({
    resolver: zodResolver(expenseCreateSchema),
  });

  const onSubmit = async (data: ExpenseCreateFormFields) => {
    console.log(data, 'here');
  };

  console.log(errors);

  const [expenseAmt, paidAmt] = watch(['ExpenseAmount', 'ExpensePaidAmount']);

  useEffect(() => {
    setValue('ExpenseBalanceAmount', roundNumber(expenseAmt - paidAmt));
  }, [expenseAmt, paidAmt]);

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
                      body: 'Are you sure to delete this invoice',
                      onConfirm: () => {
                        // onDelete();
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
            />
          </div>
          <div className="bg-surface shadow rounded flex flex-col gap-4 p-4 w-full max-w-xl">
            <div className="font-semibold">Transaction Details</div>
            <InputDate
              label="Expense Date"
              value={watch('ExpenseDate')}
              setValue={(e) => setValue('ExpenseDate', e as Date)}
            />
            <InputWithTopHeader
              className="mx-0"
              label="Expense Number"
              register={register}
              name="ExpenseNumber"
              error={errors.ExpenseNumber?.message}
              decimalCount={0}
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
      </div>
    </div>
  );
};

export default ExpenseCreateOrEdit;
