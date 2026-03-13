export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="CreatorRate logo"
    >
      <rect width="32" height="32" rx="7" fill="#111827" />
      <polygon
        points="24,4.5 24.85,7.4 27.9,7.4 25.5,9.15 26.4,12.05 24,10.3 21.6,12.05 22.5,9.15 20.1,7.4 23.15,7.4"
        fill="#ff4d6d"
      />
      <text
        x="3.5"
        y="25"
        fontFamily="system-ui, -apple-system, Arial, sans-serif"
        fontWeight="800"
        fontSize="14"
        letterSpacing="-0.5"
        fill="white"
      >
        CR
      </text>
    </svg>
  )
}
