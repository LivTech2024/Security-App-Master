import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import {
  AdminUpdateFormFields,
  adminUpdateSchema,
} from "../../utilities/zod/schema";
import { useAuthState } from "../../store";
import Button from "../../common/button/Button";
import InputWithTopHeader from "../../common/inputs/InputWithTopHeader";
import DbCompany from "../../firebase_configs/DB/DbCompany";
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from "../../utilities/TsxUtils";
import { errorHandler } from "../../utilities/CustomError";

const AdminInfo = () => {
  const { admin, setAdmin } = useAuthState();

  const methods = useForm<AdminUpdateFormFields>({
    resolver: zodResolver(adminUpdateSchema),
    defaultValues: {
      AdminName: admin?.AdminName,
      AdminEmail: admin?.AdminEmail,
      AdminPhone: admin?.AdminPhone,
    },
  });

  const onSubmit = async (data: AdminUpdateFormFields) => {
    if (!admin) return;
    try {
      showModalLoader({});

      await DbCompany.updateAdmin(admin.AdminId, data);

      showSnackbar({
        message: "Admin updated successfully",
        type: "success",
      });

      setAdmin({
        ...admin,
        AdminName: data.AdminName,
        AdminPhone: data.AdminPhone,
        AdminEmail: data.AdminEmail,
      });

      closeModalLoader();
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
        className="flex flex-col gap-4 p-4 bg-surface shadow mt-4 rounded"
      >
        <div className="flex items-center justify-between w-full">
          <div className="font-semibold text-lg">Admin Information</div>
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
            label="Admin Name"
            register={methods.register}
            name="AdminName"
            error={methods.formState.errors.AdminName?.message}
          />
          <InputWithTopHeader
            className="mx-0"
            label="Admin Phone"
            register={methods.register}
            name="AdminPhone"
            error={methods.formState.errors.AdminPhone?.message}
          />
          <InputWithTopHeader
            className="mx-0"
            label="Admin Email"
            register={methods.register}
            name="AdminEmail"
            error={methods.formState.errors.AdminEmail?.message}
          />
        </div>
      </form>
    </FormProvider>
  );
};

export default AdminInfo;
