export function Card({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

export function CardContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

export function Button({
  children,
  className = "",
  variant = "default",
  ...props
}) {
  const appearance =
    variant === "default"
      ? "bg-zinc-950 text-white hover:bg-zinc-800"
      : "bg-white text-zinc-700 hover:bg-zinc-100";
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center border border-zinc-200 text-sm font-medium transition disabled:opacity-40 ${appearance} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
