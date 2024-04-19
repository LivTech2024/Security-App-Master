import { useEffect, useState } from 'react'
import { useAuthState } from '../../store'
import { MinimumQueryCharacter } from '../../@types/enum'
import { IPatrolsCollection } from '../../@types/database'
import DbPatrol from '../../firebase_configs/DB/DbPatrol'

interface Props {
  limit?: number
  searchQuery?: string | null
  locationId?: string | null
}

const useFetchPatrols = ({ limit, searchQuery, locationId }: Props) => {
  const [data, setData] = useState<IPatrolsCollection[]>([])

  const { company } = useAuthState()

  useEffect(() => {
    if (!company) return

    if (
      searchQuery &&
      searchQuery.trim().length > 0 &&
      searchQuery.trim().length < MinimumQueryCharacter.LOCATION
    ) {
      return
    }
    const fetchInitialClients = async () => {
      const snapshot = await DbPatrol.getPatrols({
        lmt: limit,
        lastDoc: null,
        searchQuery:
          searchQuery &&
          searchQuery.trim().length > MinimumQueryCharacter.PATROL
            ? searchQuery.trim()
            : undefined,
        cmpId: company.CompanyId,
        locationId,
      })
      return snapshot.docs
        .map((doc) => {
          const data = doc.data() as IPatrolsCollection
          if (data) {
            return data
          }
          return null
        })
        .filter((item) => item !== null) as IPatrolsCollection[]
    }

    try {
      fetchInitialClients().then((arr) => {
        setData(arr)
      })
    } catch (error) {
      console.log(error)
    }
  }, [limit, company, searchQuery, locationId])

  return { data }
}

export default useFetchPatrols
