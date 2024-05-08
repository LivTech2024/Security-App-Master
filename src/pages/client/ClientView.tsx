import { useEffect, useState } from 'react';
import Button from '../../common/button/Button';
import { useEditFormStore } from '../../store';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IClientsCollection } from '../../@types/database';
import DbClient from '../../firebase_configs/DB/DbClient';
import NoSearchResult from '../../common/NoSearchResult';
import { PageRoutes } from '../../@types/enum';
import { Client } from '../../store/slice/editForm.slice';

import { numberFormatter } from '../../utilities/NumberFormater';
import PageHeader from '../../common/PageHeader';
import DateFilterDropdown from '../../common/dropdown/DateFilterDropdown';
import dayjs from 'dayjs';

const ClientView = () => {
  const { setClientEditData } = useEditFormStore();

  const [searchParam] = useSearchParams();

  const clientId = searchParam.get('id');

  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState<Date | string | null>(
    dayjs().startOf('M').toDate()
  );

  const [endDate, setEndDate] = useState<Date | string | null>(
    dayjs().endOf('M').toDate()
  );

  const [isLifeTime, setIsLifeTime] = useState(false);

  const [data, setData] = useState<IClientsCollection | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!clientId) return;
    DbClient?.getClientById(clientId).then(async (snapshot) => {
      const clientData = snapshot.data() as IClientsCollection;
      if (clientData) {
        setData(clientData);
      }
      setLoading(false);
    });
  }, [clientId]);

  if (!data && !loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <NoSearchResult />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6 ">
        <PageHeader title="Client data" />

        <div className="h-[40vh] bg-shimmerColor w-full animate-pulse"></div>
      </div>
    );
  }

  if (data)
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6">
        <PageHeader
          title="Client data"
          rightSection={
            <Button
              type="black"
              onClick={() => {
                setClientEditData(data as unknown as Client);
                navigate(PageRoutes.CLIENT_CREATE_OR_EDIT);
              }}
              className="bg-primary text-surface px-4 py-2 rounded"
              label="Edit Client"
            />
          }
        />

        <div className="bg-surface shadow rounded p-4 flex gap-4">
          <DateFilterDropdown
            endDate={endDate}
            isLifetime={isLifeTime}
            setEndDate={setEndDate}
            setIsLifetime={setIsLifeTime}
            setStartDate={setStartDate}
            startDate={startDate}
          />
        </div>
        <div className="bg-surface shadow rounded p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold">Client Name:</p>
              <p>{data?.ClientName}</p>
            </div>
            <div>
              <p className="font-semibold">Client Phone:</p>
              <p>{data?.ClientPhone}</p>
            </div>
            <div>
              <p className="font-semibold">Client Email:</p>
              <p>{data?.ClientEmail}</p>
            </div>
            <div>
              <p className="font-semibold">Client Address:</p>
              <p>{data?.ClientAddress ?? 'N/A'}</p>
            </div>

            <div>
              <p className="font-semibold">Client Balance To Date:</p>
              <p>{numberFormatter(data?.ClientBalance, true)}</p>
            </div>
          </div>
        </div>
      </div>
    );
};

export default ClientView;
