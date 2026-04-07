import { useEffect, useState } from "react";

interface HeartbeatProps {
  active: boolean;
}

export default function Heartbeat({ active }: HeartbeatProps) {
  const [offset, setOffset] = useState(100);

  useEffect(() => {
    if (!active) { setOffset(0); return; }
    let frame = 0;
    const timer = setInterval(() => {
      frame = (frame + 2) % 100;
      setOffset(100 - frame);
    }, 25);
    return () => clearInterval(timer);
  }, [active]);

  if (!active) {
    return (
      <svg width="40" height="14" viewBox="0 0 40 14" style={{ display: "block", flexShrink: 0 }}>
        <line x1="0" y1="7" x2="40" y2="7" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      </svg>
    );
  }

  return (
    <svg width="40" height="14" viewBox="0 0 40 14" style={{ display: "block", flexShrink: 0 }}>
      <polyline
        points="0,7 5,7 8,2 11,12 14,7 20,7 23,4 26,10 29,7 40,7"
        fill="none"
        stroke="#30D158"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="100"
        strokeDashoffset={offset}
      />
    </svg>
  );
}
