import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import {
  AddEmployeeFormField,
  addEmployeeFormSchema,
} from "../../utilities/zod/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthState, useEditFormStore } from "../../store";
import { useQueryClient } from "@tanstack/react-query";
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from "../../utilities/TsxUtils";
import DbEmployee from "../../firebase_configs/DB/DbEmployee";
import { PageRoutes, REACT_QUERY_KEYS } from "../../@types/enum";
import { useNavigate } from "react-router-dom";
import CustomError, { errorHandler } from "../../utilities/CustomError";
import InputWithTopHeader from "../../common/inputs/InputWithTopHeader";
import InputAutoComplete from "../../common/inputs/InputAutocomplete";
import { AiOutlinePlus } from "react-icons/ai";
import AddEmpRoleModal from "../../component/employees/modal/AddEmpRoleModal";
import { IoArrowBackCircle } from "react-icons/io5";
import Button from "../../common/button/Button";
import { openContextModal } from "@mantine/modals";
import AddBranchModal from "../../component/company_branches/modal/AddBranchModal";
import { splitName, toDate } from "../../utilities/misc";
import useFetchEmployees from "../../hooks/fetch/useFetchEmployees";
import InputSelect from "../../common/inputs/InputSelect";
import EmpUploadImgCard from "../../component/employees/EmpUploadImgCard";
import EmployeeOtherDetails, {
  EmpLicenseDetails,
} from "../../component/employees/EmployeeOtherDetails";
import SwitchWithSideHeader from "../../common/switch/SwitchWithSideHeader";
import { IEmpBankDetails } from "../../@types/database";
import { EmpCertificates } from "../../component/employees/EmpCertificateDetails";

const EmployeeCreateOrEdit = () => {
  const { employeeEditData } = useEditFormStore();

  const isEdit = !!employeeEditData;

  const methods = useForm<AddEmployeeFormField>({
    resolver: zodResolver(addEmployeeFormSchema),
    defaultValues: isEdit
      ? {
          EmployeeEmail: employeeEditData.EmployeeEmail,
          EmployeeFirstName: splitName(employeeEditData?.EmployeeName)
            .firstName,
          EmployeeLastName: splitName(employeeEditData?.EmployeeName).lastName,
          EmployeePassword: employeeEditData.EmployeePassword,
          EmployeePhone: employeeEditData.EmployeePhone,
          EmployeeRole: employeeEditData.EmployeeRole,
          EmployeePayRate: String(
            employeeEditData.EmployeePayRate
          ) as unknown as number,
          EmployeeMaxHrsPerWeek: String(
            employeeEditData.EmployeeMaxHrsPerWeek || 45
          ) as unknown as number,
          EmployeeSupervisorId: employeeEditData.EmployeeSupervisorId,
          EmployeeCompanyBranchId: employeeEditData.EmployeeCompanyBranchId,
          EmployeeIsBanned: employeeEditData.EmployeeIsBanned,
        }
      : { EmployeeMaxHrsPerWeek: String(45) as unknown as number },
  });

  const navigate = useNavigate();

  const { company, empRoles, companyBranches } = useAuthState();

  const [employeeRole, setEmployeeRole] = useState<string | null | undefined>(
    ""
  );

  const [companyBranch, setCompanyBranch] = useState<string | null | undefined>(
    null
  );

  const [addEmpRoleModal, setAddEmpRoleModal] = useState(false);

  const [addCmpBranchModal, setAddCmpBranchModal] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    methods.setValue("EmployeeRole", employeeRole || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeRole]);

  useEffect(() => {
    const branchId = companyBranches.find(
      (b) => b.CompanyBranchName === companyBranch
    )?.CompanyBranchId;
    methods.setValue("EmployeeCompanyBranchId", branchId || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyBranch]);

  useEffect(() => {
    if (isEdit) {
      setEmployeeRole(employeeEditData.EmployeeRole);
      setEmpImageBase64(employeeEditData.EmployeeImg);
      if (employeeEditData.EmployeeCompanyBranchId) {
        const branchName = companyBranches.find(
          (b) => b.CompanyBranchId === employeeEditData.EmployeeCompanyBranchId
        )?.CompanyBranchName;
        setCompanyBranch(branchName || null);
      }
      if (employeeEditData.EmployeeLicenses) {
        setEmpLicenseDetails(
          employeeEditData?.EmployeeLicenses?.map((l) => {
            return { ...l, LicenseExpDate: toDate(l.LicenseExpDate) };
          })
        );
      }
      if (employeeEditData.EmployeeBankDetails) {
        setEmpBankDetails(employeeEditData.EmployeeBankDetails);
      }
      if (employeeEditData.EmployeeCertificates) {
        setEmpCertificates(employeeEditData.EmployeeCertificates);
      }
    } else {
      setEmployeeRole("");
      setEmpImageBase64("");
      setCompanyBranch(null);
      setEmpLicenseDetails([]);
      setEmpBankDetails({
        BankAccName: "",
        BankAccNumber: "",
        BankIfscCode: "",
        BankName: "",
        BankVoidCheckImg: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, employeeEditData]);

  const { data: supervisors } = useFetchEmployees({
    limit: 100,
    empRole: "SUPERVISOR",
  });

  const [empImageBase64, setEmpImageBase64] = useState<string | null>(null);

  const [empLicenseDetails, setEmpLicenseDetails] = useState<
    EmpLicenseDetails[]
  >([]);

  const [empBankDetails, setEmpBankDetails] = useState<IEmpBankDetails>({
    BankAccName: "",
    BankAccNumber: "",
    BankIfscCode: "",
    BankName: "",
    BankVoidCheckImg: "",
  });

  const [empCertificates, setEmpCertificates] = useState<EmpCertificates[]>([]);

  const onSubmit = async (data: AddEmployeeFormField) => {
    if (!empImageBase64) {
      showSnackbar({ message: "Please add employee image", type: "error" });
      return;
    }
    if (!company) return;
    try {
      const requiredFields = [
        "BankAccName",
        "BankAccNumber",
        "BankIfscCode",
        "BankName",
        "BankVoidCheckImg",
      ];

      if (
        !requiredFields.every(
          (field) => empBankDetails[field as keyof IEmpBankDetails]
        )
      ) {
        throw new CustomError("Please add complete bank details");
      }
      showModalLoader({});

      if (isEdit) {
        await DbEmployee.updateEmployee({
          empData: data,
          empImage: empImageBase64,
          empId: employeeEditData.EmployeeId,
          cmpId: company.CompanyId,
          licenseDetails: empLicenseDetails,
          bankDetails: empBankDetails,
          certificates: empCertificates.filter(
            (c) => c.CertificateName && c.CertificateDoc
          ),
        });
      } else {
        await DbEmployee.addEmployee({
          empData: data,
          empImage: empImageBase64,
          cmpId: company.CompanyId,
          licenseDetails: empLicenseDetails,
          bankDetails: empBankDetails,
          certificates: empCertificates.filter(
            (c) => c.CertificateName && c.CertificateDoc
          ),
        });
      }

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.EMPLOYEE_LIST],
      });

      closeModalLoader();
      navigate(PageRoutes.EMPLOYEE_LIST);
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
      navigate(PageRoutes.EMPLOYEE_LIST);
    } catch (error) {
      console.log(error);
      closeModalLoader();
      errorHandler(error);
    }
  };
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between w-full bg-primaryGold rounded p-4 shadow">
        <div
          onClick={() => navigate(PageRoutes.EMPLOYEE_LIST)}
          className="flex items-center gap-4 cursor-pointer "
        >
          <div className="cursor-pointer">
            <IoArrowBackCircle className="h-6 w-6" />
          </div>
          <div className="font-semibold text-lg">Create new employee</div>
        </div>
        <div className="flex items-center gap-4">
          {isEdit && (
            <Button
              label="Delete"
              type="white"
              onClick={() =>
                openContextModal({
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
                  },
                  size: "30%",
                  styles: {
                    body: { padding: "0px" },
                  },
                })
              }
              className="px-14 py-2"
            />
          )}
          <Button
            label="Save"
            type="black"
            onClick={methods.handleSubmit(onSubmit)}
            className="px-14 py-2"
          />
        </div>
      </div>
      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex  gap-4 w-full">
            <div className="flex flex-col gap-4 w-[50%] bg-surface shadow p-4 rounded">
              <EmpUploadImgCard
                empImageBase64={empImageBase64}
                setEmpImageBase64={setEmpImageBase64}
              />
              <EmployeeOtherDetails
                empLicenseDetails={empLicenseDetails}
                setEmpLicenseDetails={setEmpLicenseDetails}
                empBankDetails={empBankDetails}
                setEmpBankDetails={setEmpBankDetails}
                certificates={empCertificates}
                setCertificates={setEmpCertificates}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 w-[50%] bg-surface shadow rounded p-4 place-content-start flex-grow">
              <InputWithTopHeader
                className="mx-0"
                label="First Name"
                register={methods.register}
                name="EmployeeFirstName"
                error={methods.formState.errors.EmployeeFirstName?.message}
              />
              <InputWithTopHeader
                className="mx-0"
                label="Last Name"
                register={methods.register}
                name="EmployeeLastName"
                error={methods.formState.errors.EmployeeLastName?.message}
              />
              <InputWithTopHeader
                className="mx-0"
                label="Phone Number"
                register={methods.register}
                name="EmployeePhone"
                error={methods.formState.errors.EmployeePhone?.message}
              />
              <InputWithTopHeader
                className="mx-0"
                label="Email"
                register={methods.register}
                name="EmployeeEmail"
                error={methods.formState.errors.EmployeeEmail?.message}
              />

              <InputWithTopHeader
                className="mx-0"
                label="Password"
                register={methods.register}
                name="EmployeePassword"
                error={methods.formState.errors.EmployeePassword?.message}
                inputType="password"
              />

              <InputAutoComplete
                readonly={isEdit}
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
                error={methods.formState.errors.EmployeeRole?.message}
              />

              <InputWithTopHeader
                className="mx-0"
                label="Pay rate (hourly)"
                register={methods.register}
                name="EmployeePayRate"
                error={methods.formState.errors.EmployeePayRate?.message}
                decimalCount={2}
              />

              <InputWithTopHeader
                className="mx-0"
                label="Maximum week hours"
                register={methods.register}
                name="EmployeeMaxHrsPerWeek"
                error={methods.formState.errors.EmployeeMaxHrsPerWeek?.message}
                decimalCount={2}
              />

              {employeeRole === "GUARD" && (
                <InputSelect
                  label="Supervisor"
                  value={methods.watch("EmployeeSupervisorId") || ""}
                  onChange={(e) =>
                    methods.setValue("EmployeeSupervisorId", e as string)
                  }
                  data={supervisors.map((branch) => {
                    return {
                      label: branch.EmployeeName,
                      value: branch.EmployeeId,
                    };
                  })}
                  searchable
                  nothingFoundMessage={
                    <div
                      onClick={() => {
                        navigate(PageRoutes.EMPLOYEE_LIST);
                        setTimeout(
                          () => navigate(PageRoutes.EMPLOYEE_CREATE_OR_EDIT),
                          50
                        );
                      }}
                      className="bg-primaryGold text-surface font-medium p-2 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <AiOutlinePlus size={18} />
                        <span>Add new supervisor</span>
                      </div>
                    </div>
                  }
                  error={methods.formState.errors.EmployeeSupervisorId?.message}
                />
              )}

              <div className="col-span-2 flex items-end justify-end w-full gap-4">
                <InputAutoComplete
                  readonly={isEdit}
                  label="Branch (Optional)"
                  value={companyBranch}
                  onChange={setCompanyBranch}
                  isFilterReq={true}
                  data={companyBranches.map((branch) => {
                    return {
                      label: branch.CompanyBranchName,
                      value: branch.CompanyBranchName,
                    };
                  })}
                  dropDownHeader={
                    <div
                      onClick={() => setAddCmpBranchModal(true)}
                      className="bg-primaryGold text-surface font-medium p-2 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <AiOutlinePlus size={18} />
                        <span>Add new branch</span>
                      </div>
                    </div>
                  }
                  className="w-full"
                />
                <SwitchWithSideHeader
                  register={methods.register}
                  name="EmployeeIsBanned"
                  className="w-full mb-2 font-medium"
                  label="Ban this employee"
                />
              </div>
            </div>
          </div>
        </form>
      </FormProvider>
      <AddEmpRoleModal
        opened={addEmpRoleModal}
        setOpened={setAddEmpRoleModal}
      />
      <AddBranchModal
        opened={addCmpBranchModal}
        setOpened={setAddCmpBranchModal}
      />
    </div>
  );
};

export default EmployeeCreateOrEdit;
