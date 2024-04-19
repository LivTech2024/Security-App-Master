import { FaMoneyBillWave } from 'react-icons/fa'
import InputWithTopHeader from '../../common/inputs/InputWithTopHeader'
import { IEmpBankDetails } from '../../@types/database'
import { ChangeEvent } from 'react'

const EmpBankDetails = ({
  empBankDetails,
  setEmpBankDetails,
}: {
  empBankDetails: IEmpBankDetails
  setEmpBankDetails: React.Dispatch<React.SetStateAction<IEmpBankDetails>>
}) => {
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setEmpBankDetails((prev) => {
          return {
            ...prev,
            BankVoidCheckImg: reader.result as string,
          } as IEmpBankDetails
        })
      }
      reader.readAsDataURL(file)
    }
  }
  return (
    <div className="flex flex-col gap-4">
      <label
        htmlFor="img"
        className="flex flex-col items-center border border-dashed border-black rounded-md p-4 cursor-pointer"
      >
        {empBankDetails?.BankVoidCheckImg ? (
          <img
            src={empBankDetails?.BankVoidCheckImg}
            alt={'Void check'}
            className="w-full max-h-[200px] rounded"
          />
        ) : (
          <>
            <FaMoneyBillWave className="text-3xl" />
            <span className="text-textPrimaryBlue cursor-pointer">
              Upload void check
            </span>
          </>
        )}
        <input
          id="img"
          type="file"
          accept="image/*"
          hidden
          className="hidden"
          onChange={handleImageUpload}
        />
      </label>
      {/* Bank details form */}
      <div className="grid grid-cols-2 gap-4">
        <InputWithTopHeader
          className="mx-0"
          label="Account Number"
          value={empBankDetails?.BankAccNumber}
          onChange={(e) =>
            setEmpBankDetails((prev) => {
              return {
                ...prev,
                BankAccNumber: e.target.value,
              } as IEmpBankDetails
            })
          }
        />
        <InputWithTopHeader
          className="mx-0"
          label="Transit Number"
          value={empBankDetails?.BankTransitNumber}
          onChange={(e) =>
            setEmpBankDetails((prev) => {
              return {
                ...prev,
                BankTransitNumber: e.target.value,
              } as IEmpBankDetails
            })
          }
        />
        <InputWithTopHeader
          className="mx-0"
          label="Institution Number"
          value={empBankDetails?.BankInstitutionNumber}
          onChange={(e) =>
            setEmpBankDetails((prev) => {
              return {
                ...prev,
                BankInstitutionNumber: e.target.value,
              } as IEmpBankDetails
            })
          }
        />
      </div>
    </div>
  )
}

export default EmpBankDetails
