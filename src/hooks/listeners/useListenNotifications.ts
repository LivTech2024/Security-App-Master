import { useEffect, useState } from 'react'
import { useAuthState } from '../../store'
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../../firebase_configs/config'
import { CollectionName } from '../../@types/enum'
import dayjs from 'dayjs'
import { INotificationsCollection } from '../../@types/database'

const useListenNotifications = () => {
  const { company } = useAuthState()

  const [notification, setIncident] = useState<INotificationsCollection | null>(
    null
  )

  useEffect(() => {
    if (!company) return
    const incidentRef = collection(db, CollectionName.notifications)
    const incidentQuery = query(
      incidentRef,
      where('NotificationCompanyId', '==', company.CompanyId),
      where('NotificationCreatedBy', '==', 'employee'),
      where(
        'NotificationCreatedAt',
        '>=',
        dayjs(new Date()).subtract(1, 'hour').toDate()
      ),
      limit(1)
    )

    const unsubscribe = onSnapshot(incidentQuery, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot?.docs[0]?.data() as INotificationsCollection
        setIncident(data)
      }
    })

    return () => unsubscribe()
  }, [company])

  return { notification }
}

export default useListenNotifications
