import { FaRegTrashAlt } from 'react-icons/fa';
import InputWithTopHeader from '../../../common/inputs/InputWithTopHeader';
import { IDeductionList } from '../../../pages/payments_and_billing/paystub/PayStubGenerate';
import Button from '../../../common/button/Button';

interface DeductionDetailsProps {
  deductionsList: IDeductionList[];
  setDeductionsList: React.Dispatch<React.SetStateAction<IDeductionList[]>>;
}

const DeductionDetails = ({
  deductionsList,
  setDeductionsList,
}: DeductionDetailsProps) => {
  const handleAddDeductionDetail = () => {
    setDeductionsList([
      ...deductionsList,
      {
        Name: '',
        Amount: '',
        YearToDateAmt: '',
      },
    ]);
  };

  const handleRemoveDeduction = (idx: number) => {
    if (deductionsList.length <= 1) return;
    setDeductionsList((prev) => prev.filter((_, index) => index !== idx));
  };

  const onFieldChange = (
    index: number,
    field: keyof IDeductionList,
    value: string
  ) => {
    const updatedEarningList = [...deductionsList];
    updatedEarningList[index][field] = value;

    setDeductionsList(updatedEarningList);
  };

  return (
    <div className="flex flex-col gap-4 bg-surface shadow rounded p-4 items-start  h-full w-full">
      <div className="font-semibold">Deduction Details</div>
      {deductionsList.map((data, idx) => {
        return (
          <div className="flex items-end gap-4 w-full justify-between">
            <InputWithTopHeader
              className="mx-0 w-full"
              label="Name"
              value={data.Name}
              onChange={(e) => onFieldChange(idx, 'Name', e.target.value)}
            />
            <InputWithTopHeader
              className="mx-0 w-full"
              label="Amount"
              value={data.Amount}
              onChange={(e) => onFieldChange(idx, 'Amount', e.target.value)}
              decimalCount={2}
              leadingIcon={<span>$</span>}
            />

            <InputWithTopHeader
              className="mx-0 w-full"
              label="YTD"
              value={data.YearToDateAmt}
              onChange={(e) =>
                onFieldChange(idx, 'YearToDateAmt', e.target.value)
              }
              decimalCount={2}
              disabled
              leadingIcon={<span>$</span>}
            />
            <span className="pb-[12px] cursor-pointer text-xl hover:scale-105 duration-200">
              <FaRegTrashAlt onClick={() => handleRemoveDeduction(idx)} />
            </span>
          </div>
        );
      })}

      <Button
        label="Add New Deduction"
        type="blue"
        onClick={handleAddDeductionDetail}
      />
    </div>
  );
};

export default DeductionDetails;
