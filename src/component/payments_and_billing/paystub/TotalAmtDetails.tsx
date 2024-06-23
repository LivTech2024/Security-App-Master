import { useFormContext } from 'react-hook-form';
import { PayStubCreateFormFields } from '../../../utilities/zod/schema';
import InputWithTopHeader from '../../../common/inputs/InputWithTopHeader';

const TotalAmtDetails = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext<PayStubCreateFormFields>();
  return (
    <div className="flex flex-col gap-4 items-start bg-surface p-4 rounded shadow">
      <div className="font-semibold">Total Amount Details</div>
      <div className="flex items-center gap-4">
        <InputWithTopHeader
          label="Net Pay Current"
          className="mx-0"
          leadingIcon={<span>$</span>}
          register={register}
          name="PayStubNetPay.Amount"
          error={errors.PayStubNetPay?.Amount?.message}
        />
        <InputWithTopHeader
          label="Net Pay YTD"
          className="mx-0"
          leadingIcon={<span>$</span>}
          register={register}
          name="PayStubNetPay.YearToDateAmt"
          error={errors.PayStubNetPay?.YearToDateAmt?.message}
        />
      </div>
    </div>
  );
};

export default TotalAmtDetails;
