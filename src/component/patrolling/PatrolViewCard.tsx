import LazyLoad from 'react-lazyload';
import {
  IPatrolLogsCollection,
  IPatrolsCollection,
} from '../../@types/database';
import TimelineVertical from '../../common/TimelineVertical';
import { formatDate, toDate } from '../../utilities/misc';

const PatrolViewCard = ({
  patrolData,
  patrolLogData,
}: {
  patrolLogData: IPatrolLogsCollection;
  patrolData: IPatrolsCollection;
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
        <div className="flex flex-col">
          <div className="text-textSecondary capitalize">Status:</div>
          <div className="flex items-center gap-2">
            <div
              className={`w-[12px] h-[12px] rounded-full ${
                patrolLogData.PatrolLogStatus === 'started'
                  ? 'bg-primaryRed'
                  : 'bg-primaryGreen'
              } `}
            >
              &nbsp;
            </div>
            <div className="capitalize">
              {patrolLogData.PatrolLogStatus}{' '}
              {patrolLogData.PatrolLogPatrolCount} .
            </div>

            <span className="mt-[2px]">Guard: </span>
            <div className="font-semibold mt-[2px]">
              {patrolLogData.PatrolLogGuardName}
            </div>
          </div>
        </div>
      </div>

      {patrolLogData.PatrolLogFeedbackComment && (
        <div className="mb-4">
          <span className="font-semibold">Feedback: </span>{' '}
          {patrolLogData.PatrolLogFeedbackComment}
        </div>
      )}

      <div className="mb-4">
        <div className="font-semibold">Checkpoints:</div>

        <div className="flex gap-4 flex-wrap">
          <TimelineVertical
            timelineItems={patrolLogData.PatrolLogCheckPoints.sort(
              (a, b) =>
                toDate(a?.CheckPointReportedAt)?.getTime() -
                toDate(b?.CheckPointReportedAt)?.getTime()
            ).map((ch) => {
              return {
                icon: '',
                text: ch.CheckPointName,
                isActive: ch.CheckPointStatus === 'checked',
                description: (
                  <div className="flex flex-col">
                    <span>
                      Status:{' '}
                      <span className="capitalize font-medium">
                        {ch.CheckPointStatus}
                      </span>{' '}
                    </span>
                    {ch.CheckPointFailureReason && (
                      <span>Failure reason: {ch.CheckPointFailureReason}</span>
                    )}
                    {ch.CheckPointImage && ch.CheckPointImage?.length > 0 ? (
                      <span className="flex flex-col">
                        <span>Images: </span>
                        <div className="flex items-center gap-4 flex-wrap">
                          {ch.CheckPointImage?.map((img) => {
                            return (
                              <a
                                href={img}
                                target="_blank"
                                className="text-textPrimaryBlue"
                              >
                                <LazyLoad height={100}>
                                  <img
                                    src={img}
                                    alt=""
                                    className="w-[100px] h-[100px] rounded object-cover"
                                  />
                                </LazyLoad>
                              </a>
                            );
                          })}{' '}
                        </div>
                      </span>
                    ) : null}
                    {ch.CheckPointComment && (
                      <span className="mt-2">
                        Comment: {ch.CheckPointComment}
                      </span>
                    )}
                    <span className="text-textTertiary">
                      {formatDate(ch.CheckPointReportedAt, 'hh:mm A')}
                    </span>
                  </div>
                ),
              };
            })}
          />
        </div>
      </div>

      <div className="mb-4 text-textTertiary">
        Last updated:{' '}
        {formatDate(patrolLogData.PatrolLogCreatedAt, 'DD MMM-YY hh:mm A')}
      </div>
    </div>
  );
};

export default PatrolViewCard;
