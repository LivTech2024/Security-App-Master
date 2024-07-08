import { FormProvider, useForm } from 'react-hook-form';
import Button from '../../common/button/Button';
import PageHeader from '../../common/PageHeader';
import {
  TrainCertsCreateFormFields,
  trainCertsCreateSchema,
} from '../../utilities/zod/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { errorHandler } from '../../utilities/CustomError';
import { useEffect, useState } from 'react';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../utilities/TsxUtils';
import { useAuthState, useEditFormStore } from '../../store';
import InputWithTopHeader from '../../common/inputs/InputWithTopHeader';
import InputSelect from '../../common/inputs/InputSelect';
import { TrainCertsCategories } from '../../@types/database';
import TextareaWithTopHeader from '../../common/inputs/TextareaWithTopHeader';
import InputDate from '../../common/inputs/InputDate';
import { removeTimeFromDate, toDate } from '../../utilities/misc';
import DbCompany from '../../firebase_configs/DB/DbCompany';
import { useNavigate } from 'react-router-dom';
import { PageRoutes } from '../../@types/enum';
import { openContextModal } from '@mantine/modals';

const TrainCertsCreateOrEdit = () => {
  const navigate = useNavigate();

  const { company } = useAuthState();

  const { trainCertsEditData } = useEditFormStore();

  const isEdit = !!trainCertsEditData;

  const methods = useForm<TrainCertsCreateFormFields>({
    resolver: zodResolver(trainCertsCreateSchema),
    defaultValues: isEdit
      ? {
          TrainCertsCategory: trainCertsEditData.TrainCertsCategory,
          TrainCertsCost: trainCertsEditData.TrainCertsCost,
          TrainCertsDescription: trainCertsEditData.TrainCertsDescription,
          TrainCertsDuration: trainCertsEditData.TrainCertsDuration,
          TrainCertsTitle: trainCertsEditData.TrainCertsTitle,
        }
      : {},
  });

  const [loading, setLoading] = useState(false);

  const [startDate, setStartDate] = useState<Date | null>(null);

  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    setStartDate(toDate(trainCertsEditData.TrainCertsStartDate));
    setEndDate(toDate(trainCertsEditData.TrainCertsEndDate));
  }, [isEdit]);

  useEffect(() => {
    if (startDate) {
      methods.setValue('TrainCertsStartDate', removeTimeFromDate(startDate));
    }
  }, [startDate]);

  useEffect(() => {
    if (endDate) {
      methods.setValue('TrainCertsEndDate', removeTimeFromDate(endDate));
    }
  }, [endDate]);

  const onSubmit = async (data: TrainCertsCreateFormFields) => {
    if (!company) return;
    try {
      setLoading(true);

      if (isEdit) {
        await DbCompany.updateTrainCerts(data, trainCertsEditData.TrainCertsId);

        showSnackbar({
          message: 'Training & Certifications updated successfully',
          type: 'success',
        });
      } else {
        await DbCompany.createTrainCerts(data, company.CompanyId);

        showSnackbar({
          message: 'Training & Certifications created successfully',
          type: 'success',
        });
      }

      setLoading(false);

      navigate(PageRoutes.TRAINING_AND_CERTIFICATION_LIST);
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

      await DbCompany.deleteTrainCerts(trainCertsEditData.TrainCertsId);

      showSnackbar({
        message: 'Training & Certification deleted successfully',
        type: 'success',
      });

      setLoading(false);
      navigate(PageRoutes.TRAINING_AND_CERTIFICATION_LIST);
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
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="flex flex-col w-full h-full p-6 gap-6"
      >
        <PageHeader
          title="Create Training & Certification"
          rightSection={
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
                        body: 'Are you sure to delete this training & certification',
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
                />
              )}
              <Button
                label="Save"
                type="black"
                onClick={methods.handleSubmit(onSubmit)}
                buttonType="submit"
              />
            </div>
          }
        />

        <div className="grid grid-cols-3 gap-4 p-4 bg-surface shadow rounded">
          <InputWithTopHeader
            className="mx-0"
            label="Title"
            register={methods.register}
            name="TrainCertsTitle"
            error={methods.formState.errors.TrainCertsTitle?.message}
          />
          <InputSelect
            label="Category"
            data={[
              {
                label: TrainCertsCategories.TECHNICAL,
                value: TrainCertsCategories.TECHNICAL,
              },
              {
                label: TrainCertsCategories.COMPLIANCE,
                value: TrainCertsCategories.COMPLIANCE,
              },
              {
                label: TrainCertsCategories.SAFETY,
                value: TrainCertsCategories.SAFETY,
              },
            ]}
            value={methods.watch('TrainCertsCategory')}
            onChange={(e) =>
              methods.setValue('TrainCertsCategory', e as TrainCertsCategories)
            }
            error={methods.formState.errors.TrainCertsCategory?.message}
          />

          <InputWithTopHeader
            className="mx-0"
            label="Duration"
            register={methods.register}
            name="TrainCertsDuration"
            error={methods.formState.errors.TrainCertsDuration?.message}
          />
          <InputDate
            label="Start Date"
            value={startDate}
            setValue={setStartDate}
            error={methods.formState.errors.TrainCertsStartDate?.message}
          />
          <InputDate
            label="End Date"
            value={endDate}
            setValue={setEndDate}
            error={methods.formState.errors.TrainCertsEndDate?.message}
          />
          <InputWithTopHeader
            className="mx-0"
            label="Cost"
            register={methods.register}
            name="TrainCertsCost"
            error={methods.formState.errors.TrainCertsCost?.message}
            leadingIcon={<div>$</div>}
          />
          <TextareaWithTopHeader
            className="mx-0"
            title="Description"
            register={methods.register}
            name="TrainCertsDescription"
            error={methods.formState.errors.TrainCertsDescription?.message}
          />
        </div>
      </form>
    </FormProvider>
  );
};

export default TrainCertsCreateOrEdit;
