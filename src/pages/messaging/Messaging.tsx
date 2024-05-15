import { useState } from 'react';
import Button from '../../common/button/Button';
import ReceivedMessageList from '../../component/messaging/ReceivedMessageList';
import SentMessageList from '../../component/messaging/SentMessageList';
import SendMessageModal from '../../component/messaging/modal/SendMessageModal';
import { useAuthState } from '../../store';
import PageHeader from '../../common/PageHeader';

const Messaging = () => {
  const [sendMessageModal, setSendMessageModal] = useState(false);

  const { company, admin } = useAuthState();
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
      <div className="grid grid-cols-2 gap-4">
        <ReceivedMessageList receiverId={admin!.AdminId} />
        <SentMessageList senderId={company!.CompanyId} />
      </div>
    </div>
  );
};

export default Messaging;
