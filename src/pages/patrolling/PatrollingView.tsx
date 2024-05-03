import { useNavigate, useSearchParams } from 'react-router-dom';
import PatrolViewCard from '../../component/patrolling/PatrolViewCard';
import { useEffect, useState } from 'react';
import DbPatrol from '../../firebase_configs/DB/DbPatrol';
import NoSearchResult from '../../common/NoSearchResult';
import {
  IPatrolLogsCollection,
  IPatrolsCollection,
} from '../../@types/database';
import Button from '../../common/button/Button';
import { errorHandler } from '../../utilities/CustomError';
import { closeModalLoader, showModalLoader } from '../../utilities/TsxUtils';
import { openContextModal } from '@mantine/modals';
import { useAuthState } from '../../store';
import PageHeader from '../../common/PageHeader';

const PatrollingView = () => {
  const { admin, company } = useAuthState();

  const [searchParam] = useSearchParams();

  const patrolLogId = searchParam.get('id');

  const [isPatrolLoading, setIsPatrolLoading] = useState(true);

  const [logData, setLogData] = useState<IPatrolLogsCollection | null>(null);

  const [patrolData, setPatrolData] = useState<IPatrolsCollection | null>(null);

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatrolLogData = async () => {
      if (!patrolLogId) return;
      try {
        const patrolLogSnapshot = await DbPatrol.getPatrolLogById(patrolLogId);
        const patrolLogData = patrolLogSnapshot.data() as IPatrolLogsCollection;

        const { PatrolId } = patrolLogData;
        if (PatrolId) {
          const patrolSnapshot = await DbPatrol.getPatrolById(PatrolId);
          const patrolData = patrolSnapshot.data() as IPatrolsCollection;
          setPatrolData(patrolData);
        }

        setLogData(patrolLogData);

        setIsPatrolLoading(false);
      } catch (error) {
        console.log(error);
        setIsPatrolLoading(false);
      }
    };

    fetchPatrolLogData();
  }, [patrolLogId]);

  useEffect(() => {
    if (loading) {
      showModalLoader({});
    } else {
      closeModalLoader();
    }
    return () => closeModalLoader();
  }, [loading]);

  if (!logData && !isPatrolLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <NoSearchResult />
      </div>
    );
  }

  if (isPatrolLoading) {
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6 animate-pulse">
        <PageHeader title="Patrolling data" />

        <div className="h-[40vh] bg-shimmerColor w-full"></div>
      </div>
    );
  }

  if (logData && patrolData) {
    const onDelete = async () => {
      if (!patrolLogId || !admin || !company) return;
      try {
        setLoading(true);

        await DbPatrol.deletePatrolLog(patrolLogId);

        navigate(-1);

        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.log(error);
        errorHandler(error);
      }
    };

    return (
      <div className="flex flex-col w-full h-full p-6 gap-6">
        <PageHeader
          title="Patrol log data"
          rightSection={
            admin &&
            company && (
              <Button
                label="Delete"
                onClick={() => {
                  openContextModal({
                    modal: 'confirmModal',
                    withCloseButton: false,
                    centered: true,
                    closeOnClickOutside: true,
                    innerProps: {
                      title: 'Confirm',
                      body: 'Are you sure to delete this patrol log',
                      onConfirm: () => {
                        onDelete();
                      },
                    },
                    size: '30%',
                    styles: {
                      body: { padding: '0px' },
                    },
                  });
                }}
                type="black"
                className="px-4 py-2"
              />
            )
          }
        />

        <PatrolViewCard patrolLogData={logData} patrolData={patrolData} />
      </div>
    );
  }
};

export default PatrollingView;
