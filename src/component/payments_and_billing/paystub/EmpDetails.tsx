import { useEffect, useState } from 'react';
import InputSelect from '../../../common/inputs/InputSelect';
import useFetchEmployees from '../../../hooks/fetch/useFetchEmployees';
import { useFormContext } from 'react-hook-form';
import { PayStubCreateFormFields } from '../../../utilities/zod/schema';
import Button from '../../../common/button/Button';
import CustomError, { errorHandler } from '../../../utilities/CustomError';
import { closeModalLoader, showModalLoader } from '../../../utilities/TsxUtils';
import DbPayment from '../../../firebase_configs/DB/DbPayment';
import {
  IDeductionList,
  IEarningList,
} from '../../../pages/payments_and_billing/paystub/PayStubGenerate';
import { IPayStubsCollection } from '../../../@types/database';

const EmpDetails = ({
  setEarningsList,
  setDeductionsList,
  setPreviousPayStub,
}: {
  setEarningsList: React.Dispatch<React.SetStateAction<IEarningList[]>>;
  setDeductionsList: React.Dispatch<React.SetStateAction<IDeductionList[]>>;
  setPreviousPayStub: React.Dispatch<
    React.SetStateAction<IPayStubsCollection | null>
  >;
}) => {
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
    const selectedEmp = employees.find(
      (emp) => emp.EmployeeName === empSearchQuery
    );

    if (selectedEmp) {
      setValue('PayStubEmpId', selectedEmp.EmployeeId);
      setValue('PayStubEmpName', selectedEmp.EmployeeName);
      setValue('PayStubEmpRole', selectedEmp.EmployeeRole);
    } else {
      setValue('PayStubEmpId', '');
      setValue('PayStubEmpName', '');
      setValue('PayStubEmpRole', '');
    }
  }, [empSearchQuery]);

  const [payStartDate, payEndDate, empId] = watch([
    'PayStubPayPeriodStartDate',
    'PayStubPayPeriodEndDate',
    'PayStubEmpId',
  ]);

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

      const empEarningDetails = await DbPayment.getEmpEarning({
        empId,
        startDate: payStartDate,
        endDate: payEndDate,
      });

      //const prevPayStubSnapshot = await DbPayment.get

      setEarningsList([
        {
          Income: 'Regular',
          CurrentAmount: String(
            empEarningDetails.Rate * empEarningDetails.Quantity
          ),
          Quantity: String(empEarningDetails.Quantity),
          Type: 'Hourly',
          Rate: String(empEarningDetails.Rate),
          YTDAmount: String(
            empEarningDetails.Rate * empEarningDetails.Quantity
          ),
        },
      ]);

      setPreviousPayStub(null);

      setDeductionsList([
        {
          Amount: '500',
          Deduction: 'CPP',
          YearToDateAmt: '600',
          Percentage: '5',
        },
      ]);

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
            return { label: res.EmployeeName, value: res.EmployeeName };
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
        onClick={generateEarningAndDeductionDetails}
        className="w-full"
        buttonType="button"
      />
    </div>
  );
};

export default EmpDetails;
