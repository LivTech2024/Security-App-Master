import { useHotkeys } from "@mantine/hooks";
import React, { useEffect, useRef, useState } from "react";

import InputHeader from "./InputHeader";
import AutocompleteDropdown from "../dropdown/AutocompleteDropdown";

export interface SuggestionItem {
  label: string;
  value: string;
  description?: React.ReactNode;
  optionalSearchTag?: string;
}

interface InputAutocompleteProps {
  label?: string;
  placeholder?: string;
  className?: string;
  border?: boolean;
  fontClassName?: string;
  leadingIcon?: JSX.Element;
  tailIcon?: JSX.Element;
  data: SuggestionItem[];
  value?: string | null;
  onClick?: () => void;
  onBlur?: () => void;
  onChange: React.Dispatch<React.SetStateAction<string | null | undefined>>;
  bg?: string;
  dropdownWidth?: string;
  onTailIconClick?: () => void;
  dropDownHeader?: React.ReactNode;
  readonly?: boolean;
  isFilterReq?: boolean;
  newOptionCreatable?: boolean;
  inputMaxLength?: number;
  shouldBlurAfterInput?: boolean;
  shortcutKey?: string;
}

const InputAutoComplete = ({
  data,
  bg,
  border = true,
  className = "mx-4",
  fontClassName,
  label,
  leadingIcon,
  onChange,
  onClick,
  onBlur,
  placeholder,
  tailIcon,
  value,
  dropdownWidth,
  onTailIconClick,
  dropDownHeader,
  readonly,
  isFilterReq = true,
  newOptionCreatable = false,
  inputMaxLength,
  shouldBlurAfterInput = false,
  shortcutKey,
}: InputAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);

  const [activeSuggestion, setActiveSuggestion] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const suggestionsRef = useRef<HTMLUListElement>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value;
    if (inputMaxLength && value.length > inputMaxLength) {
      value = event.target.value.slice(0, inputMaxLength);
    }
    if (data.find((option) => option.label === value)?.value) {
      onChange(data.find((option) => option.label === value)?.value);
    } else {
      onChange(value);
    }
    if (isFilterReq) {
      const filteredSuggestions = getFilteredSuggestions(value);
      setSuggestions(filteredSuggestions);
    }
    setActiveSuggestion(null);
  };

  const getFilteredSuggestions = (value: string): SuggestionItem[] => {
    const filterFn = (item: SuggestionItem) =>
      item.label.toLowerCase().includes(value.toLowerCase());

    const filterOptionalFn = (item: SuggestionItem) =>
      item.optionalSearchTag?.toLowerCase().includes(value.toLowerCase());

    if (value.length > 0 && Array.isArray(data)) {
      const suggestionsWithLabel = data.filter((element) => filterFn(element));
      const suggestionsWithOptionalTag = data.filter((element) =>
        filterOptionalFn(element)
      );

      const combinedSuggestions = suggestionsWithLabel.concat(
        suggestionsWithOptionalTag
      );
      return combinedSuggestions.slice(0, 5);
    } else {
      return data;
    }
  };

  useEffect(() => {
    setSuggestions(data);
  }, [data]);

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setSuggestions([]);
  };

  const handleSuggestionMouseClick = (index: number) => {
    const clickedSuggestion = suggestions[index];
    onChange(clickedSuggestion.value);
    setSuggestions([]);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    try {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveSuggestion((prev) =>
          prev === null
            ? 0
            : prev === suggestions.length - 1
            ? 0
            : Math.min(prev + 1, suggestions.length - 1)
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveSuggestion((prev) =>
          prev === (null || 0)
            ? suggestions.length - 1
            : Math.max((prev || 0) - 1, 0)
        );
      } else if (event.key === "Enter" && activeSuggestion !== null) {
        shouldBlurAfterInput && inputRef.current?.blur();
        setDropdown(false);
        event.preventDefault();
        onChange(suggestions[activeSuggestion].value);
        setSuggestions([]);
      }
    } catch (error) {
      throw new Error(`Error: ${error}`);
    }
  };

  const [dropdown, setDropdown] = useState(false);

  useEffect(() => {
    try {
      if (activeSuggestion !== null && suggestionsRef.current) {
        const activeSuggestionElement = suggestionsRef.current.childNodes[
          activeSuggestion
        ] as HTMLElement;
        activeSuggestionElement.scrollIntoView({
          behavior: "auto",
          inline: "nearest",
        });
      }
    } catch (error) {
      console.log(error);
    }
  }, [activeSuggestion]);

  const handleBlur = () => {
    if (
      !value ||
      (!data.some((item) => item.value === value) &&
        !data.some((item) => item.label === value) &&
        !newOptionCreatable)
    ) {
      onChange("");
    }
    setDropdown(false);
  };

  const findLabelByValue = (value: string) => {
    const foundOption = data.find((option) => option.value === value);
    return foundOption ? foundOption.label : "";
  };

  if (shortcutKey) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useHotkeys([
      [
        shortcutKey,
        () => {
          inputRef.current?.focus();
        },
      ],
    ]);
  }

  return (
    <div className={`gap-1 flex flex-col ${className}`}>
      {label ? (
        <InputHeader title={label} fontClassName={fontClassName} />
      ) : null}
      <div
        className={`flex justify-center items-center  w-full h-9 rounded ${
          border &&
          "border border-inputBorderLight dark:border-inputBorderDark focus-within:ring-[2px] "
        } 
         dark:bg-primaryVariantDark `}
        style={{ backgroundColor: bg }}
      >
        <AutocompleteDropdown
          width={dropdownWidth ? dropdownWidth : "target"}
          position="bottom-start"
          target={
            <div className="flex justify-center items-center w-full">
              {leadingIcon ? (
                <div className="px-2 pt-2 pb-[9px] h-full flex justify-center items-center cursor-pointer hover:bg-onHoverBgLight   dark:hover:bg-onBackgroundLight">
                  {leadingIcon}
                </div>
              ) : null}
              <input
                tabIndex={0}
                type="text"
                value={
                  value
                    ? findLabelByValue(value || "").length > 0
                      ? findLabelByValue(value || "")
                      : value
                    : ""
                }
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className={`w-full text-sm py-1 dark:bg-primaryVariantDark ${
                  leadingIcon ? "pl-0" : "pl-2"
                } outline-none ${tailIcon ? "pr-0" : "pr-2"}`}
                ref={inputRef}
                onFocus={(e) => {
                  setDropdown(true);
                  e.target.value.length === 0
                    ? setSuggestions(data)
                    : handleInputChange(e);
                }}
                onBlur={() => {
                  handleBlur();
                  onBlur && onBlur();
                }}
                onClick={onClick}
                style={{ backgroundColor: bg }}
                disabled={readonly}
                placeholder={placeholder}
              />
              {tailIcon ? (
                <div
                  onClick={onTailIconClick}
                  className="px-2 pt-2 pb-[9px] h-full flex justify-center items-center cursor-pointer hover:bg-onHoverBgLight   dark:hover:bg-onSurfaceLight"
                >
                  {tailIcon}
                </div>
              ) : null}
            </div>
          }
          opened={
            (dropdown && suggestions.length > 0) ||
            (dropdown &&
              dropDownHeader &&
              inputRef.current === document.activeElement &&
              findLabelByValue(value || "").length === 0 &&
              suggestions.length === 0)
              ? true
              : false
          }
          setOpened={setDropdown}
        >
          <ul
            ref={suggestionsRef}
            className="max-h-[300px] overflow-y-scroll remove-vertical-scrollbar"
          >
            {dropDownHeader}
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                className={`px-4 py-2 cursor-pointer flex flex-col gap-1 items-start w-full  hover:text-surfaceLight group ${
                  index === activeSuggestion
                    ? "bg-secondaryLight text-surfaceLight"
                    : "hover:bg-switchSecondaryBlueBg"
                }`}
                onClick={() => {
                  setDropdown(false);
                  handleSuggestionClick(suggestion.value);
                }}
                onMouseDown={() => {
                  setDropdown(false);
                  handleSuggestionMouseClick(index);
                }}
              >
                <span className="text-sm">{suggestion.label}</span>
                <span
                  className={` ${
                    index === activeSuggestion
                      ? "bg-secondaryLight text-surfaceLight"
                      : "text-textTertiaryLight dark:text-textSecondaryDark"
                  } flex flex-col w-full   text-xs  group-hover:text-surfaceLight`}
                >
                  {suggestion.description}
                </span>
              </li>
            ))}
          </ul>
        </AutocompleteDropdown>
      </div>
    </div>
  );
};

export default InputAutoComplete;
