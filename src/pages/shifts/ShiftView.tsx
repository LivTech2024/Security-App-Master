import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { IShiftsCollection } from '../../@types/database'
import { useEditFormStore } from '../../store'
import { firebaseDataToObject, formatDate } from '../../utilities/misc'
import { Shift } from '../../store/slice/editForm.slice'
import DbShift from '../../firebase_configs/DB/DbShift'
import NoSearchResult from '../../common/NoSearchResult'
import { PageRoutes } from '../../@types/enum'
import { IoArrowBackCircle } from 'react-icons/io5'
import Button from '../../common/button/Button'

const ShiftView = () => {
  const { setShiftEditData } = useEditFormStore()

  const [searchParam] = useSearchParams()

  const shiftId = searchParam.get('id')

  const [loading, setLoading] = useState(true)

  const [data, setData] = useState<IShiftsCollection | null>(null)

  const navigate = useNavigate()

  useEffect(() => {
    if (!shiftId) return
    DbShift?.getShiftById(shiftId).then((snapshot) => {
      const shiftData = snapshot.data() as IShiftsCollection
      if (shiftData) {
        setData(shiftData)
      }
      setLoading(false)
    })
  }, [shiftId])

  if (!data && !loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <NoSearchResult />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6 animate-pulse">
        <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
          <div
            onClick={() => navigate(-1)}
            className="flex items-center gap-4 cursor-pointer "
          >
            <div className="cursor-pointer">
              <IoArrowBackCircle className="h-6 w-6" />
            </div>
            <div className="font-semibold text-lg">Shift data</div>
          </div>
        </div>
        <div className="h-[40vh] bg-shimmerColor w-full"></div>
      </div>
    )
  }

  if (data)
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6">
        <div className="flex justify-between w-full p-4 rounded bg-primaryGold  items-center">
          <div
            onClick={() => navigate(-1)}
            className="flex items-center gap-4 cursor-pointer "
          >
            <div className="cursor-pointer">
              <IoArrowBackCircle className="h-6 w-6" />
            </div>
            <div className="font-semibold text-lg">Shift data</div>
          </div>
          <Button
            type="black"
            onClick={() => {
              setShiftEditData(
                firebaseDataToObject(
                  data as unknown as Record<string, unknown>
                ) as unknown as Shift
              )
              navigate(PageRoutes.SHIFT_CREATE_OR_EDIT)
            }}
            className="bg-primary text-surface px-4 py-2 rounded"
            label="Edit Shift"
          />
        </div>

        <div className="bg-surface shadow-md rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold">Shift Name:</p>
              <p>{data?.ShiftName || 'N/A'}</p>
            </div>
            <div>
              <p className="font-semibold">Shift Position:</p>
              <p>{data?.ShiftPosition || 'N/A'}</p>
            </div>
            <div>
              <p className="font-semibold">Shift Date:</p>
              <p>{data?.ShiftDate ? formatDate(data?.ShiftDate) : 'N/A'}</p>
            </div>
            <div>
              <p className="font-semibold">Shift Start Time:</p>
              <p>{data?.ShiftStartTime || 'N/A'}</p>
            </div>
            <div>
              <p className="font-semibold">Shift End Time:</p>
              <p>{data?.ShiftEndTime || 'N/A'}</p>
            </div>
            <div>
              <p className="font-semibold">Shift Location:</p>
              <p>{data?.ShiftLocationName || 'N/A'}</p>
              {data?.ShiftLocationAddress && (
                <p>{data?.ShiftLocationAddress}</p>
              )}
            </div>
            <div>
              <p className="font-semibold">Shift Restricted Radius:</p>
              <p>
                {data?.ShiftEnableRestrictedRadius
                  ? `${data?.ShiftRestrictedRadius} meters`
                  : 'Not enabled'}
              </p>
            </div>
            <div>
              <p className="font-semibold">Shift Description:</p>
              <p>{data?.ShiftDescription || 'N/A'}</p>
            </div>
            <div>
              <p className="font-semibold">Shift Assigned Users:</p>
              <p>{data?.ShiftAssignedUserId?.length ?? 0}</p>
            </div>
            <div>
              <p className="font-semibold">Shift Acknowledged By Employees:</p>
              <ul>{data?.ShiftAcknowledgedByEmpId?.length ?? 0}</ul>
            </div>
            <div>
              <p className="font-semibold">Shift Current Status</p>
              <ul className="px-4">
                {data?.ShiftCurrentStatus &&
                data?.ShiftCurrentStatus?.length > 0 ? (
                  data?.ShiftCurrentStatus?.map((data, idx) => {
                    return (
                      <li key={idx} className="capitalize list-decimal">
                        {data.Status} by {data.StatusReportedByName}
                      </li>
                    )
                  })
                ) : (
                  <li className="capitalize list-decimal">Pending</li>
                )}
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap">
            {data?.ShiftPhotos &&
              data?.ShiftPhotos?.map((img, idx) => {
                return (
                  <img
                    src={img}
                    alt="shift_photos"
                    key={idx}
                    className="w-[100px] object-cover"
                  />
                )
              })}
          </div>

          <div className="flex flex-col gap-1 mt-4">
            <p className="font-semibold">Shift Tasks</p>
            <div className="flex flex-wrap gap-6">
              {data.ShiftTask.map((task, idx) => {
                return (
                  <div className="flex flex-col ">
                    <span className="text-lg font-semibold">
                      {idx + 1}. {task.ShiftTask}
                    </span>
                    {task?.ShiftTaskStatus?.length > 0 ? (
                      <div className="flex flex-col gap-4">
                        {task.ShiftTaskStatus?.map((s) => {
                          return (
                            <div className="pl-4 flex flex-col bg-onHoverBg rounded p-4">
                              <span className="capitalize">
                                Status: {s.TaskStatus}
                              </span>
                              <span>Employee: {s.TaskCompletedByName}</span>
                              <span>
                                Completion Time:{' '}
                                {formatDate(
                                  s.TaskCompletionTime,
                                  'DD MMM-YY hh-mm A'
                                )}
                              </span>
                              <span>Images: </span>
                              {s.TaskPhotos?.map((img, idx) => {
                                return (
                                  <a
                                    key={img}
                                    href={img}
                                    target="_blank"
                                    className="cursor-pointer text-textPrimaryBlue"
                                  >
                                    {idx + 1}. {img.slice(0, 30)}...
                                  </a>
                                )
                              })}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <span className="pl-4">Status: Pending</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1 mt-4">
            <p className="font-semibold">Wellness report</p>
            <div className="flex flex-wrap gap-6">
              {data?.ShiftGuardWellnessReport.length > 0
                ? data?.ShiftGuardWellnessReport?.map((res, idx) => {
                    return (
                      <div key={idx} className="flex flex-col">
                        {res.WellnessEmpName && (
                          <div>Employee Name: {res?.WellnessEmpName}</div>
                        )}
                        {res.WellnessReportedAt && (
                          <div>
                            Reported At:{' '}
                            {formatDate(
                              res?.WellnessReportedAt,
                              'DD MMM-YY hh:mm A'
                            )}
                          </div>
                        )}
                        {res.WellnessComment && (
                          <div>Comment: {res?.WellnessComment}</div>
                        )}
                        {res.WellnessImg && (
                          <div>
                            Image:{' '}
                            <a
                              href={res?.WellnessImg}
                              className="text-textPrimaryBlue cursor-pointer"
                            >
                              {res?.WellnessImg?.slice(0, 30)}...
                            </a>{' '}
                          </div>
                        )}
                      </div>
                    )
                  })
                : 'N/A'}
            </div>
          </div>
        </div>
      </div>
    )
}

export default ShiftView
