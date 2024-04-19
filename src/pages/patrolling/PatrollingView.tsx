import { useNavigate, useSearchParams } from 'react-router-dom'
import PatrolViewCard from '../../component/patrolling/PatrolViewCard'
import { useEffect, useState } from 'react'
import DbPatrol from '../../firebase_configs/DB/DbPatrol'
import { IPatrolsCollection } from '../../@types/database'
import NoSearchResult from '../../common/NoSearchResult'
import { PageRoutes } from '../../@types/enum'
import Button from '../../common/button/Button'
import { useEditFormStore } from '../../store'

const PatrollingView = () => {
  const { setPatrolEditData } = useEditFormStore()

  const [searchParam] = useSearchParams()

  const patrolId = searchParam.get('id')

  const [isPatrolLoading, setIsPatrolLoading] = useState(true)

  const [data, setData] = useState<IPatrolsCollection | null>(null)

  const navigate = useNavigate()

  useEffect(() => {
    const fetchPatrolData = async () => {
      if (!patrolId) return
      try {
        const patrolSnapshot = await DbPatrol.getPatrolById(patrolId)
        const patrolData = patrolSnapshot.data() as IPatrolsCollection

        setData(patrolData)

        setIsPatrolLoading(false)
      } catch (error) {
        console.log(error)
        setIsPatrolLoading(false)
      }
    }

    fetchPatrolData()
  }, [patrolId])

  if (!data && !isPatrolLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <NoSearchResult />
      </div>
    )
  }

  if (isPatrolLoading) {
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6 animate-pulse">
        <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
          <span className="font-semibold text-xl">Patrolling data</span>
        </div>
        <div className="h-[40vh] bg-shimmerColor w-full"></div>
      </div>
    )
  }

  if (data) {
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6">
        <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
          <span className="font-semibold text-xl">Patrolling data</span>

          <div className="flex items-center gap-4">
            <Button
              label="Edit"
              onClick={() => {
                setPatrolEditData(data)
                navigate(PageRoutes.PATROLLING_CREATE_OR_EDIT)
              }}
              type="black"
              className="px-12 py-2 "
            />
          </div>
        </div>
        <PatrolViewCard patrolData={data} />
      </div>
    )
  }
}

export default PatrollingView
