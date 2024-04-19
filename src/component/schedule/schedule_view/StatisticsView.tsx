import { useEffect, useState } from 'react'
import {
  formatDate,
  getHoursDiffInTwoTimeString,
  toDate,
} from '../../../utilities/misc'
import DbSchedule, { ISchedule } from '../../../firebase_configs/DB/DbSchedule'
import { REACT_QUERY_KEYS } from '../../../@types/enum'
import { useQuery } from '@tanstack/react-query'
import { useAuthState } from '../../../store'
import SelectBranch from '../../../common/SelectBranch'
import dayjs from 'dayjs'
import { numberFormatter } from '../../../utilities/NumberFormater'
import Button from '../../../common/button/Button'
import { generateStatsViewHtml } from '../../../utilities/genrateStatsViewHtml'
import { htmlStringToPdf } from '../../../utilities/htmlStringToPdf'

const StatisticsView = ({ datesArray }: { datesArray: Date[] }) => {
  const [schedules, setSchedules] = useState<ISchedule[]>([])

  const [empHavingShifts, setEmpHavingShifts] = useState<
    {
      empId: string
      empName: string
      empShifts: number
      empHours: number
      empPayRate: number
      empApproxCost: number
    }[]
  >([])

  const { company } = useAuthState()

  const [branch, setBranch] = useState('')

  const { data, error } = useQuery({
    queryKey: [
      REACT_QUERY_KEYS.SCHEDULES,
      datesArray,
      branch,
      company!.CompanyId,
    ],
    queryFn: async () => {
      const data = await DbSchedule.getSchedules(
        datesArray[0],
        datesArray[datesArray.length - 1],
        company!.CompanyId,
        branch
      )
      return data
    },
  })

  useEffect(() => {
    console.log(error)
    setSchedules(data || [])
  }, [data, error])

  const getUnassignedShiftForDay = (date: Date) => {
    return schedules.filter(
      (s) =>
        dayjs(toDate(s.shift.ShiftDate)).isSame(date, 'date') &&
        s.shift.ShiftAssignedUserId.length === 0
    )
  }

  const getAssignedShiftForDay = (date: Date) => {
    return schedules.filter(
      (s) =>
        dayjs(toDate(s.shift.ShiftDate)).isSame(date, 'date') &&
        s.shift.ShiftAssignedUserId.length > 0
    )
  }

  const getShiftsCost = (schedule: ISchedule[]) => {
    if (schedule.length === 0) return 0

    let allShiftsCost = 0

    schedule.forEach((sch) => {
      const { employee, shift } = sch

      const shiftHours = getHoursDiffInTwoTimeString(
        shift.ShiftStartTime,
        shift.ShiftEndTime
      )

      allShiftsCost += employee.reduce((acc, obj) => {
        return acc + obj.EmployeePayRate * shiftHours
      }, 0)
    })

    return allShiftsCost
  }

  const getTotals = () => {
    let unAssignedShiftTotal = 0,
      unAssignedShiftHours = 0,
      assignedShiftTotal = 0,
      assignedShiftHours = 0,
      totalCost = 0

    datesArray.forEach((date) => {
      const unAssigned = getUnassignedShiftForDay(date)
      const assigned = getAssignedShiftForDay(date)

      unAssignedShiftTotal += unAssigned.length

      unAssignedShiftHours += unAssigned.reduce((acc, obj) => {
        const shiftHours = getHoursDiffInTwoTimeString(
          obj.shift.ShiftStartTime,
          obj.shift.ShiftEndTime
        )

        return acc + shiftHours
      }, 0)

      assignedShiftTotal += assigned.length

      assignedShiftHours += assigned.reduce((acc, obj) => {
        const shiftHours = getHoursDiffInTwoTimeString(
          obj.shift.ShiftStartTime,
          obj.shift.ShiftEndTime
        )

        return acc + shiftHours
      }, 0)

      totalCost += getShiftsCost(assigned)
    })

    return {
      unAssignedShiftHours,
      unAssignedShiftTotal,
      assignedShiftHours,
      assignedShiftTotal,
      totalCost,
    }
  }

  //*Populate emps and his shifts

  useEffect(() => {
    const updatedEmpHavingShifts: {
      empId: string
      empName: string
      empShifts: number
      empHours: number
      empPayRate: number
      empApproxCost: number
    }[] = []

    schedules?.forEach((schedule) => {
      if (schedule?.employee?.length > 0) {
        const { employee, shift } = schedule
        const shiftHours = getHoursDiffInTwoTimeString(
          shift.ShiftStartTime,
          shift.ShiftEndTime
        )

        employee.forEach((emp) => {
          const existingEmpIndex = updatedEmpHavingShifts.findIndex(
            (e) => e.empId === emp.EmployeeId
          )
          if (existingEmpIndex !== -1) {
            updatedEmpHavingShifts[existingEmpIndex] = {
              ...updatedEmpHavingShifts[existingEmpIndex],
              empShifts: updatedEmpHavingShifts[existingEmpIndex].empShifts + 1,
              empHours:
                updatedEmpHavingShifts[existingEmpIndex].empHours + shiftHours,
              empApproxCost:
                updatedEmpHavingShifts[existingEmpIndex].empApproxCost +
                shiftHours *
                  updatedEmpHavingShifts[existingEmpIndex].empPayRate,
            }
          } else {
            updatedEmpHavingShifts.push({
              empId: emp.EmployeeId,
              empName: emp.EmployeeName,
              empApproxCost: shiftHours * emp.EmployeePayRate,
              empHours: shiftHours,
              empPayRate: emp.EmployeePayRate,
              empShifts: 1,
            })
          }
        })
      }
    })

    setEmpHavingShifts(updatedEmpHavingShifts) // Update state with the accumulated changes
  }, [schedules])

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-4 justify-between">
        <SelectBranch selectedBranch={branch} setSelectedBranch={setBranch} />
        <Button
          label="Print"
          onClick={async () => {
            const shiftsSummaryHtml =
              document.getElementById('shiftsSummary')?.outerHTML || ''
            const employeesScheduledHtml =
              document.getElementById('employeesScheduled')?.outerHTML || ''

            const pdfHtml = generateStatsViewHtml(
              shiftsSummaryHtml as unknown as JSX.Element,
              employeesScheduledHtml as unknown as JSX.Element,
              company!.CompanyName,
              datesArray[0]
            )
            await htmlStringToPdf('test.pdf', pdfHtml)
          }}
          type="black"
          className="px-12 py-2"
        />
      </div>
      <div className="flex w-full justify-between items-start gap-8">
        <div
          id="shiftsSummary"
          className="flex flex-col p-4 rounded-lg bg-surface shadow-md gap-4 w-full"
        >
          <div className="font-semibold text-xl">Shifts summary</div>

          <table className="w-full">
            <thead>
              <tr>
                <th className="px-2 text-start w-[30%]"></th>
                <th
                  className="px-2 text-center w-[25%] text-primaryRed"
                  colSpan={2}
                >
                  Unassigned
                </th>
                <th className="px-2 text-center w-[25%]" colSpan={2}>
                  Assigned
                </th>
                <th className="px-2 text-start w-[20%]"></th>
              </tr>
              <tr className="border-b border-gray-400">
                <th className="px-2 text-start pt-1"></th>
                <th className="px-2 text-center pt-1 text-primaryRed">Shift</th>
                <th className="px-2 text-center pt-1 text-primaryRed">Hours</th>
                <th className="px-2 text-center pt-1">Shift</th>
                <th className="px-2 text-center pt-1">Hours</th>
                <th className="px-2 text-end pt-1">Approx Cost</th>
              </tr>
            </thead>
            <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
              {datesArray.map((date, idx) => {
                const unAssigned = getUnassignedShiftForDay(date)
                const assigned = getAssignedShiftForDay(date)
                return (
                  <tr key={idx}>
                    <td className="px-2 py-2">{formatDate(date, 'dddd')}</td>
                    <td className="px-2 py-2 text-center">
                      {unAssigned.length.toFixed(2)}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {unAssigned
                        .reduce((acc, obj) => {
                          const shiftHours = getHoursDiffInTwoTimeString(
                            obj.shift.ShiftStartTime,
                            obj.shift.ShiftEndTime
                          )

                          return acc + shiftHours
                        }, 0)
                        .toFixed(2)}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {assigned.length.toFixed(2)}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {assigned
                        .reduce((acc, obj) => {
                          const shiftHours = getHoursDiffInTwoTimeString(
                            obj.shift.ShiftStartTime,
                            obj.shift.ShiftEndTime
                          )

                          return acc + shiftHours
                        }, 0)
                        .toFixed(2)}
                    </td>
                    <td className="px-2 py-2 text-end">
                      {numberFormatter(getShiftsCost(assigned), true)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-400 font-semibold">
                <td className="p-2">Total</td>
                <td className="p-2 text-center">
                  {getTotals().unAssignedShiftTotal.toFixed(2)}
                </td>
                <td className="p-2 text-center">
                  {getTotals().unAssignedShiftHours.toFixed(2)}
                </td>
                <td className="p-2 text-center">
                  {getTotals().assignedShiftTotal.toFixed(2)}
                </td>
                <td className="p-2 text-center">
                  {getTotals().assignedShiftHours.toFixed(2)}
                </td>
                <td className="p-2 text-end">
                  {' '}
                  {numberFormatter(getTotals().totalCost, true)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div
          id="employeesScheduled"
          className="flex flex-col p-4 rounded-lg bg-surface shadow-md gap-4 w-full"
        >
          <div className="font-semibold text-xl">
            Employees Scheduled This Week
          </div>
          <table>
            <thead>
              <tr className="bg-onHoverBg border-b border-gray-400">
                <th className="px-2 py-1 text-start">Employee Name</th>
                <th className="px-2 py-1 text-center">Shifts</th>
                <th className="px-2 py-1 text-center">Hours</th>
                <th className="px-2 py-1 text-center">Pay Rate</th>
                <th className="px-2 py-1 text-end">Approx Cost</th>
              </tr>
            </thead>
            <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
              {empHavingShifts.map((data) => {
                return (
                  <tr key={data.empId}>
                    <td className="px-2 py-2 text-start">{data.empName}</td>
                    <td className="px-2 py-2 text-center">{data.empShifts}</td>
                    <td className="px-2 py-2 text-center">
                      {data.empHours.toFixed(2)}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {numberFormatter(data.empPayRate, true)}
                    </td>
                    <td className="px-2 py-2 text-end">
                      {numberFormatter(data.empApproxCost, true)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="font-semibold border-t border-gray-400">
                <td className="px-2 py-2 text-start">Total</td>
                <td className="px-2 py-2 text-center">
                  {empHavingShifts.reduce((acc, obj) => acc + obj.empShifts, 0)}
                </td>
                <td className="px-2 py-2 text-center">
                  {empHavingShifts
                    .reduce((acc, obj) => acc + obj.empHours, 0)
                    .toFixed(2)}
                </td>
                <td className="px-2 py-2 text-center"></td>
                <td className="px-2 py-2 text-end">
                  {numberFormatter(
                    empHavingShifts.reduce(
                      (acc, obj) => acc + obj.empApproxCost,
                      0
                    ),
                    true
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}

export default StatisticsView
