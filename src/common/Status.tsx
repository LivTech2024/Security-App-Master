export const Status = ({
  status,
}: {
  status: 'pending' | 'started' | 'completed';
}) => {
  return (
    <div className="flex items-center gap-2">
      {status === 'pending' ? (
        <div className="w-[12px] h-[12px] rounded-full bg-primaryGold">
          &nbsp;
        </div>
      ) : status === 'started' ? (
        <div className="w-[12px] h-[12px] rounded-full bg-primaryRed">
          &nbsp;
        </div>
      ) : (
        <div className="w-[12px] h-[12px] rounded-full bg-primaryGreen">
          &nbsp;
        </div>
      )}
      <span className="capitalize font-medium">{status}</span>
    </div>
  );
};