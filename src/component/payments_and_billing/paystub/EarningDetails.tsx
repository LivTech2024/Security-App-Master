import { IPayStubEarningsChildCollection } from '../../../@types/database';
import InputWithTopHeader from '../../../common/inputs/InputWithTopHeader';
import { FaRegTrashAlt } from 'react-icons/fa';
import Button from '../../../common/button/Button';
import { IEarningList } from '../../../pages/payments_and_billing/paystub/PayStubGenerate';

interface EarningDetailsProps {
  earningsList: IEarningList[];
  setEarningsList: React.Dispatch<React.SetStateAction<IEarningList[]>>;
}

const EarningDetails = ({
  earningsList,
  setEarningsList,
}: EarningDetailsProps) => {
  const handleAddEarningDetail = () => {
    setEarningsList([
      ...earningsList,
      {
        Name: '',
        Amount: '',
        Quantity: '',
        YearToDateAmt: '',
      },
    ]);
  };

  const handleRemoveEarning = (idx: number) => {
    if (earningsList.length <= 1) return;
    setEarningsList((prev) => prev.filter((_, index) => index !== idx));
  };

  const onFieldChange = (
    index: number,
    field: keyof IPayStubEarningsChildCollection,
    value: string
  ) => {
    const updatedEarningList = [...earningsList];
    updatedEarningList[index][field] = value;

    setEarningsList(updatedEarningList);
  };

  return (
    <div className="flex flex-col gap-4 bg-surface shadow rounded p-4 items-start  h-full w-full">
      <div className="font-semibold">Earnings Details</div>
      {earningsList.map((data, idx) => {
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
              label="Quantity"
              value={data.Quantity}
              onChange={(e) => onFieldChange(idx, 'Quantity', e.target.value)}
              leadingIcon={<span>$</span>}
              decimalCount={2}
            />
            <InputWithTopHeader
              className="mx-0 w-full"
              label="Current Total"
              value={Number(data.Quantity ?? 0) * Number(data.Amount ?? 0)}
              onChange={(e) =>
                onFieldChange(idx, 'YearToDateAmt', e.target.value)
              }
              decimalCount={2}
              disabled
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
              <FaRegTrashAlt onClick={() => handleRemoveEarning(idx)} />
            </span>
          </div>
        );
      })}

      <Button
        label="Add New Earning"
        type="blue"
        onClick={handleAddEarningDetail}
      />
    </div>
  );
};

export default EarningDetails;
