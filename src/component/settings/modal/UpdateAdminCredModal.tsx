import React, { useState } from 'react';
import Dialog from '../../../common/Dialog';
import { auth } from '../../../firebase_configs/config';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import CustomError, { errorHandler } from '../../../utilities/CustomError';
import InputWithTopHeader from '../../../common/inputs/InputWithTopHeader';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../../utilities/TsxUtils';
import { FirebaseError } from 'firebase/app';
import { useAuthState } from '../../../store';

const UpdateAdminCredModal = ({
  opened,
  setOpened,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { admin } = useAuthState();

  const [currentPassword, setCurrentPassword] = useState('');

  const [newPassword, setNewPassword] = useState('');

  const handleUpdateUser = async () => {
    const user = auth.currentUser;
    if (!admin || !admin.AdminEmail || !user) return;

    try {
      if (currentPassword.length < 6) {
        throw new CustomError('Current password must be at least 6 characters');
      }

      if (newPassword.length < 6) {
        throw new CustomError('New password must be at least 6 characters');
      }

      showModalLoader({});

      const credentials = EmailAuthProvider.credential(
        admin.AdminEmail,
        currentPassword
      );

      await reauthenticateWithCredential(user, credentials);
      await updatePassword(user, newPassword);

      setCurrentPassword('');
      setNewPassword('');

      showSnackbar({
        message: 'Password changed successfully',
        type: 'success',
      });

      closeModalLoader();
      setOpened(false);
    } catch (error) {
      closeModalLoader();
      console.log(error);
      if (error instanceof FirebaseError) {
        showSnackbar({ message: 'Invalid credentials', type: 'error' });
        return;
      }
      errorHandler(error);
    }
  };
  return (
    <Dialog
      size="600px"
      opened={opened}
      setOpened={setOpened}
      title="Change Password"
      isFormModal={true}
      positiveCallback={handleUpdateUser}
    >
      <div className="grid grid-cols-1 gap-4">
        <InputWithTopHeader
          label="Current Password:"
          className="mx-0"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          inputType="password"
        />

        <InputWithTopHeader
          label="New Password:"
          className="mx-0"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          inputType="password"
        />
      </div>
    </Dialog>
  );
};

export default UpdateAdminCredModal;
