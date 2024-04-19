import React, { useEffect } from 'react';
import Dialog from '../../../common/Dialog';
import {
  CompanyBranchFormFields,
  companyBranchSchema,
} from '../../../utilities/zod/schema';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import InputWithTopHeader from '../../../common/inputs/InputWithTopHeader';
import TextareaWithTopHeader from '../../../common/inputs/TextareaWithTopHeader';
import { errorHandler } from '../../../utilities/CustomError';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../../utilities/TsxUtils';
import DbCompany from '../../../firebase_configs/DB/DbCompany';
import { useAuthState, useEditFormStore } from '../../../store';
import { CompanyBranches } from '../../../store/slice/auth.slice';
import { openContextModal } from '@mantine/modals';

const AddBranchModal = ({
  opened,
  setOpened,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const methods = useForm<CompanyBranchFormFields>({
    resolver: zodResolver(companyBranchSchema),
  });

  const { company, setCompanyBranches, companyBranches } = useAuthState();

  const { companyBranchEditData } = useEditFormStore();

  const isEdit = !!companyBranchEditData;

  useEffect(() => {
    let allFormFields: CompanyBranchFormFields = {
      CompanyBranchName: '',
      CompanyBranchEmail: '',
      CompanyBranchPhone: '',
      CompanyBranchAddress: '',
    };
    if (isEdit) {
      allFormFields = {
        CompanyBranchAddress: companyBranchEditData.CompanyBranchAddress,
        CompanyBranchEmail: companyBranchEditData.CompanyBranchEmail,
        CompanyBranchName: companyBranchEditData.CompanyBranchName,
        CompanyBranchPhone: companyBranchEditData.CompanyBranchPhone,
      };
    }
    methods.reset(allFormFields);
  }, [isEdit, companyBranchEditData, opened]);

  const onSubmit = async (data: CompanyBranchFormFields) => {
    if (!company) return;
    try {
      showModalLoader({});

      if (isEdit) {
        const updatedCmpBranch = await DbCompany.updateCompanyBranch({
          cmpId: company.CompanyId,
          cmpBranchId: companyBranchEditData.CompanyBranchId,
          data,
        });

        showSnackbar({
          message: 'Company branch updated successfully',
          type: 'success',
        });

        setCompanyBranches([
          ...companyBranches.filter(
            (b) => b.CompanyBranchId !== companyBranchEditData.CompanyBranchId
          ),
          updatedCmpBranch as unknown as CompanyBranches,
        ]);
      } else {
        const newCmpBranch = await DbCompany.createCompanyBranch(
          company.CompanyId,
          data
        );

        showSnackbar({
          message: 'Company branch created successfully',
          type: 'success',
        });

        setCompanyBranches([
          ...companyBranches,
          newCmpBranch as unknown as CompanyBranches,
        ]);
      }

      methods.reset();

      setOpened(false);
      closeModalLoader();
    } catch (error) {
      console.log(error);
      errorHandler(error);
      closeModalLoader();
    }
  };

  const onDelete = async () => {
    if (!company || !isEdit) return;
    try {
      showModalLoader({});

      await DbCompany.deleteCompanyBranch(
        companyBranchEditData.CompanyBranchId
      );

      showSnackbar({
        message: 'Company branch deleted successfully',
        type: 'success',
      });

      setCompanyBranches(
        companyBranches.filter(
          (b) => b.CompanyBranchId !== companyBranchEditData.CompanyBranchId
        )
      );

      methods.reset();

      setOpened(false);
      closeModalLoader();
    } catch (error) {
      console.log(error);
      errorHandler(error);
      closeModalLoader();
    }
  };
  return (
    <Dialog
      opened={opened}
      setOpened={setOpened}
      title="Add New Company Branch"
      size="80%"
      isFormModal
      positiveCallback={methods.handleSubmit(onSubmit)}
      negativeCallback={() =>
        isEdit
          ? openContextModal({
              modal: 'confirmModal',
              withCloseButton: false,
              centered: true,
              closeOnClickOutside: true,
              innerProps: {
                title: 'Confirm',
                body: 'Are you sure to delete this branch',
                onConfirm: () => {
                  onDelete();
                },
                onCancel: () => {
                  setOpened(true);
                },
              },
              size: '30%',
              styles: {
                body: { padding: '0px' },
              },
            })
          : setOpened(false)
      }
      negativeLabel={isEdit ? 'Delete' : 'Cancel'}
      positiveLabel={isEdit ? 'Update' : 'Save'}
    >
      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit(onSubmit)}
          className="grid grid-cols-2 gap-4"
        >
          <InputWithTopHeader
            className="mx-0"
            label="Branch Name"
            register={methods.register}
            name="CompanyBranchName"
            error={methods.formState.errors.CompanyBranchName?.message}
          />
          <InputWithTopHeader
            className="mx-0"
            label="Branch Email"
            register={methods.register}
            name="CompanyBranchEmail"
            error={methods.formState.errors.CompanyBranchEmail?.message}
          />
          <InputWithTopHeader
            className="mx-0"
            label="Branch Phone"
            register={methods.register}
            name="CompanyBranchPhone"
            error={methods.formState.errors.CompanyBranchPhone?.message}
          />
          <div>&nbsp;</div>
          <TextareaWithTopHeader
            className="mx-0"
            title="Branch Address"
            register={methods.register}
            name="CompanyBranchAddress"
            error={methods.formState.errors.CompanyBranchAddress?.message}
          />
        </form>
      </FormProvider>
    </Dialog>
  );
};

export default AddBranchModal;
