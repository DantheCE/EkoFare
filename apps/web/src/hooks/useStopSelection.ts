import { useState, useCallback } from "react";
import { toast } from "sonner";

export function useStopSelection() {
  const [originIdx, setOriginIdx] = useState<number | null>(null);
  const [destIdx, setDestIdx] = useState<number | null>(null);
  const [isReversed, setIsReversed] = useState(false);

  const handleStopTap = useCallback((index: number) => {
    if (originIdx === null) {
      setOriginIdx(index);
      setDestIdx(null);
    } else if (destIdx === null) {
      if (index > originIdx) {
        setDestIdx(index);
      } else {
        setOriginIdx(index);
        setDestIdx(null);
      }
    } else {
      // Both selected, reset
      setOriginIdx(index);
      setDestIdx(null);
    }
  }, [originIdx, destIdx]);

  const handleReverse = useCallback(() => {
    setIsReversed((prev) => !prev);
    setOriginIdx(null);
    setDestIdx(null);
    toast("Fares may differ in reverse direction");
  }, []);

  return {
    originIdx,
    destIdx,
    isReversed,
    handleStopTap,
    handleReverse,
  };
}
