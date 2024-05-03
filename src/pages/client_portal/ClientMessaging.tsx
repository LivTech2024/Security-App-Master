import { useState } from 'react';
import { useAuthState } from '../../store';
import Button from '../../common/button/Button';
import ReceivedMessageList from '../../component/messaging/ReceivedMessageList';
import SentMessageList from '../../component/messaging/SentMessageList';
import SendMessageModal from '../../component/client_portal/modal/SendMessageModal';
import PageHeader from '../../common/PageHeader';

const ClientMessaging = () => {
  const [sendMessageModal, setSendMessageModal] = useState(false);

  const { client } = useAuthState();
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
        <ReceivedMessageList receiverId={client!.ClientId} />
        <SentMessageList senderId={client!.ClientId} />
      </div>
    </div>
  );
};

export default ClientMessaging;
