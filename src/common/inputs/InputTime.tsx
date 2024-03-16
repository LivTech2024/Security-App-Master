import React, { useEffect, useState } from "react";
import { AiOutlineClockCircle } from "react-icons/ai";

import PopupMenu from "../PopupMenu";
import InputHeader from "./InputHeader";

interface InputTimeProps {
  label?: string;
  fontClassName?: string;
  value: string;
  onChange: React.Dispatch<React.SetStateAction<string>>;
  use12Hours?: boolean;
  disabled?: boolean;
  showSeconds?: boolean;
}

const InputTime = ({
  value,
  disabled,
  fontClassName,
  label,
  onChange,
  use12Hours,
  showSeconds = false,
}: InputTimeProps) => {
  const [dropdown, setDropdown] = useState(false);

  const minutesArray = Array.from({ length: 60 }, (_, i) => i + 0);

  const secondsArray = Array.from({ length: 60 }, (_, i) => i + 0);

  const [hrs, setHrs] = useState(value.slice(0, 2));

  const [mins, setMins] = useState(value.slice(3, 5));

  const [sec, setSec] = useState(value?.slice(6, 8));

  const [scrolled, setScrolled] = useState(false);

  const [hoursFormat, setHoursFormat] = useState(
    showSeconds ? value?.slice(9) : value.slice(6)
  );

  const hoursArray = Array.from(
    { length: use12Hours ? 12 : 24 },
    use12Hours ? (_, i) => i + 1 : (_, i) => i + 0
  );

  useEffect(() => {
    if (!showSeconds) {
      onChange(hrs + ":" + mins + " " + hoursFormat);
    } else if (use12Hours) {
      onChange(hrs + ":" + mins + ":" + sec + " " + hoursFormat);
    } else {
      onChange(hrs + ":" + mins);
    }
  }, [mins, hrs, hoursFormat]);

  const scrollToDiv = (id: string) => {
    if (!id) return;
    const element = document.querySelector("#" + id);
    if (element) {
      element.scrollIntoView({ behavior: "auto", inline: "nearest" });
    }
  };

  useEffect(() => {
    if (!dropdown && scrolled) {
      setScrolled(false);
    }
    if (dropdown && !scrolled) {
      setTimeout(() => {
        scrollToDiv("hh" + hrs);
        scrollToDiv("mm" + mins);
        scrollToDiv("ss" + sec);
        setScrolled(true);
      }, 100);
    }
  }, [dropdown, scrolled, hrs, mins, sec]);

  return (
    <div className={` gap-1 flex flex-col w-full `}>
      {label ? (
        <InputHeader title={label} fontClassName={fontClassName} />
      ) : null}
      <div className="flex items-center w-full border-[1px] border-inputBorder  rounded ">
        <PopupMenu
          opened={dropdown}
          setOpened={setDropdown}
          width="auto"
          position="bottom"
          target={
            <input
              value={value}
              type="text"
              className={`w-full text-lg py-2 pl-2
               outline-none  pr-2`}
              disabled={disabled}
              onClick={() => setDropdown(!dropdown)}
            />
          }
        >
          <div className="flex justify-start p-4">
            <div className="flex flex-col h-[200px] overflow-scroll remove-vertical-scrollbar">
              {hoursArray.map((h) => {
                return (
                  <span
                    id={"hh" + h}
                    onClick={() =>
                      setHrs(h < 10 ? "0" + h.toString() : h.toString())
                    }
                    className={`${
                      hrs === (h < 10 ? "0" + h.toString() : h.toString())
                        ? "bg-secondary text-surface"
                        : "hover:bg-switchSecondaryBlueBg"
                    } py-2 px-[14px] flex justify-center items-center cursor-pointer rounded-md text-sm`}
                    key={h}
                  >
                    {h < 10 ? "0" + h : h}
                  </span>
                );
              })}
            </div>

            <div className="flex flex-col h-[200px] overflow-scroll remove-vertical-scrollbar">
              {minutesArray.map((m) => {
                return (
                  <span
                    id={"mm" + m}
                    onClick={() => {
                      setMins(m < 10 ? "0" + m.toString() : m.toString());
                      !use12Hours && !showSeconds && setDropdown(false);
                    }}
                    className={`${
                      mins === (m < 10 ? "0" + m.toString() : m.toString())
                        ? "bg-secondary text-surface"
                        : "hover:bg-switchSecondaryBlueBg"
                    } py-2 px-[14px] flex justify-center items-center cursor-pointer rounded-md text-sm`}
                    key={m}
                  >
                    {m < 10 ? "0" + m : m}
                  </span>
                );
              })}
            </div>

            {showSeconds && (
              <div className="flex flex-col h-[200px] overflow-scroll remove-vertical-scrollbar">
                {secondsArray.map((m) => {
                  return (
                    <span
                      id={"ss" + m}
                      onClick={() => {
                        setSec(m < 10 ? "0" + m.toString() : m.toString());
                        !use12Hours && setDropdown(false);
                      }}
                      className={`${
                        sec === (m < 10 ? "0" + m.toString() : m.toString())
                          ? "bg-secondary text-surface"
                          : "hover:bg-switchSecondaryBlueBg"
                      } py-2 px-[14px] flex justify-center items-center cursor-pointer rounded-md text-sm`}
                      key={m}
                    >
                      {m < 10 ? "0" + m : m}
                    </span>
                  );
                })}
              </div>
            )}

            {use12Hours && (
              <div className="flex flex-col justify-center items-end">
                <span
                  onClick={() => {
                    setDropdown(false);
                    setHoursFormat("AM");
                  }}
                  className={`${
                    hoursFormat === "AM"
                      ? "bg-secondary text-surface"
                      : "hover:bg-switchSecondaryBlueBg"
                  } py-2 px-[14px] flex justify-center items-center cursor-pointer rounded-md text-sm`}
                >
                  AM
                </span>
                <span
                  onClick={() => {
                    setDropdown(false);
                    setHoursFormat("PM");
                  }}
                  className={`${
                    hoursFormat === "PM"
                      ? "bg-secondary text-surface"
                      : "hover:bg-switchSecondaryBlueBg"
                  } py-2 px-[14px] flex justify-center items-center cursor-pointer rounded-md text-sm`}
                >
                  PM
                </span>
              </div>
            )}
          </div>
        </PopupMenu>
        <div
          onClick={() => {
            if (!disabled) {
              setDropdown(!dropdown);
            }
          }}
          className="ml-auto px-2 pt-2 pb-[9px] h-full flex justify-center items-center cursor-pointer hover:bg-onHoverBg "
        >
          <AiOutlineClockCircle />
        </div>
      </div>
    </div>
  );
};

export default InputTime;
