import { FaRegTrashAlt } from 'react-icons/fa';
import InputWithTopHeader from '../../../common/inputs/InputWithTopHeader';
import { IDeductionList } from '../../../pages/payments_and_billing/paystub/PayStubGenerate';
import InputSelect from '../../../common/inputs/InputSelect';
import { AiOutlinePlus } from 'react-icons/ai';
import { numberFormatter } from '../../../utilities/NumberFormater';
import { roundNumber } from '../../../utilities/misc';
import { IPayStubsCollection } from '../../../@types/database';
import { useEditFormStore } from '../../../store';
import { useEffect } from 'react';

interface DeductionDetailsProps {
  deductionsList: IDeductionList[];
  setDeductionsList: React.Dispatch<React.SetStateAction<IDeductionList[]>>;
  totalEarnings: number;
  previousPayStub: IPayStubsCollection | null;
}

const DeductionDetails = ({
  deductionsList,
  setDeductionsList,
  totalEarnings,
  previousPayStub,
}: DeductionDetailsProps) => {
  const { payStubEditData } = useEditFormStore();

  const isEdit = !!payStubEditData;

  useEffect(() => {
    if (!isEdit) return;
    setDeductionsList(
      payStubEditData.PayStubDeductions.map((res) => {
        return {
          Amount: String(res.Amount),
          Deduction: res.Deduction,
          Percentage: String(res.Percentage),
          YearToDateAmt: String(res.YearToDateAmt),
          OtherDeduction: String(res.OtherDeduction || ''),
        };
      })
    );
  }, [isEdit]);

  const handleAddDeductionDetail = () => {
    const prevYtdAmount =
      previousPayStub?.PayStubDeductions.find((res) => res.Deduction === 'CPP')
        ?.YearToDateAmt || 0;
    setDeductionsList([
      ...deductionsList,
      {
        Deduction: 'CPP',
        Amount: '',
        YearToDateAmt: String(prevYtdAmount),
        Percentage: '',
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

    const prevYtdAmt =
      previousPayStub?.PayStubDeductions.find(
        (res) => res.Deduction === updatedEarningList[index].Deduction
      )?.YearToDateAmt || 0;

    if (field === 'Amount' || field === 'Percentage') {
      updatedEarningList[index].YearToDateAmt = String(
        prevYtdAmt + Number(updatedEarningList[index].Amount)
      );
    }

    if (field === 'Deduction') {
      updatedEarningList[index].YearToDateAmt = String(prevYtdAmt);
    }

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
                  <div className="flex items-center gap-4 w-full">
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
                      className="w-full"
                    />
                    {data.Deduction === 'Other' && (
                      <InputWithTopHeader
                        className="mx-0 w-[150%]"
                        placeholder="Other deduction"
                        value={data.OtherDeduction || ''}
                        onChange={(e) =>
                          onFieldChange(idx, 'OtherDeduction', e.target.value)
                        }
                      />
                    )}
                  </div>
                </td>
                <td className="text-start px-4 py-2">
                  <div className="flex items-center gap-4 w-full">
                    <InputWithTopHeader
                      className="mx-0 w-full"
                      value={data.Percentage}
                      onChange={(e) =>
                        onFieldChange(idx, 'Percentage', e.target.value)
                      }
                      decimalCount={2}
                      leadingIcon={<span>%</span>}
                      placeholder="Percentage"
                      onBlur={() => {
                        const amount =
                          (Number(data.Percentage) * totalEarnings) / 100;

                        onFieldChange(idx, 'Amount', roundNumber(amount));
                      }}
                    />
                    <InputWithTopHeader
                      className="mx-0 w-full"
                      value={data.Amount}
                      onChange={(e) =>
                        onFieldChange(idx, 'Amount', e.target.value)
                      }
                      decimalCount={2}
                      leadingIcon={<span>$</span>}
                      placeholder="Amount"
                      onBlur={() => {
                        const percentage =
                          (Number(data.Amount) / totalEarnings) * 100;

                        onFieldChange(
                          idx,
                          'Percentage',
                          roundNumber(percentage)
                        );
                      }}
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
        type="button"
        onClick={handleAddDeductionDetail}
        className="w-full border-2 border-dashed border-secondary rounded-full py-[10px] text-textPrimaryBlue font-semibold flex items-center justify-center gap-2"
      >
        <AiOutlinePlus /> Add New Deduction
      </button>
    </div>
  );
};

export default DeductionDetails;
