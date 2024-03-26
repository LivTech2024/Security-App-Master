import { FormProvider, useForm } from "react-hook-form";
import {
  CompanyCreateFormFields,
  companyCreateSchema,
} from "../../utilities/zod/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import InputWithTopHeader from "../../common/inputs/InputWithTopHeader";
import TextareaWithTopHeader from "../../common/inputs/TextareaWithTopHeader";
import Button from "../../common/button/Button";
import { useAuthState } from "../../store";

const CompanyInfo = () => {
  const { company } = useAuthState();

  const methods = useForm<CompanyCreateFormFields>({
    resolver: zodResolver(companyCreateSchema),
    defaultValues: {
      CompanyName: company?.CompanyName,
      CompanyAddress: company?.CompanyAddress,
      CompanyEmail: company?.CompanyEmail,
      CompanyPhone: company?.CompanyPhone,
    },
  });

  const onSubmit = async (data: CompanyCreateFormFields) => {
    console.log(data);
  };
  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="flex flex-col gap-4 p-4 bg-surface shadow mt-4 rounded"
      >
        <div className="flex items-center justify-between w-full">
          <div className="font-semibold text-lg">Company Information</div>
          <Button
            label="Save"
            type="black"
            buttonType="submit"
            onClick={methods.handleSubmit(onSubmit)}
            className="px-6 py-2"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <InputWithTopHeader
            className="mx-0"
            label="Company Name"
            register={methods.register}
            name="CompanyName"
            error={methods.formState.errors.CompanyName?.message}
          />
          <InputWithTopHeader
            className="mx-0"
            label="Company Email"
            register={methods.register}
            name="CompanyEmail"
            error={methods.formState.errors.CompanyEmail?.message}
          />
          <InputWithTopHeader
            className="mx-0"
            label="Company Phone"
            register={methods.register}
            name="CompanyPhone"
            error={methods.formState.errors.CompanyPhone?.message}
          />
          <TextareaWithTopHeader
            className="mx-0 cols"
            title="Company Address"
            register={methods.register}
            name="CompanyAddress"
            error={methods.formState.errors.CompanyAddress?.message}
          />
        </div>
      </form>
    </FormProvider>
  );
};

export default CompanyInfo;
