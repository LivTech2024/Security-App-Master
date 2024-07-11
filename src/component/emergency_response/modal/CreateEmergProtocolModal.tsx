import { FormProvider, useForm } from 'react-hook-form';
import Dialog from '../../../common/Dialog';
import {
  EmergProtocolCreateFormFields,
  emergProtocolCreateSchema,
} from '../../../utilities/zod/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { errorHandler } from '../../../utilities/CustomError';
import { closeModalLoader, showModalLoader } from '../../../utilities/TsxUtils';
import InputWithTopHeader from '../../../common/inputs/InputWithTopHeader';
import TextareaWithTopHeader from '../../../common/inputs/TextareaWithTopHeader';
import DbCompany from '../../../firebase_configs/DB/DbCompany';
import { useAuthState } from '../../../store';

const CreateEmergProtocolModal = ({
  opened,
  setOpened,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { company } = useAuthState();

  const methods = useForm<EmergProtocolCreateFormFields>({
    resolver: zodResolver(emergProtocolCreateSchema),
  });

  const [loading, setLoading] = useState(false);

  const [video, setVideo] = useState<File | string | null>(null);

  const onSubmit = async (data: EmergProtocolCreateFormFields) => {
    if (!company) return;
    try {
      setLoading(true);

      await DbCompany.createEmergProtocol({
        cmpId: company.CompanyId,
        data,
        video: typeof video !== 'string' ? video : null,
      });

      setLoading(false);
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
            {/* {isEdit && <div className="font-semibold">Upload new file</div>} */}
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
