import React, { useState } from "react";
import Dialog from "../../../common/Dialog";
import InputWithTopHeader from "../../../common/inputs/InputWithTopHeader";
import InputSelect from "../../../common/inputs/InputSelect";
import { z } from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  role: z.enum(["supervisor", "guard", "admin", "other"]),
});

export type AddEmployeeFormField = z.infer<typeof addEmployeeFormSchema>;

const AddEmployeeModal = ({
  opened,
  setOpened,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [formData, setFormData] = useState<AddEmployeeFormField>({
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
    role: "supervisor",
  });

  const methods = useForm<AddEmployeeFormField>({
    resolver: zodResolver(addEmployeeFormSchema),
    defaultValues: formData,
  });

  const onSubmit = async (data: AddEmployeeFormField) => {
    try {
      const res = await fetch("/api/user/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const responseData = await res.json();
      if (!res.ok) {
        console.log(responseData.message);
        return;
      }
      if (res.ok) {
        setFormData({
          first_name: "",
          last_name: "",
          phone_number: "",
          email: "",
          role: "supervisor",
        });
        setOpened(false);
        toast.success("User created successfully");
      }
    } catch (error) {
      toast.error("Something went wrong!");
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
                value={formData.first_name}
                error={methods.formState.errors.first_name?.message}
              />
              <InputWithTopHeader
                className="mx-0"
                label="Last Name"
                register={methods.register}
                name="last_name"
                value={formData.last_name}
                error={methods.formState.errors.last_name?.message}
              />
              <InputWithTopHeader
                className="mx-0"
                label="Phone Number"
                register={methods.register}
                name="phone_number"
                value={formData.phone_number}
                error={methods.formState.errors.phone_number?.message}
                leadingIcon={<div>+91</div>}
              />
              <InputWithTopHeader
                className="mx-0"
                label="Email"
                register={methods.register}
                name="email"
                value={formData.email}
                error={methods.formState.errors.email?.message}
              />
              <InputSelect
                label="Select Role"
                options={[
                  { title: "Supervisor", value: "supervisor" },
                  { title: "Guard", value: "guard" },
                  { title: "Admin", value: "admin" },
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
