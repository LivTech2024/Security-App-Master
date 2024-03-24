import { useDrag, useDrop } from "react-dnd";

interface DraggableProps {
  children: React.ReactNode;
  draggableId: string;
  type: string;
  canDrag?: boolean;
  callback: (draggableId: string, dropPointId: string) => void;
}

export const Draggable = ({
  children,
  draggableId,
  type,
  canDrag,
  callback,
}: DraggableProps) => {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type,
      item: { children, draggableId },
      end: (item, monitor) => {
        const dropResult = monitor.getDropResult<{ id: string }>();
        if (item && dropResult) {
          callback(item.draggableId, dropResult.id);
          console.log(`You dropped ${item.draggableId} into ${dropResult.id}`);
        }
      },
      canDrag,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
        handlerId: monitor.getHandlerId(),
      }),
    }),
    [draggableId, children]
  );

  return (
    <tr
      ref={drag}
      className=" pb-1 text-sm"
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: "move",
      }}
    >
      {children}
    </tr>
  );
};

interface DropPointProps {
  accept: string;
  className: string;
  id: string;
  children?: React.ReactNode;
  activeClassName?: string;
}

export const DropPoint = ({
  accept,
  className,
  id,
  children,
  activeClassName,
}: DropPointProps) => {
  const [{ canDrop, isOver }, drop] = useDrop(
    () => ({
      accept,
      drop: () => ({ id }),
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [id, children]
  );

  const isActive = canDrop && isOver;

  if (children) {
    return (
      <div
        ref={drop}
        data-testid={id}
        className={`${
          isActive && (activeClassName ?? "bg-gray-200")
        } ${className} `}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      ref={drop}
      data-testid={id}
      className={`${isActive && "bg-gray-200"} ${className} `}
    >
      &nbsp;
    </div>
  );
};
