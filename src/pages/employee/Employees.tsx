import { useState } from "react";
import AddEmployeeModal from "../../component/employees/modal/AddEmployeeModal";

const Employees = () => {
  const [addEmployeeDialog, setAddEmployeeDialog] = useState(false);

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
        <span className="font-semibold text-xl">Employees</span>

        <button
          onClick={() => setAddEmployeeDialog(true)}
          className="bg-primary text-surface px-4 py-2 rounded"
        >
          Create Employee
        </button>
      </div>

      <AddEmployeeModal
        opened={addEmployeeDialog}
        setOpened={setAddEmployeeDialog}
      />

      <table className="rounded overflow-hidden w-full">
        <thead className="bg-primary text-surface text-sm">
          <tr>
            <th className="uppercase px-4 py-2 w-[20%] text-center">
              First Name
            </th>
            <th className="uppercase px-4 py-2 w-[20%] text-center">
              Last Name
            </th>
            <th className="uppercase px-4 py-2 w-[20%] text-center">Email</th>
            <th className="uppercase px-4 py-2 w-[20%] text-center">
              PHONE NUMBER
            </th>
            <th className="uppercase px-4 py-2 w-[20%] text-center">Role</th>
          </tr>
        </thead>
        <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
          <tr
            onClick={() => setAddEmployeeDialog(true)}
            className="cursor-pointer"
          >
            <td className="px-4 py-2 text-center">yuvraj</td>
            <td className="px-4 py-2 text-center">singh</td>
            <td className="px-4 py-2 text-center">yuvraj</td>
            <td className="px-4 py-2 text-center">yuvraj</td>
            <td className="px-4 py-2 text-center">yuvraj</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Employees;
