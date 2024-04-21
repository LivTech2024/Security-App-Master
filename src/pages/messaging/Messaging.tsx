import { useState } from 'react';
import Button from '../../common/button/Button';
import ReceivedMessageList from '../../component/messaging/ReceivedMessageList';
import SentMessageList from '../../component/messaging/SentMessageList';
import SendMessageModal from '../../component/messaging/modal/SendMessageModal';

const Messaging = () => {
  const [sendMessageModal, setSendMessageModal] = useState(false);
  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
        <span className="font-semibold text-xl">Messaging</span>
        <Button
          label="New Message"
          onClick={() => {
            setSendMessageModal(true);
          }}
          type="black"
        />
      </div>
      <SendMessageModal
        opened={sendMessageModal}
        setOpened={setSendMessageModal}
      />
      <div className="grid grid-cols-2 gap-4">
        <ReceivedMessageList />
        <SentMessageList />
      </div>
    </div>
  );
};

export default Messaging;
