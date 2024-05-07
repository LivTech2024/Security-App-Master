import PageHeader from '../../common/PageHeader';
import Button from '../../common/button/Button';

const TaskList = () => {
  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <PageHeader
        title="Task assignment and tracking"
        rightSection={
          <Button label="Create new task" type="black" onClick={() => {}} />
        }
      />
    </div>
  );
};

export default TaskList;
