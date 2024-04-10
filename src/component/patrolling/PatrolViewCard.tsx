import { IPatrolsCollection } from "../../@types/database";
import TimelineVertical from "../../common/TimelineVertical";
import { formatDate } from "../../utilities/misc";

const PatrolViewCard = ({ patrolData }: { patrolData: IPatrolsCollection }) => {
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
          Required count: {patrolData.PatrolRequiredCount}
        </p>
      </div>
      <div className="mb-4">
        <div className="flex flex-col">
          <div className="text-textSecondary capitalize">Status:</div>
          {patrolData?.PatrolCurrentStatus.length > 0 ? (
            patrolData?.PatrolCurrentStatus?.map((data, idx) => {
              return (
                <div
                  key={data.StatusReportedById}
                  className="flex items-center gap-2"
                >
                  <span>{idx + 1}.</span>
                  <div
                    className={`w-[12px] h-[12px] rounded-full ${
                      data.Status === "pending"
                        ? "bg-primaryGold"
                        : data.Status === "started"
                        ? "bg-primaryRed"
                        : "bg-primaryGreen"
                    } `}
                  >
                    &nbsp;
                  </div>
                  <div className="capitalize">
                    {data.Status} {data.StatusCompletedCount ?? 0}/
                    {patrolData.PatrolRequiredCount} .
                  </div>

                  <span className="mt-[2px]">Guard: </span>
                  <div className="font-semibold mt-[2px]">
                    {data?.StatusReportedByName ?? "No guards assigned"}
                  </div>
                </div>
              );
            })
          ) : (
            <div>No assigned guards</div>
          )}
        </div>
        {patrolData.PatrolFailureReason && (
          <div className="text-textSecondary">
            Failure Reason: {patrolData.PatrolFailureReason}
          </div>
        )}
      </div>
      <div className="mb-4">
        <div className="font-semibold">Checkpoints:</div>

        {patrolData.PatrolCurrentStatus.length > 0 ? (
          patrolData.PatrolCurrentStatus?.map((data, idx) => {
            return (
              <div key={idx} className="flex gap-4 flex-wrap">
                <div className="flex flex-col gap-2 mt-2">
                  <div>
                    {idx + 1}. Guard:{" "}
                    <span className="font-semibold">
                      {" "}
                      {data.StatusReportedByName || "No guard assigned"}
                    </span>
                  </div>
                  <TimelineVertical
                    timelineItems={patrolData.PatrolCheckPoints.map((ch) => {
                      return {
                        icon: "",
                        text: ch.CheckPointName,
                        isActive:
                          ch.CheckPointStatus?.find(
                            (s) =>
                              s?.StatusReportedById === data?.StatusReportedById
                          )?.Status === "checked"
                            ? true
                            : false,
                        description: (
                          <div className="flex flex-col">
                            <span>
                              Status:{" "}
                              <span className="capitalize font-medium">
                                {ch.CheckPointStatus?.find(
                                  (s) =>
                                    s?.StatusReportedById ===
                                    data?.StatusReportedById
                                )?.Status === "checked"
                                  ? "Checked"
                                  : "Not checked"}
                              </span>{" "}
                            </span>
                            {ch.CheckPointStatus?.find(
                              (s) =>
                                s?.StatusReportedById ===
                                data?.StatusReportedById
                            )?.StatusFailureReason && (
                              <span>
                                Failure reason:{" "}
                                {
                                  ch.CheckPointStatus?.find(
                                    (s) =>
                                      s?.StatusReportedById ===
                                      data?.StatusReportedById
                                  )?.StatusFailureReason
                                }
                              </span>
                            )}
                            {ch.CheckPointStatus?.find(
                              (s) =>
                                s?.StatusReportedById ===
                                data?.StatusReportedById
                            )?.StatusReportedTime && (
                              <span className="text-textTertiary">
                                {formatDate(
                                  ch.CheckPointStatus?.find(
                                    (s) =>
                                      s?.StatusReportedById ===
                                      data?.StatusReportedById
                                  )?.StatusReportedTime,
                                  "hh:mm A"
                                )}
                              </span>
                            )}
                          </div>
                        ),
                      };
                    })}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <TimelineVertical
            timelineItems={patrolData.PatrolCheckPoints.map((ch) => {
              return {
                icon: "",
                text: ch.CheckPointName,
                isActive: false,
                description: (
                  <div className="flex flex-col">
                    <span>
                      Status:{" "}
                      <span className="capitalize font-medium">
                        Not checked
                      </span>{" "}
                    </span>
                  </div>
                ),
              };
            })}
          />
        )}
      </div>

      <div className="mb-4 text-textTertiary">
        Last updated:{" "}
        {formatDate(patrolData.PatrolModifiedAt, "DD MMM-YY hh:mm A")}
      </div>
    </div>
  );
};

export default PatrolViewCard;
