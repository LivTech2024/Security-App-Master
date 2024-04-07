import { errorHandler } from "../../utilities/CustomError";
import { closeModalLoader, showModalLoader } from "../../utilities/TsxUtils";
import DbSuperAdmin from "../../firebase_configs/DB/DbSuperAdmin";
import Button from "../../common/button/Button";

const CreateNewCompany = () => {
  const createNewCompany = async () => {
    try {
      showModalLoader({});
      await DbSuperAdmin.createNewCompany();

      closeModalLoader();
    } catch (error) {
      console.log(error);
      errorHandler(error);
      closeModalLoader();
    }
  };
  return (
    <div className="flex h-[80vh] justify-center items-center">
      <Button
        label="Create new company"
        onClick={createNewCompany}
        type="black"
      />
    </div>
  );
};

export default CreateNewCompany;
