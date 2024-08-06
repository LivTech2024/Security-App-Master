import { useEffect, useState } from 'react';
import InputSelect from '../../../common/inputs/InputSelect';
import useFetchEmployees from '../../../hooks/fetch/useFetchEmployees';
import { useFormContext } from 'react-hook-form';
import { PayStubCreateFormFields } from '../../../utilities/zod/schema';
import Button from '../../../common/button/Button';
import CustomError, { errorHandler } from '../../../utilities/CustomError';
import { closeModalLoader, showModalLoader } from '../../../utilities/TsxUtils';
import DbPayment from '../../../firebase_configs/DB/DbPayment';
import { IEarningList } from '../../../pages/payments_and_billing/paystub/PayStubGenerate';
import { IPayStubsCollection } from '../../../@types/database';
import { roundNumber } from '../../../utilities/misc';
import { openContextModal } from '@mantine/modals';
import { useAuthState, useEditFormStore } from '../../../store';

const EmpDetails = ({
  setEarningsList,
  setPreviousPayStub,
}: {
  setEarningsList: React.Dispatch<React.SetStateAction<IEarningList[]>>;
  setPreviousPayStub: React.Dispatch<
    React.SetStateAction<IPayStubsCollection | null>
  >;
}) => {
  const { settings } = useAuthState();

  const { payStubEditData } = useEditFormStore();

  const isEdit = !!payStubEditData;

  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<PayStubCreateFormFields>();

  const [empSearchQuery, setEmpSearchQuery] = useState('');

  const { data: employees } = useFetchEmployees({
    limit: 5,
    searchQuery: empSearchQuery,
  });

  const selectedEmpRole = watch('PayStubEmpRole');

  useEffect(() => {
    if (isEdit) {
      setEmpSearchQuery(payStubEditData.PayStubEmpName);
    }
  }, [isEdit]);

  useEffect(() => {
    const selectedEmp = employees.find(
      (emp) => emp.EmployeeName === empSearchQuery
    );

    if (selectedEmp) {
      setValue('PayStubEmpId', selectedEmp?.EmployeeId);
      setValue('PayStubEmpName', selectedEmp?.EmployeeName);
      setValue('PayStubEmpRole', selectedEmp?.EmployeeRole);
      setValue(
        'PayStubCompanyBranchId',
        selectedEmp?.EmployeeCompanyBranchId || null
      );
    } else {
      setValue('PayStubEmpId', isEdit ? payStubEditData.PayStubEmpId : '');
      setValue('PayStubEmpName', isEdit ? payStubEditData.PayStubEmpName : '');
      setValue('PayStubEmpRole', isEdit ? payStubEditData.PayStubEmpRole : '');
      setValue(
        'PayStubCompanyBranchId',
        isEdit ? payStubEditData?.PayStubCompanyBranchId || null : null
      );
    }
  }, [empSearchQuery, isEdit]);

  const [payStartDate, payEndDate, empId] = watch([
    'PayStubPayPeriodStartDate',
    'PayStubPayPeriodEndDate',
    'PayStubEmpId',
  ]);

  const handleGenerateClick = async () => {
    try {
      if (!payStartDate) {
        throw new CustomError('Please enter pay period start date');
      }
      if (!payEndDate) {
        throw new CustomError('Please enter pay period end date');
      }
      if (!empId) {
        throw new CustomError('Please select employee');
      }
      showModalLoader({});

      const isPayStubExistForThisPayPeriod =
        await DbPayment.isPayStubExistForPayPeriod(
          empId,
          payStartDate,
          payEndDate
        );

      if (isPayStubExistForThisPayPeriod) {
        openContextModal({
          modal: 'confirmModal',
          withCloseButton: false,
          centered: true,
          closeOnClickOutside: true,
          innerProps: {
            title: 'Confirm',
            body: 'Paystub for this pay period already exist for this employee, are you sure to generate new paystub',
            onConfirm: () => {
              generateEarningAndDeductionDetails();
            },
          },
          size: '30%',
          styles: {
            body: { padding: '0px' },
          },
        });
      } else {
        await generateEarningAndDeductionDetails();
      }

      closeModalLoader();
    } catch (error) {
      errorHandler(error);
      closeModalLoader();
      console.log(error);
    }
  };

  const generateEarningAndDeductionDetails = async () => {
    try {
      if (!payStartDate) {
        throw new CustomError('Please enter pay period start date');
      }
      if (!payEndDate) {
        throw new CustomError('Please enter pay period end date');
      }
      if (!empId) {
        throw new CustomError('Please select employee');
      }
      showModalLoader({});

      const { empEarningDetails, vacationPay } = await DbPayment.getEmpEarning({
        empId,
        startDate: payStartDate,
        endDate: payEndDate,
        shiftTimeMargin: settings?.SettingEmpShiftTimeMarginInMins || 0,
      });

      const prevPayStub = await DbPayment.getPrevPayStub(empId, payStartDate);

      setPreviousPayStub(prevPayStub);

      const prevYtdAmt =
        prevPayStub?.PayStubEarnings?.find((e) => e?.Income === 'Regular')
          ?.YTDAmount || 0;

      setEarningsList([
        {
          Income: 'Regular',
          CurrentAmount: String(
            roundNumber(empEarningDetails.Rate * empEarningDetails.Quantity)
          ),
          Quantity: String(roundNumber(empEarningDetails.Quantity)),
          Type: 'Hourly',
          Rate: String(roundNumber(empEarningDetails.Rate)),
          YTDAmount: String(
            roundNumber(
              prevYtdAmt + empEarningDetails.Rate * empEarningDetails.Quantity
            )
          ),
        },
      ]);

      if (vacationPay) {
        setEarningsList((prev) => [
          ...prev,
          {
            CurrentAmount: String(vacationPay || 0),
            Type: 'Fixed',
            Income: 'Vacation',
            YTDAmount: '0',
          },
        ]);
      }

      closeModalLoader();
    } catch (error) {
      errorHandler(error);
      closeModalLoader();
      console.log(error);
    }
  };

  return (
    <div className="flex flex-col gap-4 bg-surface shadow rounded p-4 items-start w-1/3 min-h-full justify-between">
      <div className="flex flex-col gap-4 items-start w-full">
        <div className="font-semibold">Employee Details</div>

        <InputSelect
          label="Select employee"
          data={employees.map((res) => {
            return { label: res.EmployeeName, value: res.EmployeeId };
          })}
          searchValue={empSearchQuery}
          onSearchChange={setEmpSearchQuery}
          searchable
          className="w-full"
          error={errors.PayStubEmpId?.message}
        />

        {selectedEmpRole && (
          <div className="flex items-center gap-2">
            <span>Role:</span>
            <span className="font-medium">{selectedEmpRole}</span>
          </div>
        )}
      </div>
      <Button
        label="Generate earning and deduction details"
        type="black"
        onClick={handleGenerateClick}
        className="w-full"
        buttonType="button"
      />
    </div>
  );
};

export default EmpDetails;
