import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import {
  AddEmployeeFormField,
  addEmployeeFormSchema,
} from '../../utilities/zod/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthState, useEditFormStore } from '../../store';
import { useQueryClient } from '@tanstack/react-query';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../utilities/TsxUtils';
import DbEmployee from '../../firebase_configs/DB/DbEmployee';
import {
  IEmployeeStatus,
  PageRoutes,
  REACT_QUERY_KEYS,
} from '../../@types/enum';
import { useNavigate } from 'react-router-dom';
import { errorHandler } from '../../utilities/CustomError';
import InputWithTopHeader from '../../common/inputs/InputWithTopHeader';
import { AiOutlinePlus } from 'react-icons/ai';
import AddEmpRoleModal from '../../component/employees/modal/AddEmpRoleModal';
import { IoArrowBackCircle } from 'react-icons/io5';
import Button from '../../common/button/Button';
import { openContextModal } from '@mantine/modals';
import AddBranchModal from '../../component/company_branches/modal/AddBranchModal';
import { splitName, toDate } from '../../utilities/misc';
import useFetchEmployees from '../../hooks/fetch/useFetchEmployees';
import EmpUploadImgCard from '../../component/employees/EmpUploadImgCard';
import EmployeeOtherDetails, {
  EmpLicenseDetails,
} from '../../component/employees/EmployeeOtherDetails';
import { IEmpBankDetails } from '../../@types/database';
import { EmpCertificates } from '../../component/employees/EmpCertificateDetails';
import InputHeader from '../../common/inputs/InputHeader';
import { MultiSelect } from '@mantine/core';
import InputSelect from '../../common/inputs/InputSelect';
import useFetchLocations from '../../hooks/fetch/useFetchLocations';
import SwitchWithSideHeader from '../../common/switch/SwitchWithSideHeader';

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
            employeeEditData.EmployeeMaxHrsPerWeek || 44
          ) as unknown as number,
          EmployeeSupervisorId: employeeEditData.EmployeeSupervisorId,
          EmployeeCompanyBranchId: employeeEditData.EmployeeCompanyBranchId,
          EmployeeBannedLocationsId:
            employeeEditData.EmployeeBannedLocationsId || [],
          EmployeeSinNumber: employeeEditData.EmployeeSinNumber,
          EmployeeAddress: employeeEditData.EmployeeAddress,
          EmployeeCity: employeeEditData.EmployeeCity,
          EmployeePostalCode: employeeEditData.EmployeePostalCode,
          EmployeeProvince: employeeEditData.EmployeeProvince,
          EmployeeStatus:
            employeeEditData?.EmployeeStatus || IEmployeeStatus.ON_BOARD,
          EmployeeIsTimeStampForPatrolImagesEnabled:
            employeeEditData?.EmployeeIsTimeStampForPatrolImagesEnabled ??
            false,
          EmployeeIsUploadFromGalleryEnabled:
            employeeEditData?.EmployeeIsUploadFromGalleryEnabled ?? false,
        }
      : {
          EmployeeMaxHrsPerWeek: String(44) as unknown as number,
          EmployeeBannedLocationsId: [],
          EmployeeStatus: IEmployeeStatus.ON_BOARD,
        },
  });

  const navigate = useNavigate();

  const { company, empRoles, companyBranches } = useAuthState();

  const [employeeRole, setEmployeeRole] = useState<string | null | undefined>(
    ''
  );

  const [addEmpRoleModal, setAddEmpRoleModal] = useState(false);

  const [addCmpBranchModal, setAddCmpBranchModal] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    methods.setValue('EmployeeRole', employeeRole || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeRole]);

  useEffect(() => {
    if (isEdit) {
      setEmployeeRole(employeeEditData.EmployeeRole);
      setEmpImageBase64(employeeEditData.EmployeeImg);
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
      setEmployeeRole('');
      setEmpImageBase64('');
      setEmpLicenseDetails([]);
      setEmpBankDetails({
        BankAccNumber: '',
        BankInstitutionNumber: '',
        BankTransitNumber: '',
        BankVoidCheckImg: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, employeeEditData]);

  const { data: supervisors } = useFetchEmployees({
    limit: 100,
    empRole: 'SUPERVISOR',
  });

  const { data: locations } = useFetchLocations({});

  const [empImageBase64, setEmpImageBase64] = useState<string | null>(null);

  const [empLicenseDetails, setEmpLicenseDetails] = useState<
    EmpLicenseDetails[]
  >([]);

  const [empBankDetails, setEmpBankDetails] = useState<IEmpBankDetails>({
    BankAccNumber: '',
    BankInstitutionNumber: '',
    BankTransitNumber: '',
    BankVoidCheckImg: '',
  });

  const [empCertificates, setEmpCertificates] = useState<EmpCertificates[]>([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (loading) {
      showModalLoader({});
    } else {
      closeModalLoader();
    }
    return () => closeModalLoader();
  }, [loading]);

  const onSubmit = async (data: AddEmployeeFormField) => {
    if (!company) return;
    try {
      setLoading(true);

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

        showSnackbar({
          message: 'Employee updated successfully',
          type: 'success',
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

        showSnackbar({
          message: 'Employee created successfully',
          type: 'success',
        });
      }

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.EMPLOYEE_LIST],
      });

      setLoading(false);
      navigate(PageRoutes.EMPLOYEE_LIST);

      methods.reset();
    } catch (error) {
      console.log(error);
      setLoading(false);
      errorHandler(error);
    }
  };

  const onDelete = async () => {
    if (!isEdit) return;
    try {
      setLoading(true);

      await DbEmployee.deleteEmployee(employeeEditData.EmployeeId);

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.EMPLOYEE_LIST],
      });

      showSnackbar({
        message: 'Employee deleted successfully',
        type: 'success',
      });

      setLoading(false);
      methods.reset();
      navigate(PageRoutes.EMPLOYEE_LIST);
    } catch (error) {
      console.log(error);
      setLoading(false);
      errorHandler(error);
    }
  };

  console.log(methods.formState.errors, 'errors');

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
                  modal: 'confirmModal',
                  withCloseButton: false,
                  centered: true,
                  closeOnClickOutside: true,
                  innerProps: {
                    title: 'Confirm',
                    body: 'Are you sure to delete this employee',
                    onConfirm: () => {
                      onDelete();
                    },
                  },
                  size: '30%',
                  styles: {
                    body: { padding: '0px' },
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
                disabled={isEdit}
              />

              <InputSelect
                label="Role"
                value={employeeRole || ''}
                onChange={setEmployeeRole}
                data={empRoles.map((role) => {
                  return {
                    label: role.EmployeeRoleName,
                    value: role.EmployeeRoleName,
                  };
                })}
                nothingFoundMessage={
                  <div
                    onClick={() => {
                      navigate(PageRoutes.EMPLOYEE_LIST);
                      setAddEmpRoleModal(true);
                    }}
                    className="bg-primaryGold text-surface font-medium p-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <AiOutlinePlus size={18} />
                      <span>Add employee roles</span>
                    </div>
                  </div>
                }
                error={methods.formState.errors.EmployeeRole?.message}
                searchable
                clearable
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
              <InputSelect
                label="Select branch"
                data={[
                  { label: 'All branch', value: '' },
                  ...companyBranches.map((branches) => {
                    return {
                      label: branches.CompanyBranchName,
                      value: branches.CompanyBranchId,
                    };
                  }),
                ]}
                value={methods.watch('EmployeeCompanyBranchId') || ''}
                onChange={(e) =>
                  methods.setValue('EmployeeCompanyBranchId', e as string)
                }
                nothingFoundMessage={
                  <div
                    onClick={() => {
                      navigate(PageRoutes.COMPANY_BRANCHES);
                      setAddCmpBranchModal(true);
                    }}
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
              <InputSelect
                label="Employee Status"
                data={[
                  { label: 'Onboard', value: IEmployeeStatus.ON_BOARD },
                  { label: 'Offboard', value: IEmployeeStatus.OFF_BOARD },
                  { label: 'Left', value: IEmployeeStatus.LEAVED },
                  { label: 'Fired', value: IEmployeeStatus.FIRED },
                ]}
                value={
                  methods.watch('EmployeeStatus') || IEmployeeStatus.ON_BOARD
                }
                onChange={(e) =>
                  methods.setValue('EmployeeStatus', e as IEmployeeStatus)
                }
                className="w-full"
                error={methods.formState.errors.EmployeeStatus?.message}
              />
              {employeeRole !== 'SUPERVISOR' && (
                <div className="flex flex-col gap-1 col-span-2">
                  <InputHeader title="Supervisor" />
                  <MultiSelect
                    searchable
                    data={supervisors.map((branch) => {
                      return {
                        label: branch.EmployeeName,
                        value: branch.EmployeeId,
                      };
                    })}
                    value={methods.watch('EmployeeSupervisorId') || []}
                    onChange={(e) =>
                      methods.setValue('EmployeeSupervisorId', e)
                    }
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
                    error={
                      methods.formState.errors.EmployeeSupervisorId?.message
                    }
                    styles={{
                      input: {
                        border: `1px solid #0000001A`,
                        fontWeight: 'normal',
                        fontSize: '18px',
                        borderRadius: '4px',
                        background: '#FFFFFF',
                        color: '#000000',
                        padding: '8px 8px',
                      },
                    }}
                  />
                </div>
              )}

              <div className="flex flex-col gap-1 col-span-2">
                <InputHeader title="Employee Banned Locations" />
                <MultiSelect
                  searchable
                  data={locations.map((branch) => {
                    return {
                      label: branch.LocationName,
                      value: branch.LocationId,
                    };
                  })}
                  value={methods.watch('EmployeeBannedLocationsId') || []}
                  onChange={(e) =>
                    methods.setValue('EmployeeBannedLocationsId', e)
                  }
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
                  error={
                    methods.formState.errors.EmployeeBannedLocationsId?.message
                  }
                  styles={{
                    input: {
                      border: `1px solid #0000001A`,
                      fontWeight: 'normal',
                      fontSize: '18px',
                      borderRadius: '4px',
                      background: '#FFFFFF',
                      color: '#000000',
                      padding: '8px 8px',
                    },
                  }}
                />
              </div>

              <SwitchWithSideHeader
                label="Enable photo upload from gallery"
                register={methods.register}
                name="EmployeeIsUploadFromGalleryEnabled"
                errors={
                  methods.formState.errors?.EmployeeIsUploadFromGalleryEnabled
                    ?.message
                }
                className="bg-onHoverBg px-4 py-2 rounded col-span-2"
              />
              <SwitchWithSideHeader
                label="Enable timestamp for patrol images"
                register={methods.register}
                name="EmployeeIsTimeStampForPatrolImagesEnabled"
                errors={
                  methods.formState.errors
                    ?.EmployeeIsTimeStampForPatrolImagesEnabled?.message
                }
                className="bg-onHoverBg px-4 py-2 rounded col-span-2"
              />
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
