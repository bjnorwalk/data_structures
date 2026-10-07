import { useEffect, useRef } from "react";

export function useAnimationTimer() {
  const timer = useRef(null);
  function cancel() {
    clearInterval(timer.current);
    timer.current = null;
  }
  function start(callback, delay) {
    cancel();
    timer.current = setInterval(callback, delay);
  }
  useEffect(() => () => clearInterval(timer.current), []);
  return { start, cancel };
}
