import { clsx } from "clsx";

interface TagProps {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  href?: string;
}

export function Tag({ children, onClick, active, className, href }: TagProps) {
  const Component = href ? "a" : onClick ? "button" : "span";
  const anchorProps = href ? { href } : {};
  const buttonProps =
    Component === "button"
      ? { type: "button" as const, "aria-pressed": !!active }
      : {};
  return (
    <Component
      {...anchorProps}
      {...buttonProps}
      onClick={onClick}
      className={clsx(
        "inline-flex items-center px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] leading-none border transition-colors duration-150",
        "focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        active
          ? "bg-accent/15 text-accent border-accent/30"
          : "bg-surface text-text-muted border-border hover:text-text hover:border-text-muted",
        (onClick || href) && "cursor-pointer",
        className
      )}
    >
      {children}
    </Component>
  );
}
