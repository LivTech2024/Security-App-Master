import React, { useEffect, useState } from "react";
import Dialog from "../../../common/Dialog";
import InputWithTopHeader from "../../../common/inputs/InputWithTopHeader";
import { z } from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import "react-toastify/dist/ReactToastify.css";
import DbEmployee from "../../../firebase_configs/DB/DbEmployee";
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from "../../../utilities/TsxUtils";
import { errorHandler } from "../../../utilities/CustomError";
import { REACT_QUERY_KEYS } from "../../../@types/enum";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthState, useEditFormStore } from "../../../store";
import { openContextModal } from "@mantine/modals";
import ImageUpload from "../EmpOtherDetailsInput";
import InputAutoComplete from "../../../common/inputs/InputAutocomplete";
import { AiOutlinePlus } from "react-icons/ai";
import AddEmpRoleModal from "./AddEmpRoleModal";
import InputError from "../../../common/inputs/InputError";

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
  role: z.string().min(1, { message: "Employee role is required" }),
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

  const { company, empRoles } = useAuthState();

  const [employeeRole, setEmployeeRole] = useState<string | null | undefined>(
    ""
  );

  const [addEmpRoleModal, setAddEmpRoleModal] = useState(false);

  const isEdit = !!employeeEditData;

  const queryClient = useQueryClient();

  useEffect(() => {
    methods.setValue("role", employeeRole || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeRole]);

  useEffect(() => {
    let allFieldValues: AddEmployeeFormField = {
      first_name: "",
      last_name: "",
      phone_number: "",
      email: "",
      role: "",
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
    if (!company) return;
    try {
      showModalLoader({});

      if (isEdit) {
        await DbEmployee.updateEmployee(
          data,
          empImageBase64,
          employeeEditData.EmployeeId,
          company.CompanyId
        );
      } else {
        await DbEmployee.addEmployee(data, empImageBase64, company.CompanyId);
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
    <>
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
                <div className="flex flex-col gap-1">
                  <InputAutoComplete
                    label="Role"
                    value={employeeRole}
                    onChange={setEmployeeRole}
                    isFilterReq={true}
                    data={empRoles.map((role) => {
                      return {
                        label: role.EmployeeRoleName,
                        value: role.EmployeeRoleName,
                      };
                    })}
                    dropDownHeader={
                      <div
                        onClick={() => setAddEmpRoleModal(true)}
                        className="bg-primaryGold text-surface font-medium p-2 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <AiOutlinePlus size={18} />
                          <span>Add employee roles</span>
                        </div>
                      </div>
                    }
                  />
                  {methods.formState.errors.role?.message && (
                    <InputError
                      errorMessage={methods.formState.errors.role.message}
                    />
                  )}
                </div>
              </div>
            </div>
          </form>
        </FormProvider>
      </Dialog>
      <AddEmpRoleModal
        opened={addEmpRoleModal}
        setOpened={setAddEmpRoleModal}
      />
    </>
  );
};

export default AddEmployeeModal;
