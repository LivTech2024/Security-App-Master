import PageHeader from '../../../common/PageHeader';
import Button from '../../../common/button/Button';
import { useAuthState } from '../../../store';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../../utilities/TsxUtils';

import { errorHandler } from '../../../utilities/CustomError';
import PayStubDetails from '../../../component/payments_and_billing/paystub/PayStubDetails';
import EmpDetails from '../../../component/payments_and_billing/paystub/EmpDetails';
import { FormProvider, useForm } from 'react-hook-form';
import {
  PayStubCreateFormFields,
  payStubCreateSchema,
} from '../../../utilities/zod/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import EarningDetails from '../../../component/payments_and_billing/paystub/EarningDetails';
import DeductionDetails from '../../../component/payments_and_billing/paystub/DeductionDetails';
import { useEffect, useState } from 'react';
import TotalAmtDetails from '../../../component/payments_and_billing/paystub/TotalAmtDetails';
import {
  IPayStubDeductionsChildCollection,
  IPayStubEarningsChildCollection,
  IPayStubsCollection,
} from '../../../@types/database';
import DbPayment from '../../../firebase_configs/DB/DbPayment';
import { useNavigate } from 'react-router-dom';
import { PageRoutes } from '../../../@types/enum';

export interface IEarningList
  extends Omit<
    IPayStubEarningsChildCollection,
    'CurrentAmount' | 'YTDAmount' | 'Rate' | 'Quantity'
  > {
  CurrentAmount: string;
  YTDAmount: string;
  Rate?: string;
  Quantity?: string;
}

export interface IDeductionList
  extends Omit<
    IPayStubDeductionsChildCollection,
    'Amount' | 'YearToDateAmt' | 'Percentage'
  > {
  Amount: string;
  YearToDateAmt: string;
  Percentage: string;
}

const PayStubGenerate = () => {
  const methods = useForm<PayStubCreateFormFields>({
    resolver: zodResolver(payStubCreateSchema),
  });

  const navigate = useNavigate();

  const { company } = useAuthState();

  const [earningsList, setEarningsList] = useState<IEarningList[]>([
    {
      Income: 'Regular',
      Type: 'Hourly',
      CurrentAmount: '',
      YTDAmount: '',
    },
  ]);

  const [deductionsList, setDeductionsList] = useState<IDeductionList[]>([
    {
      Deduction: 'CPP',
      Amount: '',
      YearToDateAmt: '',
      Percentage: '',
    },
  ]);

  const totalEarnings = earningsList.reduce((acc, obj) => {
    const amount =
      Number(obj.CurrentAmount) ||
      Number(obj.Rate ?? 0) * Number(obj.Quantity ?? 0);

    if (obj.Income === 'Banked') {
      return acc - amount;
    }

    return acc + amount;
  }, 0);

  useEffect(() => {
    const totalEarnings = earningsList.reduce((acc, obj) => {
      const amount =
        Number(obj.CurrentAmount) ||
        Number(obj.Rate ?? 0) * Number(obj.Quantity ?? 0);

      if (obj.Income === 'Banked') {
        return acc - amount;
      }

      return acc + amount;
    }, 0);
    const totalDeductions = deductionsList.reduce(
      (acc, obj) => acc + Number(obj.Amount),
      0
    );
    methods.setValue('PayStubNetPay.Amount', totalEarnings - totalDeductions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deductionsList, earningsList]);

  const [previousPayStub, setPreviousPayStub] =
    useState<IPayStubsCollection | null>(null);

  const netPayCurrent = Number(methods.watch('PayStubNetPay.Amount'));

  useEffect(() => {
    const prevYtdAmt = previousPayStub?.PayStubNetPay?.YearToDateAmt || 0;
    methods.setValue(
      'PayStubNetPay.YearToDateAmt',
      Number(netPayCurrent + prevYtdAmt)
    );
  }, [previousPayStub, netPayCurrent]);

  const onSubmit = async (data: PayStubCreateFormFields) => {
    if (!company) return;

    try {
      showModalLoader({});

      await DbPayment.createPayStub({
        cmpId: company.CompanyId,
        data,
        deductionsList,
        earningsList,
      });

      showSnackbar({
        message: 'PayStub created successfully',
        type: 'success',
      });

      closeModalLoader();

      navigate(PageRoutes.PAY_STUB_LIST);
    } catch (error) {
      console.log(error);
      errorHandler(error);
      closeModalLoader();
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="flex flex-col w-full h-full p-6 gap-6 text-center"
      >
        <PageHeader
          title="Create new paystub"
          rightSection={
            <Button
              label="Save"
              onClick={methods.handleSubmit(onSubmit)}
              type="black"
            />
          }
        />
        <div className="flex flex-col gap-4 w-full h-full">
          <div className="flex  gap-4 w-full h-full">
            <PayStubDetails />
            <EmpDetails
              setEarningsList={setEarningsList}
              setPreviousPayStub={setPreviousPayStub}
            />
          </div>

          {/* Earnings and deduction details */}
          <div className="flex flex-col gap-4 w-full h-full">
            <EarningDetails
              earningsList={earningsList}
              setEarningsList={setEarningsList}
              previousPayStub={previousPayStub}
            />
            <DeductionDetails
              deductionsList={deductionsList}
              setDeductionsList={setDeductionsList}
              totalEarnings={totalEarnings}
              previousPayStub={previousPayStub}
            />
          </div>

          <TotalAmtDetails />
        </div>
      </form>
    </FormProvider>
  );
};

export default PayStubGenerate;
