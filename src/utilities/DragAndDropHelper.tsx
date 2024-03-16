import { useDrag, useDrop } from "react-dnd";

export const Box = ({ id, shift }: { id: string; shift: string }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "box",
    item: { shift, id },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult<{ id: string }>();
      if (item && dropResult) {
        alert(`You dropped ${item.shift} into user!`);
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
      handlerId: monitor.getHandlerId(),
    }),
  }));

  return (
    <div
      ref={drag}
      className=" pb-1 text-sm"
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: "move",
      }}
    >
      {shift}
    </div>
  );
};

export const Dustbin = () => {
  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    accept: "box",
    drop: () => ({ name: "Dustbin" }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const isActive = canDrop && isOver;

  return (
    <div
      ref={drop}
      data-testid="dustbin"
      className={`${isActive ? "bg-gray-300" : "bg-gray-200"} w-full h-[60px]`}
    >
      &nbsp;
    </div>
  );
};
