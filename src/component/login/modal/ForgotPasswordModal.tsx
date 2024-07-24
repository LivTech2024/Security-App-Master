import { useState } from 'react';
import Dialog from '../../../common/Dialog';
import InputWithTopHeader from '../../../common/inputs/InputWithTopHeader';
import CustomError, { errorHandler } from '../../../utilities/CustomError';
import { closeModalLoader, showModalLoader } from '../../../utilities/TsxUtils';
import { ConstRegex } from '../../../constants/ConstRegex';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { openContextModal } from '@mantine/modals';

const ForgotPasswordModal = ({
  opened,
  setOpened,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const auth = getAuth();

  const [email, setEmail] = useState('');

  const onReset = async () => {
    try {
      if (!email || !ConstRegex.EMAIL_OPTIONAL.test(email)) {
        throw new CustomError('Please enter a valid email');
      }
      showModalLoader({});

      await sendPasswordResetEmail(auth, email);

      closeModalLoader();
      setOpened(false);
      openContextModal({
        modal: 'confirmModal',
        withCloseButton: false,
        centered: true,
        closeOnClickOutside: true,
        innerProps: {
          title: 'Alert',
          body: 'Link to reset you password is sent to your email id',
          positiveLabel: 'Ok',
          negativeLabel: '',
        },
        size: '30%',
        styles: {
          body: { padding: '0px' },
        },
      });
    } catch (error) {
      console.log(error);
      errorHandler(error);
      closeModalLoader();
    }
  };

  return (
    <Dialog
      opened={opened}
      setOpened={setOpened}
      title="Reset Password"
      positiveLabel="Reset"
      positiveCallback={onReset}
      isFormModal
    >
      <div className="flex flex-col">
        <InputWithTopHeader
          className="mx-0"
          label="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
    </Dialog>
  );
};

export default ForgotPasswordModal;
