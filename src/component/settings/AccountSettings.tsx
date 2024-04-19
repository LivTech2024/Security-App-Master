import { FormProvider, useForm } from 'react-hook-form'
import { SettingsFormFields, settingsSchema } from '../../utilities/zod/schema'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../utilities/TsxUtils'
import { useAuthState } from '../../store'
import DbCompany from '../../firebase_configs/DB/DbCompany'
import { errorHandler } from '../../utilities/CustomError'
import Button from '../../common/button/Button'
import InputWithTopHeader from '../../common/inputs/InputWithTopHeader'

const AccountSettings = () => {
  const { settings, setSettings } = useAuthState()

  const methods = useForm<SettingsFormFields>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      SettingEmpWellnessIntervalInMins:
        settings?.SettingEmpWellnessIntervalInMins || 10,
    },
  })

  const onSubmit = async (data: SettingsFormFields) => {
    if (!settings) return
    try {
      showModalLoader({})

      await DbCompany.updateSetting(settings.SettingId, data)

      setSettings({
        ...settings,
        SettingEmpWellnessIntervalInMins: data.SettingEmpWellnessIntervalInMins,
      })

      showSnackbar({
        message: 'Settings updated successfully',
        type: 'success',
      })

      closeModalLoader()
    } catch (error) {
      console.log(error)
      errorHandler(error)
      closeModalLoader()
    }
  }
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
        <InputWithTopHeader
          className="mx-0 w-fit"
          label="Wellness reminder interval (in minutes)"
          register={methods.register}
          name="SettingEmpWellnessIntervalInMins"
          error={
            methods.formState.errors?.SettingEmpWellnessIntervalInMins?.message
          }
        />
      </form>
    </FormProvider>
  )
}

export default AccountSettings
