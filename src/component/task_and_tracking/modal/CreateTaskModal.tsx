import { FormProvider, useForm } from 'react-hook-form';
import Dialog from '../../../common/Dialog';
import { zodResolver } from '@hookform/resolvers/zod';
import { TaskFormFields, taskSchema } from '../../../utilities/zod/schema';
import { useAuthState } from '../../../store';
import { useEffect, useState } from 'react';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../../utilities/TsxUtils';
import { errorHandler } from '../../../utilities/CustomError';
import DbCompany from '../../../firebase_configs/DB/DbCompany';
import InputWithTopHeader from '../../../common/inputs/InputWithTopHeader';
import InputDate from '../../../common/inputs/InputDate';
import InputTime from '../../../common/inputs/InputTime';
import { removeTimeFromDate } from '../../../utilities/misc';
import InputRadio from '../../../common/inputs/InputRadio';
import InputSelect from '../../../common/inputs/InputSelect';
import useFetchLocations from '../../../hooks/fetch/useFetchLocations';
import useFetchEmployees from '../../../hooks/fetch/useFetchEmployees';
import { MdClose } from 'react-icons/md';

const CreateTaskModal = ({
  opened,
  setOpened,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { company, companyBranches } = useAuthState();

  const { data: locations } = useFetchLocations({});

  const methods = useForm<TaskFormFields>({
    resolver: zodResolver(taskSchema),
  });

  const [loading, setLoading] = useState(false);

  const [selectedBranch, setSelectedBranch] = useState('');

  const [startDate, setStartDate] = useState<Date | null>(null);

  const [startTime, setStartTime] = useState('');

  const [empSearchQuery, setEmpSearchQuery] = useState('');

  const [selectedEmployee, setSelectedEmployee] = useState('');

  const { data: employees } = useFetchEmployees({
    limit: 5,
    searchQuery: empSearchQuery,
  });

  const [selectedEmps, setSelectedEmps] = useState<
    { id: string; name: string }[]
  >([]);

  useEffect(() => {
    if (selectedEmployee && selectedEmployee.length > 0) {
      setSelectedEmps((prev) => {
        if (prev.find((rec) => rec.id === selectedEmployee)) {
          return prev;
        }
        const empName = employees.find(
          (emp) => emp.EmployeeId === selectedEmployee
        )?.EmployeeName;
        return [...prev, { id: selectedEmployee, name: empName || '' }];
      });
    }
    setSelectedEmployee('');
    setEmpSearchQuery('');
  }, [selectedEmployee]);

  useEffect(() => {
    if (startDate) {
      methods.setValue('TaskStartDate', removeTimeFromDate(startDate));
    }
  }, [startDate]);

  useEffect(() => {
    if (startTime) {
      methods.setValue('TaskStartTime', startTime);
    }
  }, [startTime]);

  const [assignTo, setAssignTo] = useState<
    'location' | 'employees' | 'all_employees'
  >('location');

  useEffect(() => {
    if (assignTo === 'all_employees') {
      methods.setValue('TaskIsAllotedToAllEmps', true);
    }
  }, [assignTo]);

  console.log(methods.watch('TaskAllotedLocationId'));

  const onSubmit = async (data: TaskFormFields) => {
    if (!company) return;

    try {
      setLoading(true);

      await DbCompany.createNewTask(company.CompanyId, data);

      showSnackbar({ message: 'Task created successfully', type: 'success' });

      setLoading(false);
    } catch (error) {
      console.log(error);
      errorHandler(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loading) {
      showModalLoader({});
    } else {
      closeModalLoader();
    }
    return () => closeModalLoader();
  }, [loading]);

  return (
    <Dialog
      opened={opened}
      setOpened={setOpened}
      title="Create Task"
      size="80%"
      positiveLabel="Submit"
      positiveCallback={methods.handleSubmit(onSubmit)}
      isFormModal
    >
      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit(onSubmit)}
          className="grid grid-cols-3 gap-4 items-start"
        >
          <InputWithTopHeader
            className="mx-0 col-span-2"
            label="Task Description"
            register={methods.register}
            name="TaskDescription"
            error={methods.formState.errors.TaskDescription?.message}
          />

          <InputDate
            label="Start Date"
            value={startDate}
            setValue={setStartDate}
            error={methods.formState.errors.TaskStartDate?.message}
          />
          <InputWithTopHeader
            className="mx-0 w-full"
            label="For Days"
            register={methods.register}
            name="TaskForDays"
            error={methods.formState.errors.TaskForDays?.message}
          />

          <InputTime
            label="Task Start Time"
            value={startTime}
            onChange={setStartTime}
            error={methods.formState.errors.TaskStartTime?.message}
          />
          <InputSelect
            label="Select Branch"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e as string)}
            data={[
              { label: 'All branch', value: '' },
              ...companyBranches.map((branches) => {
                return {
                  label: branches.CompanyBranchName,
                  value: branches.CompanyBranchId,
                };
              }),
            ]}
          />

          <InputRadio
            type="checkbox"
            label="Assign to location"
            checked={assignTo === 'location'}
            onChange={() => setAssignTo('location')}
          />
          <InputRadio
            type="checkbox"
            label="Assign to employees"
            checked={assignTo === 'employees'}
            onChange={() => setAssignTo('employees')}
          />
          <InputRadio
            type="checkbox"
            label="Assign to all employees"
            checked={assignTo === 'all_employees'}
            onChange={() => setAssignTo('all_employees')}
          />

          {assignTo === 'location' ? (
            <InputSelect
              label="Select location"
              value={methods.watch('TaskAllotedLocationId') || ''}
              onChange={(e) =>
                methods.setValue('TaskAllotedLocationId', e as string)
              }
              data={locations.map((loc) => {
                return {
                  label: loc.LocationName,
                  value: loc.LocationId,
                };
              })}
              clearable
              error={methods.formState.errors.TaskAllotedLocationId?.message}
            />
          ) : (
            assignTo === 'employees' && (
              <div className="flex flex-col gap-4 col-span-3">
                <InputSelect
                  className="mx-0 w-full"
                  label="Select employee"
                  data={employees.map((res) => {
                    return { label: res.EmployeeName, value: res.EmployeeId };
                  })}
                  value={selectedEmployee}
                  searchValue={empSearchQuery}
                  onSearchChange={setEmpSearchQuery}
                  onChange={(e) => setSelectedEmployee(e as string)}
                  searchable
                />

                <div className="flex flex-col col-span-3">
                  <span className="font-semibold">Selected Employees:</span>

                  <div className="grid grid-cols-3 gap-2  max-h-[120px] overflow-scroll remove-vertical-scrollbar py-2">
                    {selectedEmps.map((rec, idx) => {
                      return (
                        <span className="bg-onHoverBg p-2 rounded flex justify-between gap-4 w-full">
                          <span>
                            {idx + 1}. {rec.name}
                          </span>
                          <MdClose
                            className="text-textPrimaryRed text-xl cursor-pointer"
                            onClick={() =>
                              setSelectedEmps((prev) =>
                                prev.filter((i) => i.id !== rec.id)
                              )
                            }
                          />
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            )
          )}
        </form>
      </FormProvider>
    </Dialog>
  );
};

export default CreateTaskModal;
