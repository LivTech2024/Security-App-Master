import { useState } from 'react';
import Button from '../../common/button/Button';
import ReceivedMessageList from '../../component/messaging/ReceivedMessageList';
import SentMessageList from '../../component/messaging/SentMessageList';
import SendMessageModal from '../../component/messaging/modal/SendMessageModal';
import { useAuthState } from '../../store';
import PageHeader from '../../common/PageHeader';
import DateFilterDropdown from '../../common/dropdown/DateFilterDropdown';
import dayjs from 'dayjs';

const Messaging = () => {
  const [sendMessageModal, setSendMessageModal] = useState(false);

  const { company, admin } = useAuthState();

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

      <SendMessageModal
        opened={sendMessageModal}
        setOpened={setSendMessageModal}
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
      <div className="grid grid-cols-2 gap-4">
        <ReceivedMessageList
          receiverId={admin!.AdminId}
          endDate={endDate}
          isLifeTime={isLifeTime}
          startDate={startDate}
        />
        <SentMessageList
          senderId={company!.CompanyId}
          endDate={endDate}
          isLifeTime={isLifeTime}
          startDate={startDate}
        />
      </div>
    </div>
  );
};

export default Messaging;
