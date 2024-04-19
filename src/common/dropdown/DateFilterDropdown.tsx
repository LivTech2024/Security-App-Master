import dayjs from 'dayjs'
import React, { useState } from 'react'
import { GoCalendar } from 'react-icons/go'
import { MdArrowDropDown } from 'react-icons/md'
import PopupMenu from '../PopupMenu'
import { formatDateRange } from '../../utilities/misc'
import Dialog from '../Dialog'
import InputDate from '../inputs/InputDate'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'

interface DateFilterPopupProps {
  startDate: Date | string | null
  setStartDate: React.Dispatch<React.SetStateAction<Date | string | null>>
  endDate: Date | string | null
  setEndDate: React.Dispatch<React.SetStateAction<Date | string | null>>
  isLifetime: boolean
  setIsLifetime: React.Dispatch<React.SetStateAction<boolean>>
}

dayjs.extend(quarterOfYear)

const DateFilterDropdown = ({
  isLifetime,
  endDate,
  setEndDate,
  setIsLifetime,
  setStartDate,
  startDate,
}: DateFilterPopupProps) => {
  const [dateFilterDropdown, setDateFilterDropdown] = useState(false)

  const [customDateRangeModal, setCustomDateRangeModal] = useState(false)

  const [value, setValue] = useState<[Date | null, Date | null]>([
    dayjs().startOf('month').toDate(),
    dayjs().endOf('month').toDate(),
  ])

  const customDateRange = () => {
    const invalid = value.find((i) => i === null)
    if (!value[0] || !value[1] || invalid) return
    setIsLifetime(false)
    setStartDate(dayjs(value[0]).toDate())
    setEndDate(dayjs(value[1]).toDate())
  }

  return (
    <>
      <PopupMenu
        opened={dateFilterDropdown}
        setOpened={setDateFilterDropdown}
        position="bottom"
        width="target"
        target={
          <div
            onClick={() => setDateFilterDropdown(!dateFilterDropdown)}
            className="px-2 py-[4px] flex text-[14px]  w-full max-w-sm  justify-center  border border-inputBorder  rounded cursor-pointer"
          >
            <div className="flex gap-1 items-center  font-medium whitespace-nowrap">
              <div>
                <GoCalendar size={20} />
              </div>
              {isLifetime ? (
                <div className="ml-2">All</div>
              ) : (
                <>
                  <div className="ml-2">
                    {startDate &&
                      endDate &&
                      formatDateRange({
                        startDateString: startDate?.toString(),
                        endDateString: endDate?.toString(),
                      })}
                  </div>
                </>
              )}
              <div>
                <MdArrowDropDown size={22} />
              </div>
            </div>
            <div className="ml-auto  font-semibold   line-clamp-1 leading-6">
              Select date range
            </div>
          </div>
        }
      >
        <div className="flex flex-col items-start">
          <span
            onClick={() => {
              setDateFilterDropdown(false)
              setStartDate(dayjs().startOf('D').toDate())
              setEndDate(dayjs().endOf('D').toDate())
              setIsLifetime(false)
            }}
            className="px-4 py-[8px] w-full text-sm cursor-pointer hover:bg-onHoverBg capitalize"
          >
            today
          </span>
          <span
            onClick={() => {
              setDateFilterDropdown(false)
              setStartDate(dayjs().subtract(1, 'day').startOf('day').toDate())
              setEndDate(dayjs().subtract(1, 'day').endOf('day').toDate())
              setIsLifetime(false)
            }}
            className="px-4 py-[8px] w-full text-sm cursor-pointer hover:bg-onHoverBg capitalize"
          >
            Yesterday
          </span>

          <span
            onClick={() => {
              setDateFilterDropdown(false)
              setStartDate(dayjs().startOf('week').toDate())
              setEndDate(dayjs().endOf('week').toDate())
              setIsLifetime(false)
            }}
            className="px-4 py-[8px] w-full text-sm cursor-pointer hover:bg-onHoverBg capitalize"
          >
            This week
          </span>

          <span
            onClick={() => {
              setDateFilterDropdown(false)
              setStartDate(dayjs().startOf('M').toDate())
              setEndDate(dayjs().endOf('M').toDate())
              setIsLifetime(false)
            }}
            className="px-4 py-[8px] w-full text-sm cursor-pointer hover:bg-onHoverBg capitalize"
          >
            This month
          </span>
          <span
            onClick={() => {
              setDateFilterDropdown(false)
              setStartDate(dayjs().startOf('Q').toDate())
              setEndDate(dayjs().endOf('Q').toDate())
              setIsLifetime(false)
            }}
            className="px-4 py-[8px] w-full text-sm cursor-pointer hover:bg-onHoverBg capitalize"
          >
            this quarter
          </span>
          <span
            onClick={() => {
              setDateFilterDropdown(false)
              setStartDate(dayjs().startOf('year').toDate())
              setEndDate(dayjs().endOf('year').toDate())
              setIsLifetime(false)
            }}
            className="px-4 py-[8px] w-full text-sm cursor-pointer hover:bg-onHoverBg capitalize"
          >
            this year
          </span>
          <span
            onClick={() => {
              setDateFilterDropdown(false)
              setIsLifetime(true)
            }}
            className="px-4 py-[8px] w-full text-sm cursor-pointer hover:bg-onHoverBg capitalize"
          >
            all
          </span>
          <span
            onClick={() => {
              setDateFilterDropdown(false)
              setCustomDateRangeModal(true)
            }}
            className="px-4 py-[8px] w-full text-sm cursor-pointer hover:bg-onHoverBg capitalize"
          >
            custom
          </span>
        </div>
      </PopupMenu>
      <div className="hidden ">
        <Dialog
          size="auto"
          opened={customDateRangeModal}
          setOpened={setCustomDateRangeModal}
          title="Select custom date range"
          positiveCallback={customDateRange}
          disableSubmit={!value[0] || !value[1]}
        >
          <InputDate type="range" rangeValue={value} rangeOnChange={setValue} />
        </Dialog>
      </div>
    </>
  )
}

export default DateFilterDropdown
