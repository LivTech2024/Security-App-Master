import { IPayStubEarningsChildCollection } from '../../../@types/database';
import InputWithTopHeader from '../../../common/inputs/InputWithTopHeader';
import { FaRegTrashAlt } from 'react-icons/fa';
import Button from '../../../common/button/Button';
import { IEarningList } from '../../../pages/payments_and_billing/paystub/PayStubGenerate';
import InputSelect from '../../../common/inputs/InputSelect';

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
        Income: 'Regular',
        Type: 'Fixed',
        CurrentAmount: '',
        YTDAmount: '',
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
    updatedEarningList[index][field] = value as never;

    setEarningsList(updatedEarningList);
  };

  return (
    <div className="flex flex-col gap-4 bg-surface shadow rounded p-4 items-start  h-full w-full">
      <div className="font-semibold">Earnings Details</div>
      <table className="w-full">
        <thead className="bg-onHoverBg">
          <tr>
            <th className="text-start py-2 pl-2 pr-4 w-[15%]">Income</th>
            <th className="text-start py-2 px-4 w-[15%]">Type</th>
            <th className="text-start py-2 px-4 w-[40%]">Current Amount</th>
            <th className="text-start py-2 px-4 w-[25%]">YTD Amount</th>
            <th className="text-start py-2 pl-4 w-[5%]"></th>
          </tr>
        </thead>
        <tbody>
          {earningsList.map((data, idx) => {
            return (
              <tr>
                <td className="text-start pr-4 py-2">
                  <InputSelect
                    data={[
                      { label: 'Regular', value: 'Regular' },
                      { label: 'Overtime', value: 'Overtime' },
                      { label: 'Vacation', value: 'Vacation' },
                      { label: 'Bonus', value: 'Bonus' },
                      { label: 'Stat', value: 'Stat' },
                    ]}
                    value={data.Income}
                    onChange={(e) => onFieldChange(idx, 'Income', e as string)}
                  />
                </td>
                <td className="text-start pr-4 py-2">
                  <InputSelect
                    data={[
                      { label: 'Hourly', value: 'Hourly' },
                      { label: 'Fixed', value: 'Fixed' },
                    ]}
                    value={data.Type}
                    onChange={(e) => onFieldChange(idx, 'Type', e as string)}
                  />
                </td>

                <td className="text-start px-4 py-2">
                  {data.Type === 'Fixed' ? (
                    <InputWithTopHeader
                      className="mx-0 w-full"
                      value={data.CurrentAmount}
                      onChange={(e) =>
                        onFieldChange(idx, 'CurrentAmount', e.target.value)
                      }
                      decimalCount={2}
                      leadingIcon={<span>$</span>}
                    />
                  ) : (
                    <div className="flex items-center gap-4">
                      <InputWithTopHeader
                        className="mx-0"
                        placeholder="Hrs"
                        value={data.Quantity}
                        onChange={(e) =>
                          onFieldChange(idx, 'Quantity', e.target.value)
                        }
                        decimalCount={2}
                      />
                      <InputWithTopHeader
                        className="mx-0"
                        placeholder="Rate"
                        value={data.Rate}
                        onChange={(e) =>
                          onFieldChange(idx, 'Rate', e.target.value)
                        }
                        decimalCount={2}
                      />
                      <span>=</span>
                      <InputWithTopHeader
                        className="mx-0"
                        leadingIcon={<span>$</span>}
                        value={
                          Number(data.Rate ?? 0) * Number(data.Quantity ?? 0)
                        }
                        disabled
                      />
                    </div>
                  )}
                </td>
                <td className="text-start px-4 py-2">
                  <InputWithTopHeader
                    className="mx-0 w-full"
                    value={data.YTDAmount}
                    onChange={(e) =>
                      onFieldChange(idx, 'YTDAmount', e.target.value)
                    }
                    decimalCount={2}
                    leadingIcon={<span>$</span>}
                  />
                </td>
                <td className="text-start align-middle pl-4 py-2">
                  <span className="pb-[12px] cursor-pointer text-xl hover:scale-105 duration-200">
                    <FaRegTrashAlt onClick={() => handleRemoveEarning(idx)} />
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Button
        label="Add New Earning"
        type="blue"
        onClick={handleAddEarningDetail}
      />
    </div>
  );
};

export default EarningDetails;
