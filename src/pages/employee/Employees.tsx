import { useEffect, useState } from "react";
import AddEmployeeModal from "../../component/employees/modal/AddEmployeeModal";

interface User {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  role: string;
}

const Employees = () => {
  const [addEmployeeDialog, setAddEmployeeDialog] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("api/user/getusers");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

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
          {users.map((user, index) => (
            <tr
              key={index}
              onClick={() => setAddEmployeeDialog(true)}
              className="cursor-pointer"
            >
              <td className="px-4 py-2 text-center">{user.first_name}</td>
              <td className="px-4 py-2 text-center">{user.last_name}</td>
              <td className="px-4 py-2 text-center">{user.email}</td>
              <td className="px-4 py-2 text-center">{user.phone_number}</td>
              <td className="px-4 py-2 text-center">{user.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Employees;
