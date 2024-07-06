import { errorHandler } from '../../utilities/CustomError';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../utilities/TsxUtils';
import DbSuperAdmin from '../../firebase_configs/DB/DbSuperAdmin';
import Button from '../../common/button/Button';
import PageHeader from '../../common/PageHeader';
import { useNavigate } from 'react-router-dom';
import {
  CompanyCreateFormFields,
  companyCreateSchema,
} from '../../utilities/zod/schema';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import InputWithTopHeader from '../../common/inputs/InputWithTopHeader';
import TextareaWithTopHeader from '../../common/inputs/TextareaWithTopHeader';
import SwitchWithSideHeader from '../../common/switch/SwitchWithSideHeader';
import { PageRoutes, REACT_QUERY_KEYS } from '../../@types/enum';
import { useQueryClient } from '@tanstack/react-query';

const CreateNewCompany = () => {
  const navigate = useNavigate();

  const methods = useForm<CompanyCreateFormFields>({
    resolver: zodResolver(companyCreateSchema),
    defaultValues: {
      SettingIsEmergencyResponseEnabled: true,
      SettingIsAuditEnabled: true,
      SettingIsCalloutEnabled: true,
      SettingIsCommunicationCenterEnabled: true,
      SettingIsEmpDarEnabled: true,
      SettingIsDocRepoEnabled: true,
      SettingIsEquipmentManagementEnabled: true,
      SettingIsHRSystemEnabled: true,
      SettingIsKeyManagementEnabled: true,
      SettingIsPatrollingEnabled: true,
      SettingIsPaymentsAndBillingEnabled: true,
      SettingIsPerformanceAssuranceEnabled: true,
      SettingIsReportsEnabled: true,
      SettingIsTaskAssignmentAndTrackingEnabled: true,
      SettingIsTimeAndAttendanceEnabled: true,
      SettingIsTrainingAndCertificationsEnabled: true,
      SettingIsVisitorManagementEnabled: true,
    },
  });

  const queryClient = useQueryClient();

  const onSubmit = async (data: CompanyCreateFormFields) => {
    try {
      showModalLoader({});
      await DbSuperAdmin.createNewCompany(data);

      showSnackbar({
        message: 'Company created successfully',
        type: 'success',
      });

      closeModalLoader();

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.COMPANY_LIST],
      });

      navigate(PageRoutes.SUPER_ADMIN_COMPANY_LIST);
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
        className="flex flex-col w-full h-full p-6 gap-6"
      >
        <PageHeader
          title="Create Company"
          rightSection={
            <Button
              label="Save"
              type="black"
              onClick={() => {
                methods.handleSubmit(onSubmit);
              }}
              buttonType="submit"
            />
          }
        />

        <div className="flex flex-col gap-6 bg-surface shadow rounded p-4">
          {/* Company details */}
          <div className="font-semibold">Company Details</div>
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
              className="mx-0"
              title="Company Address"
              register={methods.register}
              name="CompanyAddress"
              error={methods.formState.errors.CompanyAddress?.message}
            />
          </div>

          {/* Admin Password */}
          <div className="font-semibold">Admin Details</div>
          <div className="grid grid-cols-3 gap-4">
            <InputWithTopHeader
              className="mx-0"
              label="Admin Name"
              register={methods.register}
              name="CompanyAdminDetails.AdminName"
              error={
                methods.formState.errors.CompanyAdminDetails?.AdminName?.message
              }
            />
            <InputWithTopHeader
              className="mx-0"
              label="Admin Phone"
              register={methods.register}
              name="CompanyAdminDetails.AdminPhone"
              error={
                methods.formState.errors.CompanyAdminDetails?.AdminPhone
                  ?.message
              }
            />
            <InputWithTopHeader
              className="mx-0"
              label="Admin Email"
              register={methods.register}
              name="CompanyAdminDetails.AdminEmail"
              error={
                methods.formState.errors.CompanyAdminDetails?.AdminEmail
                  ?.message
              }
            />
            <InputWithTopHeader
              className="mx-0"
              label="Admin Password"
              register={methods.register}
              name="CompanyAdminDetails.AdminPassword"
              error={
                methods.formState.errors.CompanyAdminDetails?.AdminPassword
                  ?.message
              }
              inputType="password"
            />
          </div>

          {/* Company settings */}
          <div className="font-semibold">Company Enabled Features</div>
          <div className="grid grid-cols-3 gap-4">
            <SwitchWithSideHeader
              className="mx-0 bg-onHoverBg px-4 py-2 rounded"
              label="Patrolling"
              register={methods.register}
              name="SettingIsPatrollingEnabled"
            />
            <SwitchWithSideHeader
              className="mx-0 bg-onHoverBg px-4 py-2 rounded"
              label="Employee Dar"
              register={methods.register}
              name="SettingIsEmpDarEnabled"
            />
            <SwitchWithSideHeader
              className="mx-0 bg-onHoverBg px-4 py-2 rounded"
              label="Callout"
              register={methods.register}
              name="SettingIsCalloutEnabled"
            />
            <SwitchWithSideHeader
              className="mx-0 bg-onHoverBg px-4 py-2 rounded"
              label="Equipment Management"
              register={methods.register}
              name="SettingIsEquipmentManagementEnabled"
            />
            <SwitchWithSideHeader
              className="mx-0 bg-onHoverBg px-4 py-2 rounded"
              label="Key Management"
              register={methods.register}
              name="SettingIsKeyManagementEnabled"
            />
            <SwitchWithSideHeader
              className="mx-0 bg-onHoverBg px-4 py-2 rounded"
              label="Payments & Billing"
              register={methods.register}
              name="SettingIsPaymentsAndBillingEnabled"
            />
            <SwitchWithSideHeader
              className="mx-0 bg-onHoverBg px-4 py-2 rounded"
              label="Training & Certifications"
              register={methods.register}
              name="SettingIsTrainingAndCertificationsEnabled"
            />
            <SwitchWithSideHeader
              className="mx-0 bg-onHoverBg px-4 py-2 rounded"
              label="Visitor Management"
              register={methods.register}
              name="SettingIsVisitorManagementEnabled"
            />
            <SwitchWithSideHeader
              className="mx-0 bg-onHoverBg px-4 py-2 rounded"
              label="Reports"
              register={methods.register}
              name="SettingIsReportsEnabled"
            />
            <SwitchWithSideHeader
              className="mx-0 bg-onHoverBg px-4 py-2 rounded"
              label="Communication Center"
              register={methods.register}
              name="SettingIsCommunicationCenterEnabled"
            />
            <SwitchWithSideHeader
              className="mx-0 bg-onHoverBg px-4 py-2 rounded"
              label="Document Repository"
              register={methods.register}
              name="SettingIsDocRepoEnabled"
            />
            <SwitchWithSideHeader
              className="mx-0 bg-onHoverBg px-4 py-2 rounded"
              label="Emergency Response"
              register={methods.register}
              name="SettingIsEmergencyResponseEnabled"
            />
            <SwitchWithSideHeader
              className="mx-0 bg-onHoverBg px-4 py-2 rounded"
              label="Time & Attendance"
              register={methods.register}
              name="SettingIsTimeAndAttendanceEnabled"
            />
            <SwitchWithSideHeader
              className="mx-0 bg-onHoverBg px-4 py-2 rounded"
              label="Audit"
              register={methods.register}
              name="SettingIsAuditEnabled"
            />
            <SwitchWithSideHeader
              className="mx-0 bg-onHoverBg px-4 py-2 rounded"
              label="Performance Assurance"
              register={methods.register}
              name="SettingIsPerformanceAssuranceEnabled"
            />
            <SwitchWithSideHeader
              className="mx-0 bg-onHoverBg px-4 py-2 rounded"
              label="Task Assignment & Tracking"
              register={methods.register}
              name="SettingIsTaskAssignmentAndTrackingEnabled"
            />
            <SwitchWithSideHeader
              className="mx-0 bg-onHoverBg px-4 py-2 rounded"
              label="HR System"
              register={methods.register}
              name="SettingIsHRSystemEnabled"
            />
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

export default CreateNewCompany;
