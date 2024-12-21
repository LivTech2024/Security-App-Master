import { FormProvider, useForm } from 'react-hook-form';
import { SettingsFormFields, settingsSchema } from '../../utilities/zod/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../utilities/TsxUtils';
import { useAuthState } from '../../store';
import DbCompany from '../../firebase_configs/DB/DbCompany';
import { errorHandler } from '../../utilities/CustomError';
import Button from '../../common/button/Button';
import InputWithTopHeader from '../../common/inputs/InputWithTopHeader';
import SwitchWithSideHeader from '../../common/switch/SwitchWithSideHeader';

const AccountSettings = () => {
  const { settings, setSettings } = useAuthState();

  const methods = useForm<SettingsFormFields>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      SettingEmpWellnessIntervalInMins:
        settings?.SettingEmpWellnessIntervalInMins || 10,
      SettingEmpShiftTimeMarginInMins:
        settings?.SettingEmpShiftTimeMarginInMins || 10,
      SettingShowAmountDueInInvoices: settings?.SettingShowAmountDueInInvoices,
    },
  });

  const onSubmit = async (data: SettingsFormFields) => {
    if (!settings) return;
    try {
      showModalLoader({});

      await DbCompany.updateSetting(settings.SettingId, data);

      setSettings({
        ...settings,
        SettingEmpWellnessIntervalInMins: data.SettingEmpWellnessIntervalInMins,
        SettingEmpShiftTimeMarginInMins: data.SettingEmpShiftTimeMarginInMins,
        SettingShowAmountDueInInvoices: data.SettingShowAmountDueInInvoices,
      });

      showSnackbar({
        message: 'Settings updated successfully',
        type: 'success',
      });

      closeModalLoader();
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
        className="flex flex-col gap-4 p-4 bg-surface shadow mt-4 rounded"
      >
        <div className="flex items-center justify-between w-full">
          <div className="font-semibold text-lg">General</div>
          <Button
            label="Save"
            type="black"
            buttonType="submit"
            onClick={methods.handleSubmit(onSubmit)}
            className="px-6 py-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <InputWithTopHeader
            className="mx-0"
            label="Wellness reminder interval (in minutes)"
            register={methods.register}
            name="SettingEmpWellnessIntervalInMins"
            error={
              methods.formState.errors?.SettingEmpWellnessIntervalInMins
                ?.message
            }
          />

          <InputWithTopHeader
            className="mx-0"
            label="Shift Time Margin (in minutes)"
            register={methods.register}
            name="SettingEmpShiftTimeMarginInMins"
            error={
              methods.formState.errors?.SettingEmpShiftTimeMarginInMins?.message
            }
          />

          <SwitchWithSideHeader
            className="mx-0 bg-onHoverBg px-4 py-2 rounded"
            label="Show Amount Due In Invoices"
            register={methods.register}
            name="SettingShowAmountDueInInvoices"
          />
        </div>
      </form>
    </FormProvider>
  );
};

export default AccountSettings;
