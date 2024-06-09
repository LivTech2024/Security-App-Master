import { useState } from 'react';
import Button from '../../../common/button/Button';
import InputWithTopHeader from '../../../common/inputs/InputWithTopHeader';
import { AiOutlineWarning } from 'react-icons/ai';
import { closeModalLoader, showModalLoader } from '../../../utilities/TsxUtils';
import CustomError, { errorHandler } from '../../../utilities/CustomError';
import DbUser from '../../../firebase_configs/DB/DbUser';
import Dialog from '../../../common/Dialog';

const UserDataDeletionRequest = () => {
  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [successModal, setSuccessModal] = useState(false);

  const onSubmit = async () => {
    const emailRegex = new RegExp(
      /^(^[\w%+.-]+@[\d.A-Za-z-]+\.[A-Za-z]{2,}$)?$/
    );

    try {
      if (!emailRegex.test(email)) {
        throw new CustomError('Please enter valid email');
      }

      showModalLoader({});

      await DbUser.createDataDeletionRequest(email, password);

      setEmail('');
      setPassword('');

      closeModalLoader();
      setSuccessModal(true);
    } catch (error) {
      closeModalLoader();
      console.log(error);
      errorHandler(error);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-[100vh]">
      <div className="sm:bg-surface sm:rounded sm:shadow sm:border border-gray-300 flex flex-col p-6  w-full sm:max-w-[50%]">
        <div className="font-semibold text-2xl capitalize flex items-center gap-2">
          <span className="text-textPrimaryRed ">
            <AiOutlineWarning />
          </span>
          <span>User Data deletion request</span>
        </div>
        <div className="text-textSecondary">
          Enter the email and password provided by your employer
        </div>
        <InputWithTopHeader
          className="mx-0 mt-6"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <InputWithTopHeader
          className="mx-0 mt-6"
          label="Password"
          inputType="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button
          label="Submit"
          onClick={() => onSubmit()}
          disabled={!email || !password}
          type="blue"
          className="py-2 mt-6"
        />
      </div>

      <Dialog
        opened={successModal}
        setOpened={setSuccessModal}
        title="Request submitted successfully"
        size="auto"
        negativeLabel=""
        positiveLabel="Ok"
      >
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-lg">
            Your data deletion request has been submitted successfully!
          </span>

          <span className="text-textSecondary">
            If you have entered correct details then your request will be
            accepted soon!
          </span>
        </div>
      </Dialog>
    </div>
  );
};

export default UserDataDeletionRequest;
