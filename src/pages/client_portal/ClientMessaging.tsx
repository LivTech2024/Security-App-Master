import { useState } from 'react';
import { useAuthState } from '../../store';
import Button from '../../common/button/Button';
import ReceivedMessageList from '../../component/messaging/ReceivedMessageList';
import SentMessageList from '../../component/messaging/SentMessageList';
import SendMessageModal from '../../component/client_portal/modal/SendMessageModal';
import PageHeader from '../../common/PageHeader';
import DateFilterDropdown from '../../common/dropdown/DateFilterDropdown';
import dayjs from 'dayjs';

const ClientMessaging = () => {
  const [sendMessageModal, setSendMessageModal] = useState(false);

  const { client } = useAuthState();

  const [startDate, setStartDate] = useState<Date | string | null>(
    dayjs().startOf('M').toDate()
  );

  const [endDate, setEndDate] = useState<Date | string | null>(
    dayjs().endOf('M').toDate()
  );

  const [isLifeTime, setIsLifeTime] = useState(false);
  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <PageHeader
        title="Messaging"
        rightSection={
          <Button
            label="New Message"
            onClick={() => {
              setSendMessageModal(true);
            }}
            type="black"
          />
        }
      />

      <div className="flex bg-surface shadow p-4 rounded justify-between">
        <DateFilterDropdown
          endDate={endDate}
          setEndDate={setEndDate}
          setStartDate={setStartDate}
          startDate={startDate}
          isLifetime={isLifeTime}
          setIsLifetime={setIsLifeTime}
        />
      </div>

      <SendMessageModal
        opened={sendMessageModal}
        setOpened={setSendMessageModal}
      />
      <div className="grid grid-cols-2 gap-4">
        <ReceivedMessageList
          receiverId={client!.ClientId}
          endDate={endDate}
          isLifeTime={isLifeTime}
          startDate={startDate}
        />
        <SentMessageList
          senderId={client!.ClientId}
          endDate={endDate}
          isLifeTime={isLifeTime}
          startDate={startDate}
        />
      </div>
    </div>
  );
};

export default ClientMessaging;
