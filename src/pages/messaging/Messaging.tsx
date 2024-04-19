import Button from '../../common/button/Button';
import { formatDate } from '../../utilities/misc';

const Messaging = () => {
  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
        <span className="font-semibold text-xl">Messaging</span>
        <Button label="New Message" onClick={() => {}} type="black" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface p-4 rounded shadow-md flex flex-col gap-6">
          <div className="font-semibold text-lg">Received</div>
          {/* Received Messages list */}
          <div className="flex flex-col h-[calc(100vh-260px)] gap-4 overflow-auto remove-vertical-scrollbar">
            <div className="flex flex-col bg-onHoverBg p-4 rounded w-full gap-2">
              <div>
                From: <span className="font-semibold">Yuvraj Singh</span>
              </div>

              <span>
                Hello how are you! Lorem ipsum dolor sit amet, consectetur
                adipisicing elit. Nemo dicta autem sit officia aspernatur odio
                doloribus dolores ipsum repellat. Deleniti inventore,
                praesentium minus officiis velit laboriosam odio cumque labore
                dicta.
              </span>
              <span className="text-sm mt-2 font-medium">
                {formatDate(new Date(), 'hh:mm A - DD MMM')}
              </span>
            </div>
            <div className="flex flex-col bg-onHoverBg p-4 rounded w-full gap-2">
              <div>
                From: <span className="font-semibold">Yuvraj Singh</span>
              </div>

              <span>
                Hello how are you! Lorem ipsum dolor sit amet, consectetur
                adipisicing elit. Nemo dicta autem sit officia aspernatur odio
                doloribus dolores ipsum repellat. Deleniti inventore,
                praesentium minus officiis velit laboriosam odio cumque labore
                dicta.
              </span>
              <span className="text-sm mt-2 font-medium">
                {formatDate(new Date(), 'hh:mm A - DD MMM')}
              </span>
            </div>
            <div className="flex flex-col bg-onHoverBg p-4 rounded w-full gap-2">
              <div>
                From: <span className="font-semibold">Yuvraj Singh</span>
              </div>

              <span>
                Hello how are you! Lorem ipsum dolor sit amet, consectetur
                adipisicing elit. Nemo dicta autem sit officia aspernatur odio
                doloribus dolores ipsum repellat. Deleniti inventore,
                praesentium minus officiis velit laboriosam odio cumque labore
                dicta.
              </span>
              <span className="text-sm mt-2 font-medium">
                {formatDate(new Date(), 'hh:mm A - DD MMM')}
              </span>
            </div>
            <div className="flex flex-col bg-onHoverBg p-4 rounded w-full gap-2">
              <div>
                From: <span className="font-semibold">Yuvraj Singh</span>
              </div>

              <span>
                Hello how are you! Lorem ipsum dolor sit amet, consectetur
                adipisicing elit. Nemo dicta autem sit officia aspernatur odio
                doloribus dolores ipsum repellat. Deleniti inventore,
                praesentium minus officiis velit laboriosam odio cumque labore
                dicta.
              </span>
              <span className="text-sm mt-2 font-medium">
                {formatDate(new Date(), 'hh:mm A - DD MMM')}
              </span>
            </div>
          </div>
        </div>
        <div className="bg-surface p-4 rounded shadow-md flex flex-col gap-4">
          <div className="font-semibold text-lg">Sent</div>
          {/*Sent Messages list */}
          <div className="flex flex-col h-[calc(100vh-260px)] gap-4 overflow-auto remove-vertical-scrollbar">
            <div className="flex flex-col bg-onHoverBg p-4 rounded w-full gap-2">
              <div>
                To: <span className="font-semibold">Jhon Doe</span>
              </div>

              <span>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Animi
                iste distinctio veniam dolor! Ullam eligendi ex id voluptatem
                deleniti earum! Aliquam sapiente nesciunt sed itaque facere
                dolores. Tempore, deleniti sunt?
              </span>
              <span className="text-sm mt-2 font-medium">
                {formatDate(new Date(), 'hh:mm A - DD MMM')}
              </span>
            </div>
            <div className="flex flex-col bg-onHoverBg p-4 rounded w-full gap-2">
              <div>
                To: <span className="font-semibold">Jhon Doe</span>
              </div>

              <span>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Animi
                iste distinctio veniam dolor! Ullam eligendi ex id voluptatem
                deleniti earum! Aliquam sapiente nesciunt sed itaque facere
                dolores. Tempore, deleniti sunt?
              </span>
              <span className="text-sm mt-2 font-medium">
                {formatDate(new Date(), 'hh:mm A - DD MMM')}
              </span>
            </div>
            <div className="flex flex-col bg-onHoverBg p-4 rounded w-full gap-2">
              <div>
                To: <span className="font-semibold">Jhon Doe</span>
              </div>

              <span>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Animi
                iste distinctio veniam dolor! Ullam eligendi ex id voluptatem
                deleniti earum! Aliquam sapiente nesciunt sed itaque facere
                dolores. Tempore, deleniti sunt?
              </span>
              <span className="text-sm mt-2 font-medium">
                {formatDate(new Date(), 'hh:mm A - DD MMM')}
              </span>
            </div>
            <div className="flex flex-col bg-onHoverBg p-4 rounded w-full gap-2">
              <div>
                To: <span className="font-semibold">Jhon Doe</span>
              </div>

              <span>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Animi
                iste distinctio veniam dolor! Ullam eligendi ex id voluptatem
                deleniti earum! Aliquam sapiente nesciunt sed itaque facere
                dolores. Tempore, deleniti sunt?
              </span>
              <span className="text-sm mt-2 font-medium">
                {formatDate(new Date(), 'hh:mm A - DD MMM')}
              </span>
            </div>
            <div className="flex flex-col bg-onHoverBg p-4 rounded w-full gap-2">
              <div>
                To: <span className="font-semibold">Jhon Doe</span>
              </div>

              <span>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Animi
                iste distinctio veniam dolor! Ullam eligendi ex id voluptatem
                deleniti earum! Aliquam sapiente nesciunt sed itaque facere
                dolores. Tempore, deleniti sunt?
              </span>
              <span className="text-sm mt-2 font-medium">
                {formatDate(new Date(), 'hh:mm A - DD MMM')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messaging;
