import React from "react";
import Dialog from "../../../common/Dialog";
import InputWithTopHeader from "../../../common/inputs/InputWithTopHeader";
import InputSelect from "../../../common/inputs/InputSelect";
import { z } from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { EmployeeRoles } from "../../../@types/database";
import DbEmployee from "../../../firebase_configs/DB/DbEmployee";
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from "../../../utilities/TsxUtils";
import { errorHandler } from "../../../utilities/CustomError";
import { REACT_QUERY_KEYS } from "../../../@types/enum";
import { useQueryClient } from "@tanstack/react-query";

const addEmployeeFormSchema = z.object({
  first_name: z.string().min(2, { message: "First name is required" }),
  last_name: z.string().min(2, { message: "Last name is required" }),
  phone_number: z.string().min(10, { message: "Phone number is required" }),
  email: z
    .string()
    .min(3, { message: "Email is required" })
    .regex(/^(^[\w%+.-]+@[\d.A-Za-z-]+\.[A-Za-z]{2,}$)?$/, {
      message: "Invalid email",
    }),
  role: z.enum([
    EmployeeRoles.guard,
    EmployeeRoles.other,
    EmployeeRoles.supervisor,
  ]),
});

export type AddEmployeeFormField = z.infer<typeof addEmployeeFormSchema>;

const AddEmployeeModal = ({
  opened,
  setOpened,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const methods = useForm<AddEmployeeFormField>({
    resolver: zodResolver(addEmployeeFormSchema),
  });

  const queryClient = useQueryClient();

  const onSubmit = async (data: AddEmployeeFormField) => {
    try {
      showModalLoader({});
      await DbEmployee.addEmployee(data);

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.EMPLOYEE_LIST],
      });

      closeModalLoader();
      setOpened(false);
      showSnackbar({
        message: "Employee created successfully",
        type: "success",
      });
      methods.reset();
    } catch (error) {
      closeModalLoader();
      errorHandler(error);
    }
  };

  return (
    <>
      <Dialog
        opened={opened}
        setOpened={setOpened}
        title="Add Employee"
        size="80%"
        isFormModal
        positiveCallback={methods.handleSubmit(onSubmit)}
      >
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <InputWithTopHeader
                className="mx-0"
                label="First Name"
                register={methods.register}
                name="first_name"
                error={methods.formState.errors.first_name?.message}
              />
              <InputWithTopHeader
                className="mx-0"
                label="Last Name"
                register={methods.register}
                name="last_name"
                error={methods.formState.errors.last_name?.message}
              />
              <InputWithTopHeader
                className="mx-0"
                label="Phone Number"
                register={methods.register}
                name="phone_number"
                error={methods.formState.errors.phone_number?.message}
              />
              <InputWithTopHeader
                className="mx-0"
                label="Email"
                register={methods.register}
                name="email"
                error={methods.formState.errors.email?.message}
              />
              <InputSelect
                label="Select Role"
                options={[
                  { title: "Supervisor", value: "supervisor" },
                  { title: "Guard", value: "guard" },
                  { title: "Other", value: "other" },
                ]}
                register={methods.register}
                name="role"
                error={methods.formState.errors.role?.message}
              />
            </div>
          </form>
        </FormProvider>
      </Dialog>
      <ToastContainer />
    </>
  );
};

export default AddEmployeeModal;
