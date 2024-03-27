import React, { useState } from "react";
import Dialog from "../../../common/Dialog";
import { auth } from "../../../firebase_configs/config";
import {
  signInWithEmailAndPassword,
  updateEmail,
  updatePassword,
} from "firebase/auth";
import CustomError, { errorHandler } from "../../../utilities/CustomError";
import InputWithTopHeader from "../../../common/inputs/InputWithTopHeader";
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from "../../../utilities/TsxUtils";
import { ConstRegex } from "../../../constants/ConstRegex";
import { FirebaseError } from "firebase/app";
import { useAuthState } from "../../../store";
import DbCompany from "../../../firebase_configs/DB/DbCompany";

const UpdateAdminCredModal = ({
  opened,
  setOpened,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { admin } = useAuthState();

  const [currentEmail, setCurrentEmail] = useState(admin?.AdminEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleUpdateUser = async () => {
    try {
      const emailRegex = ConstRegex.EMAIL_OPTIONAL;

      if (!currentEmail || !emailRegex.test(currentEmail)) {
        throw new CustomError("Please enter valid current email id");
      }
      if (currentPassword.length < 6) {
        throw new CustomError("Current password must be at least 6 characters");
      }

      if (!newEmail || !emailRegex.test(newEmail)) {
        throw new CustomError("Please enter valid new email id");
      }
      if (newPassword.length < 6) {
        throw new CustomError("New password must be at least 6 characters");
      }

      showModalLoader({});
      const userCredential = await signInWithEmailAndPassword(
        auth,
        currentEmail,
        currentPassword
      );
      const user = userCredential.user;

      await updateEmail(user, newEmail);
      await updatePassword(user, newPassword);

      await DbCompany.updateAdminEmail(user.uid, newEmail);

      // Clear form fields after successful update
      setCurrentEmail("");
      setCurrentPassword("");
      setNewEmail("");
      setNewPassword("");

      showSnackbar({
        message: "Admin credentials updated successfully",
        type: "success",
      });

      closeModalLoader();
      setOpened(false);
    } catch (error) {
      closeModalLoader();
      console.log(error);
      if (error instanceof FirebaseError) {
        showSnackbar({ message: "Invalid credentials", type: "error" });
        return;
      }
      errorHandler(error);
    }
  };
  return (
    <Dialog
      size="auto"
      opened={opened}
      setOpened={setOpened}
      title="Update admin credentials"
      isFormModal={true}
      positiveCallback={handleUpdateUser}
    >
      <div className="grid grid-cols-2 gap-4">
        <InputWithTopHeader
          label="Current Email:"
          className="mx-0"
          value={currentEmail}
          onChange={(e) => setCurrentEmail(e.target.value)}
        />

        <InputWithTopHeader
          label="Current Password:"
          className="mx-0"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          inputType="password"
        />

        <InputWithTopHeader
          label="New Email:"
          className="mx-0"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
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
