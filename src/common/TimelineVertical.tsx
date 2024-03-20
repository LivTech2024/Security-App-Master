import React from "react";

interface TimelineVerticalProps {
  timelineItems: {
    icon: React.ReactNode;
    text: string;
    isActive: boolean;
    description?: React.ReactNode;
  }[];
}

const TimelineVertical = ({ timelineItems }: TimelineVerticalProps) => {
  return (
    <div className="flex flex-col items-center">
      {timelineItems.map((data, index) => {
        return (
          <div
            key={data.text + index}
            className="flex gap-2 justify-start w-full"
          >
            <div className="flex flex-col items-center">
              <div
                className={`min-h-[30px] min-w-[30px] flex justify-center items-center p-2 rounded-full shadow-md ${
                  data.isActive ? "bg-primaryGreen" : "bg-gray-200"
                } `}
              >
                {data.icon}
              </div>
              {index < timelineItems.length - 1 && (
                <div
                  className={`min-h-[50px] flex-grow w-0.5  ${
                    data.isActive ? "bg-primaryGreen" : "bg-gray-200"
                  }`}
                ></div>
              )}
            </div>
            <div className="flex flex-col">
              <div className="font-medium mt-[4px]">{data.text}</div>
              {data.description}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TimelineVertical;
