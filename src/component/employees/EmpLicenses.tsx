import React, { ChangeEvent } from 'react'
import { EmpLicenseDetails } from './EmployeeOtherDetails'
import InputWithTopHeader from '../../common/inputs/InputWithTopHeader'
import InputDate from '../../common/inputs/InputDate'

const EmpLicenses = ({
  empLicenseDetails,
  setEmpLicenseDetails,
}: {
  empLicenseDetails: EmpLicenseDetails[]
  setEmpLicenseDetails: React.Dispatch<
    React.SetStateAction<EmpLicenseDetails[]>
  >
}) => {
  const handleChangeLicenseNumber = (
    licenseType: 'driving' | 'security',
    newLicenseNumber: string
  ) => {
    setEmpLicenseDetails((prev) => {
      const existingLicense = prev.find(
        (detail) => detail.LicenseType === licenseType
      )
      if (existingLicense) {
        const updatedLicenseDetails = prev.map((detail) => {
          if (detail.LicenseType === licenseType) {
            return { ...detail, LicenseNumber: newLicenseNumber }
          }
          return detail
        })
        return updatedLicenseDetails
      } else {
        return [
          ...prev,
          {
            LicenseType: licenseType,
            LicenseNumber: newLicenseNumber,
            LicenseExpDate: null,
            LicenseImg: null,
          },
        ]
      }
    })
  }

  const handleChangeExpDate = (
    licenseType: 'driving' | 'security',
    newExpDate: Date
  ) => {
    setEmpLicenseDetails((prev) => {
      const existingLicense = prev.find(
        (detail) => detail.LicenseType === licenseType
      )
      if (existingLicense) {
        const updatedLicenseDetails = prev.map((detail) => {
          if (detail.LicenseType === licenseType) {
            return {
              ...detail,
              LicenseExpDate: newExpDate,
            }
          }
          return detail
        })
        return updatedLicenseDetails
      } else {
        return [
          ...prev,
          {
            LicenseType: licenseType,
            LicenseNumber: '',
            LicenseExpDate: newExpDate,
            LicenseImg: null,
          },
        ]
      }
    })
  }

  const handleChangeImg = (
    licenseType: 'driving' | 'security',
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setEmpLicenseDetails((prev) => {
          const existingLicense = prev.find(
            (detail) => detail.LicenseType === licenseType
          )
          if (existingLicense) {
            const updatedLicenseDetails = prev.map((detail) => {
              if (detail.LicenseType === licenseType) {
                return {
                  ...detail,
                  LicenseImg: reader.result as string,
                }
              }
              return detail
            })
            return updatedLicenseDetails
          } else {
            return [
              ...prev,
              {
                LicenseType: licenseType,
                LicenseNumber: '',
                LicenseExpDate: null,
                LicenseImg: reader.result as string,
              },
            ]
          }
        })
      }
      reader.readAsDataURL(file)
    }
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <InputWithTopHeader
          className="mx-0 w-full"
          label="Security license no."
          value={
            empLicenseDetails
              .find((l) => l.LicenseType === 'security')
              ?.LicenseNumber.toString() || ''
          }
          onChange={(e) =>
            handleChangeLicenseNumber('security', e.target.value)
          }
        />
        <InputDate
          label="Exp. Date"
          value={
            empLicenseDetails.find((l) => l.LicenseType === 'security')
              ?.LicenseExpDate
          }
          id="exp1"
          setValue={(e) => handleChangeExpDate('security', e as Date)}
        />
        <label htmlFor="image_security" className="cursor-pointer col-span-2">
          {empLicenseDetails
            .find((l) => l.LicenseType === 'security')
            ?.LicenseImg?.startsWith('https') && (
            <div className="flex items-center justify-between">
              <a
                href={
                  empLicenseDetails.find((l) => l.LicenseType === 'security')
                    ?.LicenseImg || '#'
                }
                target="_blank"
                className=" text-textPrimaryBlue cursor-pointer mt-1"
              >
                Click here to view license img
              </a>
              <label
                htmlFor="image_security"
                className="cursor-pointer text-textPrimaryBlue"
              >
                Click here to upload new
              </label>
            </div>
          )}
          <input
            id="image_security"
            type="file"
            accept="image/*"
            className={`border border-gray-300 p-2 rounded ${
              empLicenseDetails
                .find((l) => l.LicenseType === 'security')
                ?.LicenseImg?.startsWith('https') && 'hidden'
            }`}
            onChange={(e) => handleChangeImg('security', e)}
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <InputWithTopHeader
          className="mx-0 w-full"
          label="Driving license no."
          value={
            empLicenseDetails
              .find((l) => l.LicenseType === 'driving')
              ?.LicenseNumber.toString() || ''
          }
          onChange={(e) => handleChangeLicenseNumber('driving', e.target.value)}
        />
        <InputDate
          label="Exp. Date"
          value={
            empLicenseDetails.find((l) => l.LicenseType === 'driving')
              ?.LicenseExpDate
          }
          id="exp2"
          setValue={(e) => handleChangeExpDate('driving', e as Date)}
        />
        <label htmlFor="image_driving" className="cursor-pointer col-span-2">
          {empLicenseDetails
            .find((l) => l.LicenseType === 'driving')
            ?.LicenseImg?.startsWith('https') && (
            <div className="flex items-center justify-between">
              <a
                href={
                  empLicenseDetails.find((l) => l.LicenseType === 'driving')
                    ?.LicenseImg || '#'
                }
                target="_blank"
                className=" text-textPrimaryBlue cursor-pointer mt-1"
              >
                Click here to view license img
              </a>
              <label
                htmlFor="image_driving"
                className="cursor-pointer text-textPrimaryBlue"
              >
                Click here to upload new
              </label>
            </div>
          )}
          <input
            id="image_driving"
            type="file"
            accept="image/*"
            className={`border border-gray-300 p-2 rounded ${
              empLicenseDetails
                .find((l) => l.LicenseType === 'driving')
                ?.LicenseImg?.startsWith('https') && 'hidden'
            }`}
            onChange={(e) => handleChangeImg('driving', e)}
          />
        </label>
      </div>
    </div>
  )
}

export default EmpLicenses
