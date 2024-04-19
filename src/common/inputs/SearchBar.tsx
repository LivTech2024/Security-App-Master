import { MdOutlineSearch } from 'react-icons/md'

interface SearchBarProps {
  placeholder?: string
  icon?: JSX.Element
  className?: string
  parentClassName?: string
  value: string
  setValue: React.Dispatch<React.SetStateAction<string>>
  shouldChangeBgOnFocus?: boolean
}

const SearchBar = ({
  placeholder,
  icon,
  className,
  parentClassName = 'w-full',
  value,
  setValue,
  shouldChangeBgOnFocus = false,
}: SearchBarProps) => {
  return (
    <div
      className={`gap-1 flex flex-col max-w-sm justify-between ${parentClassName}`}
    >
      <div
        className={`${className} ${
          shouldChangeBgOnFocus
            ? 'bg-popupMenuSearchBarBg  focus-within:bg-surfaceLight border border-popupMenuSearchBarBg  focus-within:border-inputBorder '
            : 'bg-surface  border-inputBorder border'
        } flex justify-center rounded items-center w-full h-10`}
      >
        <div className="p-2 h-full flex justify-center items-center cursor-pointer  mr-0">
          <span className="flex items-center justify-center">
            {icon ? icon : <MdOutlineSearch size={22} />}
          </span>
        </div>
        <input
          onChange={(e) => setValue(e.target.value)}
          value={value}
          type="text"
          style={{ background: 'transparent' }}
          className="w-full outline-none pr-0 bg-transparent"
          placeholder={placeholder ? placeholder : 'Search'}
        />
      </div>
    </div>
  )
}

export default SearchBar
