import { FormProvider, useForm } from 'react-hook-form';
import Dialog from '../../../common/Dialog';
import {
  EmergProtocolCreateFormFields,
  emergProtocolCreateSchema,
} from '../../../utilities/zod/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { errorHandler } from '../../../utilities/CustomError';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../../utilities/TsxUtils';
import InputWithTopHeader from '../../../common/inputs/InputWithTopHeader';
import TextareaWithTopHeader from '../../../common/inputs/TextareaWithTopHeader';
import DbCompany from '../../../firebase_configs/DB/DbCompany';
import { useAuthState, useEditFormStore } from '../../../store';
import { openContextModal } from '@mantine/modals';
import { useQueryClient } from '@tanstack/react-query';
import { REACT_QUERY_KEYS } from '../../../@types/enum';

const CreateEmergProtocolModal = ({
  opened,
  setOpened,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { company } = useAuthState();

  const { emergProtocolEditData } = useEditFormStore();

  const isEdit = !!emergProtocolEditData;

  const methods = useForm<EmergProtocolCreateFormFields>({
    resolver: zodResolver(emergProtocolCreateSchema),
  });

  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);

  const [video, setVideo] = useState<File | string | null>(null);

  useEffect(() => {
    let formDefaultValues: EmergProtocolCreateFormFields = {
      EmergProtocolDescription: '',
      EmergProtocolTitle: '',
    };
    setVideo(null);

    if (isEdit) {
      formDefaultValues = {
        EmergProtocolDescription:
          emergProtocolEditData.EmergProtocolDescription,
        EmergProtocolTitle: emergProtocolEditData.EmergProtocolTitle,
      };
      setVideo(emergProtocolEditData.EmergProtocolVideo);
    }

    methods.reset(formDefaultValues);
  }, [isEdit, opened]);

  const onSubmit = async (data: EmergProtocolCreateFormFields) => {
    if (!company) return;
    try {
      setLoading(true);

      if (isEdit) {
        await DbCompany.updateEmergProtocol({
          emergProtocolId: emergProtocolEditData.EmergProtocolId,
          data,
          video,
        });

        showSnackbar({
          message: 'Emergency protocol updated successfully',
          type: 'success',
        });
      } else {
        await DbCompany.createEmergProtocol({
          cmpId: company.CompanyId,
          data,
          video: typeof video !== 'string' ? video : null,
        });

        showSnackbar({
          message: 'Emergency protocol created successfully',
          type: 'success',
        });
      }

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.EMERG_PROTOCOLS_LIST],
      });

      setLoading(false);
      setOpened(false);
    } catch (error) {
      console.log(error);
      errorHandler(error);
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!isEdit) return;

    try {
      setLoading(true);

      await DbCompany.deleteEmergProtocol(
        emergProtocolEditData.EmergProtocolId
      );
      showSnackbar({
        message: 'Emergency protocol deleted successfully',
        type: 'success',
      });

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.EMERG_PROTOCOLS_LIST],
      });

      setLoading(false);
      setOpened(false);
    } catch (error) {
      console.log(error);
      errorHandler(error);
      setLoading(false);
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
      title="Create new emergency protocol"
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
                body: 'Are you sure to delete this protocol',
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
          className="grid grid-cols-1 gap-4"
        >
          <InputWithTopHeader
            className="mx-0"
            label="Title"
            register={methods.register}
            name="EmergProtocolTitle"
            error={methods.formState.errors?.EmergProtocolTitle?.message}
          />
          <TextareaWithTopHeader
            className="mx-0"
            title="Description"
            register={methods.register}
            name="EmergProtocolDescription"
            error={methods.formState.errors?.EmergProtocolDescription?.message}
          />

          <label
            htmlFor="fileUpload"
            className=" items-center gap-4 col-span-1 grid grid-cols-2"
          >
            {isEdit && emergProtocolEditData.EmergProtocolVideo && (
              <div className="font-semibold">Upload new file</div>
            )}
            <input
              id="fileUpload"
              type="file"
              accept="video/mp4,video/x-m4v,video/*"
              className={`border border-gray-300 p-2 rounded `}
              onChange={(e) => setVideo(e.target.files?.[0] as File)}
            />
          </label>
        </form>
      </FormProvider>
    </Dialog>
  );
};

export default CreateEmergProtocolModal;
