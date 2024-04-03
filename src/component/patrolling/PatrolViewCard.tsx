import { IPatrolsCollection } from "../../@types/database";
import TimelineVertical from "../../common/TimelineVertical";
import { formatDate } from "../../utilities/misc";

const PatrolViewCard = ({
  patrolData,
  assignedGuards,
}: {
  patrolData: IPatrolsCollection;
  assignedGuards: string[];
}) => {
  return (
    <div className="bg-surface border border-gray-300 shadow-md rounded-lg px-4 pt-4 mb-4">
      <div className="mb-2">
        <div className="text-xl font-semibold">{patrolData.PatrolName}</div>
        <span className="text-textTertiary">
          {patrolData.PatrolLocationName}
        </span>
      </div>
      <div className="mb-4">
        <p className="text-textSecondary">
          Assigned Guard:{" "}
          {assignedGuards.length > 0
            ? assignedGuards.join(" , ")
            : "No guards assigned"}
        </p>
        <p className="text-textSecondary">Time: {patrolData.PatrolTime}</p>
        <p className="text-textSecondary">
          Required count: {patrolData.PatrolRequiredCount}
        </p>
        <p className="text-textSecondary">
          Completed count: {patrolData.PatrolCompletedCount}
        </p>
      </div>
      <div className="mb-4">
        <div className="flex items-end">
          <span className="text-textSecondary capitalize">Status:</span>
          <div className="flex items-center gap-2 ml-2">
            <span className="capitalize font-medium text-textSecondary">
              {patrolData.PatrolCurrentStatus}
            </span>
            {patrolData.PatrolCurrentStatus === "pending" ? (
              <div className="w-[12px] h-[12px] rounded-full bg-primaryGold ">
                &nbsp;
              </div>
            ) : patrolData.PatrolCurrentStatus === "started" ? (
              <div className="w-[12px] h-[12px] rounded-full bg-primaryRed ">
                &nbsp;
              </div>
            ) : (
              <div className="w-[12px] h-[12px] rounded-full bg-primaryGreen ">
                &nbsp;
              </div>
            )}
            <span>
              {patrolData.PatrolCompletedCount}/{patrolData.PatrolRequiredCount}
            </span>
          </div>
        </div>
        {patrolData.PatrolFailureReason && (
          <div className="text-textSecondary">
            Failure Reason: {patrolData.PatrolFailureReason}
          </div>
        )}
      </div>
      <div className="mb-4">
        <div className="font-semibold">Checkpoints:</div>
        <div className="flex flex-col mt-4">
          <TimelineVertical
            timelineItems={patrolData.PatrolCheckPoints.sort((a, b) =>
              a.CheckPointStatus.localeCompare(b.CheckPointStatus)
            ).map((ch) => {
              return {
                icon: "",
                text: ch.CheckPointName,
                isActive: ch.CheckPointStatus === "checked",
                description: (
                  <div className="flex flex-col">
                    <span>
                      Status:{" "}
                      <span className="capitalize font-medium">
                        {ch.CheckPointStatus === "checked"
                          ? "Checked"
                          : "Not checked"}
                      </span>{" "}
                    </span>
                    {ch.CheckPointFailureReason && (
                      <span>Failure reason: {ch.CheckPointFailureReason}</span>
                    )}
                    {ch.CheckPointCheckedTime && (
                      <span className="text-textTertiary">
                        {formatDate(ch.CheckPointCheckedTime, "hh:mm A")}
                      </span>
                    )}
                  </div>
                ),
              };
            })}
          />
        </div>
      </div>

      <div className="mb-4 text-textTertiary">
        Last updated:{" "}
        {formatDate(patrolData.PatrolModifiedAt, "DD MMM-YY hh:mm A")}
      </div>
    </div>
  );
};

export default PatrolViewCard;
