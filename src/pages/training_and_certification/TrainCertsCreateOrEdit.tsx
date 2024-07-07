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
import { closeModalLoader, showModalLoader } from '../../utilities/TsxUtils';
import { useAuthState } from '../../store';
import InputWithTopHeader from '../../common/inputs/InputWithTopHeader';
import InputSelect from '../../common/inputs/InputSelect';
import { TrainCertsCategories } from '../../@types/database';
import TextareaWithTopHeader from '../../common/inputs/TextareaWithTopHeader';
import InputDate from '../../common/inputs/InputDate';
import { removeTimeFromDate } from '../../utilities/misc';

const TrainCertsCreateOrEdit = () => {
  const { company } = useAuthState();

  const methods = useForm<TrainCertsCreateFormFields>({
    resolver: zodResolver(trainCertsCreateSchema),
  });

  const [loading, setLoading] = useState(false);

  const [startDate, setStartDate] = useState<Date | null>(null);

  const [endDate, setEndDate] = useState<Date | null>(null);

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

      console.log(data);

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
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="flex flex-col w-full h-full p-6 gap-6"
      >
        <PageHeader
          title="Create Training & Certification"
          rightSection={
            <div className="flex items-center gap-4">
              <Button
                label="Save"
                type="black"
                onClick={() => {}}
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
