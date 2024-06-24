import PageHeader from '../../../common/PageHeader';
import Button from '../../../common/button/Button';
import { useAuthState } from '../../../store';
import { closeModalLoader } from '../../../utilities/TsxUtils';

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
import { useState } from 'react';
import TotalAmtDetails from '../../../component/payments_and_billing/paystub/TotalAmtDetails';
import {
  IPayStubDeductionsChildCollection,
  IPayStubEarningsChildCollection,
} from '../../../@types/database';

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

  const onSubmit = async (data: PayStubCreateFormFields) => {
    if (!company) return;

    console.log(data);

    /* const html = getPaystubHtml({
      companyDetails: company,
      empHourlyRate: employee.EmployeePayRate,
      empName: employee.EmployeeName,
      empWorkedHours: 25,
      endDate: dayjs(endDate).format('MMMM DD,YYYY'),
      startDate: dayjs(startDate).format('MMMM DD,YYYY'),
    }); */

    try {
      /* showModalLoader({});

      const fileName = `${employee.EmployeeName}_paystub.pdf`;

      const response = await htmlToPdf({ html, file_name: fileName });

      downloadPdf(response, fileName);

      closeModalLoader(); */
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
              setDeductionsList={setDeductionsList}
            />
          </div>

          {/* Earnings and deduction details */}
          <div className="flex flex-col gap-4 w-full h-full">
            <EarningDetails
              earningsList={earningsList}
              setEarningsList={setEarningsList}
            />
            <DeductionDetails
              deductionsList={deductionsList}
              setDeductionsList={setDeductionsList}
              earningsList={earningsList}
            />
          </div>

          <TotalAmtDetails />
        </div>
      </form>
    </FormProvider>
  );
};

export default PayStubGenerate;
