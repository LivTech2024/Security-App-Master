import { twMerge } from 'tailwind-merge'

//Shimmer effect
const TableShimmer = ({ className }: { className?: string }) => {
  return (
    <div className="animate-pulse w-full mt-2">
      <div className={twMerge('h-10 bg-shimmerColor w-full', className)}></div>
    </div>
  )
}

export default TableShimmer
