import { useFormContext } from 'react-hook-form';
import { AddEmployeeFormField } from '../../utilities/zod/schema';
import TextareaWithTopHeader from '../../common/inputs/TextareaWithTopHeader';
import InputWithTopHeader from '../../common/inputs/InputWithTopHeader';

const EmpAddressDetails = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext<AddEmployeeFormField>();
  return (
    <div className="grid grid-cols-2 gap-4">
      <TextareaWithTopHeader
        className="mx-0 col-span-2"
        title="Address"
        register={register}
        name="EmployeeAddress"
        error={errors?.EmployeeAddress?.message}
      />
      <InputWithTopHeader
        className="mx-0"
        label="Postal Code"
        register={register}
        name="EmployeePostalCode"
        error={errors?.EmployeePostalCode?.message}
      />
      <InputWithTopHeader
        className="mx-0"
        label="City"
        register={register}
        name="EmployeeCity"
        error={errors?.EmployeeCity?.message}
      />
      <InputWithTopHeader
        className="mx-0"
        label="Province"
        register={register}
        name="EmployeeProvince"
        error={errors?.EmployeeProvince?.message}
      />
    </div>
  );
};

export default EmpAddressDetails;
