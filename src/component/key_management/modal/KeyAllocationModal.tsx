import {
  KeyAllocationFormFields,
  keyAllocationSchema,
} from '../../../utilities/zod/schema';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthState, useEditFormStore } from '../../../store';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import useFetchKeys from '../../../hooks/fetch/useFetchKeys';
import DbAssets from '../../../firebase_configs/DB/DbAssets';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../../utilities/TsxUtils';
import { REACT_QUERY_KEYS } from '../../../@types/enum';
import { errorHandler } from '../../../utilities/CustomError';
import Dialog from '../../../common/Dialog';
import { openContextModal } from '@mantine/modals';
import InputSelect from '../../../common/inputs/InputSelect';
import { AiOutlinePlus } from 'react-icons/ai';
import InputWithTopHeader from '../../../common/inputs/InputWithTopHeader';

const KeyAllocationModal = ({
  opened,
  setOpened,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const methods = useForm<KeyAllocationFormFields>({
    resolver: zodResolver(keyAllocationSchema),
  });

  const { equipAllocationEditData, setEquipAllocationEditData } =
    useEditFormStore();

  const isEdit = !!equipAllocationEditData;

  const queryClient = useQueryClient();

  const { company } = useAuthState();

  const [equipSearchQuery, setEquipSearchQuery] = useState('');

  const { data: keys } = useFetchKeys({
    limit: 5,
    searchQuery: equipSearchQuery,
  });

  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: KeyAllocationFormFields) => {
    if (!company) return;
    try {
      setLoading(true);

      if (isEdit) {
        await DbAssets.updateKeyAllocation(
          equipAllocationEditData?.EquipmentAllocationId,
          data
        );
        showSnackbar({
          message: 'Key allocation updated successfully',
          type: 'success',
        });
      } else {
        await DbAssets.createKeyAllocation(data);
        showSnackbar({
          message: 'Key allocation done successfully',
          type: 'success',
        });
      }

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.EQUIPMENT_LIST],
      });

      setEquipAllocationEditData(null);
      setLoading(false);
      setOpened(false);
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

      await DbAssets.deleteEquipAllocation(
        equipAllocationEditData.EquipmentAllocationId
      );

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.EQUIPMENT_LIST],
      });

      showSnackbar({
        message: 'Equipment deleted successfully',
        type: 'success',
      });

      setEquipAllocationEditData(null);
      setOpened(false);
      setLoading(false);
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
      title="Allocate key"
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
                body: 'Are you sure to delete this key allocation',
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
          <InputSelect
            label="Select key"
            data={keys.map((key) => {
              return { label: key.KeyName, value: key.KeyId };
            })}
            value={methods.watch('KeyAllocationKeyId')}
            onChange={(e) => {
              methods.setValue('KeyAllocationKeyId', e as string);
            }}
            nothingFoundMessage={
              <div
                onClick={() => {
                  setOpened(false);
                }}
                className="bg-primaryGold text-surface font-medium p-2 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <AiOutlinePlus size={18} />
                  <span>Add new key</span>
                </div>
              </div>
            }
            searchable
            searchValue={equipSearchQuery}
            onSearchChange={setEquipSearchQuery}
            error={methods.formState?.errors?.KeyAllocationKeyId?.message}
          />

          <InputWithTopHeader
            className="mx-0"
            label="Recipient Name"
            register={methods.register}
            name="KeyAllocationRecipientName"
            error={methods.formState.errors.KeyAllocationRecipientName?.message}
          />
          <InputWithTopHeader
            className="mx-0"
            label="Recipient Contact"
            register={methods.register}
            name="KeyAllocationRecipientContact"
            error={
              methods.formState.errors.KeyAllocationRecipientContact?.message
            }
          />
          <InputWithTopHeader
            className="mx-0"
            label="Recipient Company (Optional)"
            register={methods.register}
            name="KeyAllocationRecipientCompany"
            error={
              methods.formState.errors.KeyAllocationRecipientCompany?.message
            }
          />
        </form>
      </FormProvider>
    </Dialog>
  );
};

export default KeyAllocationModal;
