import React, { useEffect, useState } from "react";
import Dialog from "../../../common/Dialog";
import InputWithTopHeader from "../../../common/inputs/InputWithTopHeader";
import InputSelect from "../../../common/inputs/InputSelect";
import { z } from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useEditFormStore } from "../../../store";
import { openContextModal } from "@mantine/modals";
import ImageUpload from "../EmpOtherDetailsInput";

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
  password: z.string().min(6, { message: "Min 6 character is required" }),
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

  const { employeeEditData } = useEditFormStore();

  const isEdit = !!employeeEditData;

  const queryClient = useQueryClient();

  useEffect(() => {
    let allFieldValues: AddEmployeeFormField = {
      first_name: "",
      last_name: "",
      phone_number: "",
      email: "",
      role: EmployeeRoles.supervisor,
      password: "",
    };
    if (isEdit) {
      allFieldValues = {
        first_name: employeeEditData.EmployeeName.split(" ")[0],
        last_name: employeeEditData.EmployeeName.split(" ")[1],
        phone_number: employeeEditData.EmployeePhone,
        email: employeeEditData.EmployeeEmail,
        role: employeeEditData.EmployeeRole,
        password: employeeEditData.EmployeePassword,
      };
      setEmpImageBase64(employeeEditData.EmployeeImg);
    } else {
      setEmpImageBase64(null);
    }

    methods.reset(allFieldValues);
  }, [isEdit, employeeEditData, methods, opened]);

  const [empImageBase64, setEmpImageBase64] = useState<string | null>(null);

  const onSubmit = async (data: AddEmployeeFormField) => {
    if (!empImageBase64) {
      showSnackbar({ message: "Please add employee image", type: "error" });
      return;
    }
    try {
      showModalLoader({});

      if (isEdit) {
        await DbEmployee.updateEmployee(
          data,
          empImageBase64,
          employeeEditData.EmployeeId
        );
      } else {
        await DbEmployee.addEmployee(data, empImageBase64);
      }

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
      console.log(error);
      closeModalLoader();
      errorHandler(error);
    }
  };

  const onDelete = async () => {
    if (!isEdit) return;
    try {
      showModalLoader({});

      await DbEmployee.deleteEmployee(employeeEditData.EmployeeId);

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.EMPLOYEE_LIST],
      });

      showSnackbar({
        message: "Employee deleted successfully",
        type: "success",
      });

      closeModalLoader();
      methods.reset();
      setOpened(false);
    } catch (error) {
      console.log(error);
      closeModalLoader();
      errorHandler(error);
    }
  };

  return (
    <Dialog
      opened={opened}
      setOpened={setOpened}
      title="Add Employee"
      size="80%"
      isFormModal
      positiveCallback={methods.handleSubmit(onSubmit)}
      negativeCallback={() =>
        isEdit
          ? openContextModal({
              modal: "confirmModal",
              withCloseButton: false,
              centered: true,
              closeOnClickOutside: true,
              innerProps: {
                title: "Confirm",
                body: "Are you sure to delete this employee",
                onConfirm: () => {
                  onDelete();
                },
                onCancel: () => {
                  setOpened(true);
                },
              },
              size: "30%",
              styles: {
                body: { padding: "0px" },
              },
            })
          : setOpened(false)
      }
      negativeLabel={isEdit ? "Delete" : "Cancel"}
      positiveLabel={isEdit ? "Update" : "Save"}
    >
      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-4">
              <ImageUpload
                empImageBase64={empImageBase64}
                setEmpImageBase64={setEmpImageBase64}
              />
            </div>
            <div className="flex flex-col gap-4">
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
              <InputWithTopHeader
                className="mx-0"
                label="Password"
                register={methods.register}
                name="password"
                error={methods.formState.errors.password?.message}
                inputType="password"
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
          </div>
        </form>
      </FormProvider>
    </Dialog>
  );
};

export default AddEmployeeModal;
