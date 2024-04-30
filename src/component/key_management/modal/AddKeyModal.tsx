import React, { useEffect, useState } from 'react';
import Dialog from '../../../common/Dialog';
import { KeyFormFields, keySchema } from '../../../utilities/zod/schema';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import InputWithTopHeader from '../../../common/inputs/InputWithTopHeader';
import InputSelect from '../../../common/inputs/InputSelect';
import { useAuthState, useEditFormStore } from '../../../store';
import { errorHandler } from '../../../utilities/CustomError';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../../utilities/TsxUtils';
import DbAssets from '../../../firebase_configs/DB/DbAssets';
import { PageRoutes, REACT_QUERY_KEYS } from '../../../@types/enum';
import { useQueryClient } from '@tanstack/react-query';
import { openContextModal } from '@mantine/modals';
import { useNavigate } from 'react-router-dom';

const AddKeyModal = ({
  opened,
  setOpened,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const navigate = useNavigate();

  const methods = useForm<KeyFormFields>({
    resolver: zodResolver(keySchema),
  });

  const { keyEditData, setKeyEditData } = useEditFormStore();

  const isEdit = !!keyEditData;

  const queryClient = useQueryClient();

  const { companyBranches, company } = useAuthState();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let allFormFields: KeyFormFields = {
      KeyName: '',
      KeyDescription: null,
      KeyTotalQuantity: 0,
      KeyCompanyBranchId: null,
    };
    if (isEdit) {
      allFormFields = {
        KeyName: keyEditData.KeyName,
        KeyDescription: keyEditData.KeyDescription,
        KeyTotalQuantity: keyEditData.KeyTotalQuantity,
        KeyCompanyBranchId: keyEditData.KeyCompanyBranchId,
      };
    }
    methods.reset(allFormFields);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, keyEditData, opened]);

  const onSubmit = async (data: KeyFormFields) => {
    if (!company) return;
    try {
      setLoading(true);

      if (isEdit) {
        await DbAssets.updateKey(keyEditData.KeyId, data);
        showSnackbar({
          message: 'Key updated successfully',
          type: 'success',
        });
      } else {
        await DbAssets.createKey(company.CompanyId, data);
        showSnackbar({
          message: 'Key created successfully',
          type: 'success',
        });
      }

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.KEY_LIST],
      });

      setKeyEditData(null);

      setOpened(false);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log(error);
      errorHandler(error);
    }
  };

  const onDelete = async () => {
    if (!isEdit) return;
    try {
      setLoading(true);

      await DbAssets.deleteKey(keyEditData.KeyId);

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.KEY_LIST],
      });

      showSnackbar({
        message: 'Equipment deleted successfully',
        type: 'success',
      });

      setKeyEditData(null);
      setOpened(false);
      setLoading(false);

      navigate(PageRoutes.KEY_LIST);
    } catch (error) {
      setLoading(false);
      console.log(error);
      errorHandler(error);
    }
  };

  useEffect(() => {
    if (loading) {
      showModalLoader({});
    } else {
      closeModalLoader();
    }
    return () => closeModalLoader();
  }, [loading]);
  return (
    <Dialog
      opened={opened}
      setOpened={setOpened}
      title="Add Key"
      size="60%"
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
                body: 'Are you sure to delete this key',
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
            label="Key Name"
            register={methods.register}
            name="KeyName"
            error={methods.formState.errors?.KeyName?.message}
          />
          <InputSelect
            label="Select Branch"
            placeholder="Select Branch"
            value={methods.watch('KeyCompanyBranchId') || ''}
            clearable
            onChange={(e) =>
              methods.setValue('KeyCompanyBranchId', e as string)
            }
            data={companyBranches.map((branches) => {
              return {
                label: branches.CompanyBranchName,
                value: branches.CompanyBranchId,
              };
            })}
            error={methods.formState.errors?.KeyCompanyBranchId?.message}
          />
          <InputWithTopHeader
            className="mx-0"
            label="Total Quantity"
            register={methods.register}
            decimalCount={0}
            name="KeyTotalQuantity"
            error={methods.formState.errors?.KeyTotalQuantity?.message}
          />
          <InputWithTopHeader
            className="mx-0"
            label="Description"
            register={methods.register}
            name="KeyDescription"
            error={methods.formState.errors?.KeyDescription?.message}
          />
        </form>
      </FormProvider>
    </Dialog>
  );
};

export default AddKeyModal;
