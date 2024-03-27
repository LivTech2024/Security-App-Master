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
import { ChangeEvent, useState } from "react";
import { errorHandler } from "../../utilities/CustomError";
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from "../../utilities/TsxUtils";
import DbCompany from "../../firebase_configs/DB/DbCompany";

const CompanyInfo = () => {
  const { company, setCompany } = useAuthState();

  const methods = useForm<CompanyCreateFormFields>({
    resolver: zodResolver(companyCreateSchema),
    defaultValues: {
      CompanyName: company?.CompanyName,
      CompanyAddress: company?.CompanyAddress,
      CompanyEmail: company?.CompanyEmail,
      CompanyPhone: company?.CompanyPhone,
    },
  });

  const [logoImgBase64, setLogoImgBase64] = useState(company?.CompanyLogo);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoImgBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: CompanyCreateFormFields) => {
    if (!company || !logoImgBase64) return;
    try {
      showModalLoader({});

      await DbCompany.updateCompany({
        cmpId: company?.CompanyId,
        data,
        logoBase64: logoImgBase64,
      });

      showSnackbar({
        message: "Company updated successfully",
        type: "success",
      });

      setCompany({
        ...company,
        CompanyAddress: data.CompanyAddress,
        CompanyEmail: data.CompanyEmail,
        CompanyName: data.CompanyName,
        CompanyPhone: data.CompanyPhone,
        CompanyLogo: logoImgBase64,
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

        <div className="flex flex-col gap-4">
          <div className="font-semibold text-lg">Company Logo</div>
          <label
            htmlFor="image"
            className=" cursor-pointer flex items-center gap-4"
          >
            <img
              src={logoImgBase64}
              alt={logoImgBase64 ? "Uploaded" : "No Image Uploaded"}
              className="w-32 h-32 object-cover rounded"
            />
            <input
              id="image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <div className="bg-grayButtonBg px-4 py-2 rounded font-medium ">
              Change Logo
            </div>
          </label>
        </div>
      </form>
    </FormProvider>
  );
};

export default CompanyInfo;
