import React, { ChangeEvent, useEffect, useRef, useState } from "react";

/* import { useTypedDispatch } from '@/hooks/useTypedDispatch';
import { setSnackbar } from '@/store/slices/UI.slice'; */
interface InputOtpProps {
  title: string;
  setOtp: React.Dispatch<React.SetStateAction<string>>;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  resendOtp: () => void;
  isResendOtpDisabled: boolean;
  isChangeReq?: boolean;
  loading: boolean;
}

const InputOtp = ({
  setOtp,
  title,
  resendOtp,
  isResendOtpDisabled,
  setShow,
  isChangeReq = true,
  loading,
}: InputOtpProps) => {
  //const dispatch = useTypedDispatch();

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const [seconds, setSeconds] = useState(30);

  const attemptsLeftRef = useRef(3);

  useEffect(() => {
    let interval: number | null = null;
    if (seconds > 0) {
      interval = setInterval(() => {
        setSeconds((seconds) => seconds - 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => clearInterval(interval ?? 0);
  }, [seconds]);

  const handleResendOTP = () => {
    if (attemptsLeftRef.current > 0 && !isResendOtpDisabled) {
      attemptsLeftRef.current -= 1;
      resendOtp();
      setSeconds(30);
      /* dispatch(
        setSnackbar({
          open: true,
          message: `${attemptsLeftRef.current} attempts left`,
          type: 'info'
        })
      ); */
    } else {
      /* dispatch(
        setSnackbar({
          open: true,
          message: 'No attempts left, please try after sometime',
          type: 'error'
        })
      ); */
    }
  };

  function handleInputChange(e: ChangeEvent<HTMLInputElement>, index: number) {
    const value = e.target.value;

    if (
      value.length === 1 &&
      index < inputRefs.length - 1 &&
      inputRefs[index + 1].current
    ) {
      inputRefs[index + 1].current?.focus();
    }
    const otpArray = inputRefs.map((ref) => ref.current?.value);
    setOtp(otpArray.join(""));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleInputKeyDown(e: any, index: number) {
    if (e.key === "Backspace" && !e.target.value && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  }

  function handleInput(e: React.FormEvent<HTMLInputElement>) {
    const pattern = /^[\d\b]+$/;
    const inputVal = e.currentTarget.value;
    if (!pattern.test(inputVal)) {
      e.currentTarget.value = inputVal.replace(/\D/g, "");
    }
  }

  return (
    <div className="flex flex-col w-full gap-[6px]">
      <div className="flex items-start gap-1 w-full">
        <span className="text-xs line-clamp-2 font-medium">{title}</span>
        {isChangeReq && (
          <span
            onClick={() => {
              if (loading) return;
              setShow(false);
            }}
            className="text-textPrimaryBlue uppercase font-semibold  hover:underline text-[0.66rem] cursor-pointer mt-[2px]"
          >
            Change
          </span>
        )}
      </div>
      <div className="flex w-full justify-between gap-2 mt-[2px]  flex-wrap">
        {[...Array.from({ length: 6 })].map((_, index) => (
          <input
            key={index}
            type="text"
            inputMode="numeric"
            maxLength={1}
            className="appearance-none w-11 h-11 text-center text-xl border border-inputBorderLight dark:border-inputBorderDark rounded-md focus:outline-none dark:bg-primaryVariantDark dark:text-textPrimaryDark focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            ref={inputRefs[index]}
            onChange={(e) => handleInputChange(e, index)}
            onInput={handleInput} // event listener to restrict input to numeric characters
            onKeyDown={(e) =>
              handleInputKeyDown(
                e as unknown as ChangeEvent<HTMLInputElement>,
                index
              )
            }
          />
        ))}
      </div>
      {!loading &&
        (seconds > 0 ? (
          <span className="text-textTertiaryLight dark:text-textTertiaryDark mt-1 text-sm text-start">
            Resend otp in {seconds} seconds
          </span>
        ) : (
          <span
            onClick={() => {
              if (!isResendOtpDisabled && attemptsLeftRef.current > 0) {
                handleResendOTP();
              } else if (attemptsLeftRef.current === 0) {
                console.log("No attempts left");
              }
            }}
            role="button"
            className={`${
              (attemptsLeftRef.current === 0 || isResendOtpDisabled) &&
              "text-switchSecondaryBlueBg"
            } text-textPrimaryBlue cursor-pointer text-start`}
          >
            Resend otp
          </span>
        ))}
    </div>
  );
};

export default InputOtp;
