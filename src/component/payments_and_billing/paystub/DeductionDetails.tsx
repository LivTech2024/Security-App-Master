import { FaRegTrashAlt } from 'react-icons/fa';
import InputWithTopHeader from '../../../common/inputs/InputWithTopHeader';
import { IDeductionList } from '../../../pages/payments_and_billing/paystub/PayStubGenerate';
import InputSelect from '../../../common/inputs/InputSelect';
import { AiOutlinePlus } from 'react-icons/ai';
import { numberFormatter } from '../../../utilities/NumberFormater';

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
        Deduction: 'other',
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any
  ) => {
    const updatedEarningList = [...deductionsList];
    updatedEarningList[index][field] = value;

    setDeductionsList(updatedEarningList);
  };

  return (
    <div className="flex flex-col gap-4 bg-surface shadow rounded p-4 items-start  h-full w-full">
      <div className="font-semibold">Deduction Details</div>
      <table className="w-full">
        <thead className="bg-onHoverBg">
          <tr>
            <th className="text-start pl-2 pr-4 py-2 w-[30%]">Deduction</th>
            <th className="text-start px-4 py-2 w-[40%]">Current Amount</th>
            <th className="text-start px-4 py-2 w-[25%]">YTD Amount</th>
            <th className="text-start pl-4 py-2 w-[5%]"></th>
          </tr>
        </thead>
        <tbody>
          {deductionsList.map((data, idx) => {
            return (
              <tr>
                <td className="text-start pr-4 py-2">
                  <InputSelect
                    data={[
                      { label: 'CPP', value: 'CPP' },
                      { label: 'EI', value: 'EI' },
                      { label: 'Income Tax', value: 'Income Tax' },
                      { label: 'Other', value: 'Other' },
                    ]}
                    value={data.Deduction}
                    onChange={(e) =>
                      onFieldChange(idx, 'Deduction', e as string)
                    }
                  />
                </td>
                <td className="text-start px-4 py-2">
                  <div className="flex items-center gap-4 w-full">
                    <InputWithTopHeader
                      className="mx-0 w-full"
                      value={data.Amount}
                      onChange={(e) =>
                        onFieldChange(idx, 'Amount', e.target.value)
                      }
                      decimalCount={2}
                      leadingIcon={<span>%</span>}
                      placeholder="Percentage"
                    />
                    <InputWithTopHeader
                      className="mx-0 w-full"
                      value={data.Amount}
                      onChange={(e) =>
                        onFieldChange(idx, 'Amount', e.target.value)
                      }
                      decimalCount={2}
                      leadingIcon={<span>$</span>}
                    />
                  </div>
                </td>
                <td className="text-start px-4 py-2">
                  <InputWithTopHeader
                    className="mx-0 w-full"
                    value={data.YearToDateAmt}
                    onChange={(e) =>
                      onFieldChange(idx, 'YearToDateAmt', e.target.value)
                    }
                    decimalCount={2}
                    leadingIcon={<span>$</span>}
                  />
                </td>
                <td className="text-start pl-4 py-2">
                  <span className="pb-[12px] cursor-pointer text-xl hover:scale-105 duration-200">
                    <FaRegTrashAlt onClick={() => handleRemoveDeduction(idx)} />
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-onHoverBg font-semibold">
            <td className="text-start pl-2 pr-4 py-2 ">Total</td>

            <td className="text-start px-4 py-2">
              {numberFormatter(
                deductionsList.reduce(
                  (acc, obj) => acc + Number(obj.Amount),
                  0
                ),
                true
              )}
            </td>
            <td className="text-start pl-4 py-2">
              {numberFormatter(
                deductionsList.reduce(
                  (acc, obj) => acc + Number(obj.YearToDateAmt),
                  0
                ),
                true
              )}
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
      <button
        onClick={handleAddDeductionDetail}
        className="w-full border-2 border-dashed border-secondary rounded-full py-[10px] text-textPrimaryBlue font-semibold flex items-center justify-center gap-2"
      >
        <AiOutlinePlus /> Add New Deduction
      </button>
    </div>
  );
};

export default DeductionDetails;
