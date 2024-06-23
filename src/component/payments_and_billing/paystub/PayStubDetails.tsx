import { useFormContext } from 'react-hook-form';
import InputDate from '../../../common/inputs/InputDate';
import InputWithTopHeader from '../../../common/inputs/InputWithTopHeader';
import { PayStubCreateFormFields } from '../../../utilities/zod/schema';
import { useEffect, useState } from 'react';
import { removeTimeFromDate } from '../../../utilities/misc';

const PayStubDetails = () => {
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext<PayStubCreateFormFields>();

  const [startDate, setStartDate] = useState<Date | null>(null);

  const [endDate, setEndDate] = useState<Date | null>(null);

  const [payDate, setPayDate] = useState<Date | null>(null);

  useEffect(() => {
    if (startDate) {
      setValue('PayStubPayPeriodStartDate', removeTimeFromDate(startDate));
    }
  }, [startDate]);

  useEffect(() => {
    if (endDate) {
      setValue('PayStubPayPeriodEndDate', removeTimeFromDate(endDate));
    }
  }, [endDate]);

  useEffect(() => {
    if (payDate) {
      setValue('PayStubPayDate', removeTimeFromDate(payDate));
    }
  }, [payDate]);

  return (
    <div className="flex flex-col gap-4 bg-surface shadow rounded p-4 items-start  h-full w-2/3">
      <div className="font-semibold">Pay Stub Details</div>
      <div className="flex items-center gap-4 w-full">
        <InputDate
          label="Pay period start date"
          value={startDate}
          setValue={setStartDate}
          error={errors.PayStubPayPeriodStartDate?.message}
        />
        <InputDate
          label="Pay period start date"
          value={endDate}
          setValue={setEndDate}
          error={errors.PayStubPayPeriodEndDate?.message}
        />
      </div>
      <div className="flex items-center gap-4 w-full">
        <InputDate
          label="Pay Date"
          value={payDate}
          setValue={setPayDate}
          error={errors.PayStubPayDate?.message}
        />
        <InputWithTopHeader
          label="Reference No."
          className="mx-0 w-full"
          register={register}
          name="PayStubRefNumber"
          error={errors.PayStubRefNumber?.message}
        />
      </div>
    </div>
  );
};

export default PayStubDetails;
