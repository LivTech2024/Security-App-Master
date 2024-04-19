import { DeepMap, FieldError, Path, UseFormRegister } from 'react-hook-form'

interface SwitchWithSideHeaderProps<
  FormFields extends Record<string, unknown>,
> {
  label?: string
  className?: string
  checked?: boolean
  onChange?: () => void
  register?: UseFormRegister<FormFields>
  name?: Path<FormFields>
  disabled?: boolean
  errors?: Partial<DeepMap<FormFields, FieldError>>
}
const SwitchWithSideHeader = <FormFields extends Record<string, unknown>>({
  label,
  className,
  checked,
  onChange,
  disabled = false,
  register,
  name,
}: SwitchWithSideHeaderProps<FormFields>) => {
  return (
    <label className={`${className} cursor-pointer`}>
      <div className="flex items-center">
        <div className={`ml-auto order-2 `}>
          {register && name ? (
            <input
              {...register(name)}
              type="checkbox"
              checked={checked}
              disabled={disabled}
              onChange={onChange}
              className="sr-only peer order-2"
            />
          ) : (
            <input
              type="checkbox"
              checked={checked}
              onChange={onChange}
              disabled={disabled}
              className="sr-only peer order-2"
            />
          )}

          <div className="w-7 h-3 relative bg-switchBg rounded-full peer shadow-md after:shadow-lg  peer-checked:after:translate-x-full  after:content-[''] after:absolute after:-top-[2px] after:left-[-0.6px] after:bg-tableOddColor  after:rounded-full after:h-4 after:w-4 after:transition-all  peer-checked:bg-switchSecondaryBlueBg peer-checked:after:bg-switchPrimaryBlueBg"></div>
        </div>
        {label && <div className=" order-1 w-[80%]">{label}</div>}
      </div>
    </label>
  )
}

export default SwitchWithSideHeader
