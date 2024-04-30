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
import InputDate from '../../../common/inputs/InputDate';
import TextareaWithTopHeader from '../../../common/inputs/TextareaWithTopHeader';
import dayjs from 'dayjs';
import { toDate } from '../../../utilities/misc';

const KeyAllocationModal = ({
  opened,
  setOpened,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { keyAllocationEditData, setKeyAllocationEditData } =
    useEditFormStore();

  const isEdit = !!keyAllocationEditData;

  const methods = useForm<KeyAllocationFormFields>({
    resolver: zodResolver(keyAllocationSchema),
  });

  const queryClient = useQueryClient();

  const { company } = useAuthState();

  const [equipSearchQuery, setEquipSearchQuery] = useState('');

  const { data: keys } = useFetchKeys({
    limit: 5,
    searchQuery: equipSearchQuery,
  });

  const [loading, setLoading] = useState(false);

  const [allocDate, setAllocDate] = useState<Date | null>(new Date());

  const [allocStartTime, setAllocStartTime] = useState<Date | null>(null);

  const [allocEndTime, setAllocEndTime] = useState<Date | null>(null);

  useEffect(() => {
    if (!allocDate) return;
    methods.setValue('KeyAllocationDate', allocDate);
  }, [allocDate]);

  useEffect(() => {
    if (!allocStartTime) return;
    methods.setValue('KeyAllocationStartTime', allocStartTime);
    if (allocEndTime && dayjs(allocStartTime).isAfter(allocEndTime, 'minute')) {
      methods.setError('KeyAllocationStartTime', {
        message: 'Start time cannot be greater than end time',
      });
    }
  }, [allocStartTime]);

  useEffect(() => {
    if (!allocEndTime) return;
    methods.setValue('KeyAllocationEndTime', allocEndTime);
    if (
      allocStartTime &&
      dayjs(allocEndTime).isBefore(allocStartTime, 'minute')
    ) {
      methods.setError('KeyAllocationEndTime', {
        message: 'End time cannot be smaller than start time',
      });
    }
  }, [allocEndTime]);

  //*Populate data on edit
  useEffect(() => {
    let allFormFields: Partial<KeyAllocationFormFields> = {
      KeyAllocationKeyId: '',
      KeyAllocationKeyQty: 0,
      KeyAllocationRecipientName: '',
      KeyAllocationRecipientContact: '',
      KeyAllocationPurpose: '',
    };
    setAllocDate(new Date());
    setAllocStartTime(null);
    setAllocEndTime(null);
    if (isEdit) {
      allFormFields = {
        KeyAllocationKeyId: keyAllocationEditData.KeyAllocationKeyId,
        KeyAllocationKeyQty: keyAllocationEditData.KeyAllocationKeyQty,
        KeyAllocationPurpose: keyAllocationEditData.KeyAllocationPurpose,
        KeyAllocationRecipientCompany:
          keyAllocationEditData.KeyAllocationRecipientCompany,
        KeyAllocationRecipientContact:
          keyAllocationEditData.KeyAllocationRecipientContact,
        KeyAllocationRecipientName:
          keyAllocationEditData.KeyAllocationRecipientName,
      };

      setAllocDate(toDate(keyAllocationEditData.KeyAllocationDate));
      setAllocStartTime(toDate(keyAllocationEditData.KeyAllocationStartTime));
      setAllocEndTime(toDate(keyAllocationEditData.KeyAllocationEndTime));
    }
    methods.reset(allFormFields);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, keyAllocationEditData, opened]);

  const onSubmit = async (data: KeyAllocationFormFields) => {
    if (!company) return;
    try {
      setLoading(true);

      if (isEdit) {
        await DbAssets.updateKeyAllocation(
          keyAllocationEditData?.KeyAllocationId,
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
        queryKey: [REACT_QUERY_KEYS.KEY_LIST],
      });

      setKeyAllocationEditData(null);
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

      await DbAssets.deleteKeyAllocation(keyAllocationEditData.KeyAllocationId);

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.KEY_ALLOCATION],
      });

      showSnackbar({
        message: 'Key allocation deleted successfully',
        type: 'success',
      });

      setKeyAllocationEditData(null);
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

          <InputDate
            label="Date"
            value={allocDate}
            setValue={setAllocDate}
            error={methods.formState.errors.KeyAllocationDate?.message}
          />
          <InputWithTopHeader
            className="mx-0"
            label="Allocation QTY"
            register={methods.register}
            decimalCount={0}
            name="KeyAllocationKeyQty"
            error={methods.formState.errors.KeyAllocationKeyQty?.message}
          />

          <InputDate
            type="date_time"
            label="Start Time"
            value={allocStartTime}
            setValue={setAllocStartTime}
            error={methods.formState.errors.KeyAllocationStartTime?.message}
          />
          <InputDate
            type="date_time"
            label="End Time"
            value={allocEndTime}
            setValue={setAllocEndTime}
            error={methods.formState.errors.KeyAllocationEndTime?.message}
          />

          <TextareaWithTopHeader
            className="mx-0 col-span-2"
            title="Allocation Purpose"
            register={methods.register}
            name="KeyAllocationPurpose"
            error={methods.formState.errors.KeyAllocationPurpose?.message}
          />
        </form>
      </FormProvider>
    </Dialog>
  );
};

export default KeyAllocationModal;
