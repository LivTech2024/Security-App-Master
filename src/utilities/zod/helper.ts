import { z } from 'zod'

interface Props {
  message: string
  defaultValue?: number
  optional?: boolean // default value will be null if optional is true
}

export const numberString = ({
  message,
  defaultValue,
  optional = false,
}: Props) => {
  if (optional && defaultValue) {
    return z
      .string()
      .regex(/^(0|[1-9]\d*)(\.\d+)?$/, { message })
      .transform(Number)
      .nullable()
      .catch(defaultValue)
  }

  if (defaultValue) {
    return z
      .string()
      .regex(/^(0|[1-9]\d*)(\.\d+)?$/, { message })
      .default(String(defaultValue))
      .transform(Number)
  }

  if (optional) {
    return z
      .string()
      .regex(/^(0|[1-9]\d*)(\.\d+)?$/, { message })
      .transform(Number)
      .nullable()
      .catch(null)
  }

  return z
    .string()
    .regex(/^(0|[1-9]\d*)(\.\d+)?$/, { message })
    .transform(Number)
}

export const optionalString = z
  .string()
  .trim()
  .optional()
  .nullable()
  .default(null)
  .transform((value) => (value === '' ? null : value)) // need this line because when registering input field with hook form the default value become empty string
