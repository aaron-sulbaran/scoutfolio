type ScoutMarkProps = {
  className?: string;
};

export function ScoutMark({ className }: ScoutMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <line
        x1="3"
        y1="13"
        x2="10.5"
        y2="5.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <circle cx="11.25" cy="4.75" r="2.25" fill="currentColor" />
    </svg>
  );
}
