import {
  IPayStubEarningsChildCollection,
  IPayStubsCollection,
} from '../../../@types/database';
import InputWithTopHeader from '../../../common/inputs/InputWithTopHeader';
import { FaRegTrashAlt } from 'react-icons/fa';
import { IEarningList } from '../../../pages/payments_and_billing/paystub/PayStubGenerate';
import InputSelect from '../../../common/inputs/InputSelect';
import { numberFormatter } from '../../../utilities/NumberFormater';
import { AiOutlinePlus } from 'react-icons/ai';
import { MdClose } from 'react-icons/md';
import { RiEqualFill } from 'react-icons/ri';

interface EarningDetailsProps {
  earningsList: IEarningList[];
  setEarningsList: React.Dispatch<React.SetStateAction<IEarningList[]>>;
  previousPayStub: IPayStubsCollection | null;
}

const EarningDetails = ({
  earningsList,
  setEarningsList,
  previousPayStub,
}: EarningDetailsProps) => {
  const handleAddEarningDetail = () => {
    const prevYtdAmount =
      previousPayStub?.PayStubEarnings.find((res) => res.Income === 'Regular')
        ?.YTDAmount || 0;
    setEarningsList([
      ...earningsList,
      {
        Income: 'Regular',
        Type: 'Fixed',
        CurrentAmount: '',
        YTDAmount: String(prevYtdAmount),
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

    const prevYtdAmt =
      previousPayStub?.PayStubEarnings.find(
        (res) => res.Income === updatedEarningList[index].Income
      )?.YTDAmount || 0;

    if (field === 'CurrentAmount' || field === 'Rate' || field === 'Quantity') {
      updatedEarningList[index].YTDAmount = String(
        prevYtdAmt +
          (Number(updatedEarningList[index].CurrentAmount) ||
            Number(updatedEarningList[index].Rate) *
              Number(updatedEarningList[index].Quantity))
      );
    }

    if (field === 'Income') {
      updatedEarningList[index].YTDAmount = String(prevYtdAmt);
    }

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
                      { label: 'Banked', value: 'Banked' },
                      { label: 'Overtime', value: 'Overtime' },
                      { label: 'Vacation', value: 'Vacation' },
                      { label: 'Bonus', value: 'Bonus' },
                      { label: 'Stat', value: 'Stat' },
                    ]}
                    value={data.Income}
                    onChange={(e) => {
                      onFieldChange(idx, 'Income', e as string);
                    }}
                  />
                </td>
                <td className="text-start pr-4 py-2">
                  <InputSelect
                    data={[
                      { label: 'Hourly', value: 'Hourly' },
                      { label: 'Fixed', value: 'Fixed' },
                    ]}
                    value={data.Type}
                    onChange={(e) => {
                      onFieldChange(idx, 'Type', e as string);
                      onFieldChange(idx, 'CurrentAmount', '');
                      onFieldChange(idx, 'Rate', '');
                      onFieldChange(idx, 'Quantity', '');
                    }}
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
                      leadingIcon={
                        <span>{data.Income === 'Banked' ? '-$' : '$'}</span>
                      }
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
                      <MdClose className="text-xl" />
                      <InputWithTopHeader
                        className="mx-0"
                        placeholder="Rate"
                        value={data.Rate}
                        onChange={(e) =>
                          onFieldChange(idx, 'Rate', e.target.value)
                        }
                        decimalCount={2}
                      />
                      <RiEqualFill className="text-xl" />
                      <InputWithTopHeader
                        className="mx-0"
                        value={
                          Number(data.Rate ?? 0) * Number(data.Quantity ?? 0)
                        }
                        onChange={(e) =>
                          onFieldChange(idx, 'CurrentAmount', e.target.value)
                        }
                        disabled
                        leadingIcon={
                          <span>{data.Income === 'Banked' ? '-$' : '$'}</span>
                        }
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
        <tfoot>
          <tr className="bg-onHoverBg font-semibold">
            <td className="text-start pl-2 pr-4 py-2 ">Total</td>
            <td className="text-start px-4 py-2"></td>
            <td className="text-start px-4 py-2">
              {numberFormatter(
                earningsList.reduce((acc, obj) => {
                  const amount =
                    Number(obj.CurrentAmount) ||
                    Number(obj.Rate ?? 0) * Number(obj.Quantity ?? 0);

                  if (obj.Income === 'Banked') {
                    return acc - amount;
                  }

                  return acc + amount;
                }, 0),
                true
              )}
            </td>
            <td className="text-start pl-4 py-2">
              {numberFormatter(
                earningsList.reduce(
                  (acc, obj) => acc + Number(obj.YTDAmount),
                  0
                ),
                true
              )}
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      <div className="flex items-center justify-between w-full">
        <button
          type="button"
          onClick={handleAddEarningDetail}
          className="w-full border-2 border-dashed border-secondary rounded-full py-[10px] text-textPrimaryBlue font-semibold flex items-center justify-center gap-2"
        >
          <AiOutlinePlus /> Add New Earning
        </button>
      </div>
    </div>
  );
};

export default EarningDetails;
