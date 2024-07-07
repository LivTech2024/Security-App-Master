import PageHeader from '../../../common/PageHeader';
import Button from '../../../common/button/Button';
import { useAuthState, useEditFormStore } from '../../../store';
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
import { openContextModal } from '@mantine/modals';

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
  const { payStubEditData } = useEditFormStore();

  const isEdit = !!payStubEditData;

  const methods = useForm<PayStubCreateFormFields>({
    resolver: zodResolver(payStubCreateSchema),
    defaultValues: isEdit
      ? {
          PayStubRefNumber: payStubEditData.PayStubRefNumber,
          PayStubNetPay: payStubEditData.PayStubNetPay,
        }
      : {},
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

  const [deductionsList, setDeductionsList] = useState<IDeductionList[]>([]);

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

  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: PayStubCreateFormFields) => {
    if (!company) return;

    try {
      setLoading(true);

      if (isEdit) {
        await DbPayment.updatePayStub({
          payStubId: payStubEditData.PayStubId,
          data,
          deductionsList,
          earningsList,
        });

        showSnackbar({
          message: 'PayStub updated successfully',
          type: 'success',
        });
      } else {
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
      }

      setLoading(false);

      navigate(PageRoutes.PAY_STUB_LIST);
    } catch (error) {
      console.log(error);
      setLoading(false);
      errorHandler(error);
    }
  };

  const onDelete = async () => {
    if (!isEdit) return;
    try {
      setLoading(true);

      await DbPayment.deletePayStub(payStubEditData.PayStubId);

      showSnackbar({
        message: 'PayStub deleted successfully',
        type: 'success',
      });

      setLoading(false);

      navigate(PageRoutes.PAY_STUB_LIST);
    } catch (error) {
      console.log(error);
      setLoading(false);
      errorHandler(error);
    }
  };

  useEffect(() => {
    if (loading) {
      showModalLoader({});
    } else {
      closeModalLoader();
    }
    return () => closeModalLoader();
  }, [loading]);

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="flex flex-col w-full h-full p-6 gap-6 text-center"
      >
        <PageHeader
          title="Create new paystub"
          rightSection={
            <div className="flex items-center gap-4">
              {isEdit && (
                <Button
                  label="Delete"
                  type="white"
                  onClick={() =>
                    openContextModal({
                      modal: 'confirmModal',
                      withCloseButton: false,
                      centered: true,
                      closeOnClickOutside: true,
                      innerProps: {
                        title: 'Confirm',
                        body: 'Are you sure to delete this pay stub',
                        onConfirm: () => {
                          onDelete();
                        },
                      },
                      size: '30%',
                      styles: {
                        body: { padding: '0px' },
                      },
                    })
                  }
                />
              )}
              <Button
                label="Save"
                onClick={methods.handleSubmit(onSubmit)}
                type="black"
              />
            </div>
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
