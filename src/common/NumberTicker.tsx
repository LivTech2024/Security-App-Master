import { useEffect, useState } from 'react';
import { numberFormatter } from '../utilities/NumberFormater';

const AnimatedNumberTicker = ({ value }: { value: number }) => {
  const [displayedValue, setDisplayedValue] = useState(0);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (displayedValue !== value) {
      setAnimate(true);
    }
  }, [value, displayedValue]);

  useEffect(() => {
    if (animate) {
      const updateDisplayedValue = () => {
        if (displayedValue < value) {
          setDisplayedValue(
            (prevValue) => prevValue + Math.ceil((value - prevValue) / 10)
          );
        } else if (displayedValue > value) {
          setDisplayedValue(
            (prevValue) => prevValue - Math.ceil((prevValue - value) / 10)
          );
        }
      };

      const interval = setInterval(updateDisplayedValue, 50);

      return () => clearInterval(interval);
    } else {
      setDisplayedValue(value);
    }
  }, [value, displayedValue, animate]);

  return (
    <div className="transition-transform">
      {numberFormatter(displayedValue, false, 0)}
    </div>
  );
};

export default AnimatedNumberTicker;
