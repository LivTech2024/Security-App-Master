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

const PatrollingView = () => {
  const [searchParam] = useSearchParams();

  const patrolLogId = searchParam.get('id');

  const [isPatrolLoading, setIsPatrolLoading] = useState(true);

  const [logData, setLogData] = useState<IPatrolLogsCollection | null>(null);

  const [patrolData, setPatrolData] = useState<IPatrolsCollection | null>(null);

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
        <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
          <span className="font-semibold text-xl">Patrolling data</span>
        </div>
        <div className="h-[40vh] bg-shimmerColor w-full"></div>
      </div>
    );
  }

  if (logData && patrolData) {
    const onDelete = async () => {
      if (!patrolLogId) return;
      try {
        showModalLoader({});

        await DbPatrol.deletePatrolLog(patrolLogId);

        navigate(-1);

        closeModalLoader();
      } catch (error) {
        closeModalLoader();
        console.log(error);
        errorHandler(error);
      }
    };

    return (
      <div className="flex flex-col w-full h-full p-6 gap-6">
        <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
          <span className="font-semibold text-xl">Patrol log data</span>
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
        </div>
        <PatrolViewCard patrolLogData={logData} patrolData={patrolData} />
      </div>
    );
  }
};

export default PatrollingView;
