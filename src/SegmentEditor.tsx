import { useEffect, useLayoutEffect, useRef } from "react";

export default function SegmentEditor({
  text,
  label,
  disabled,
  onChange,
  locale,
}: {
  text: string;
  label: string;
  disabled: boolean;
  onChange: (text: string) => void;
  locale?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  function fit() {
    const element = ref.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight + 2}px`;
  }
  useLayoutEffect(fit, [text]);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let width = element.clientWidth;
    const observer = new ResizeObserver(() => {
      if (element.clientWidth !== width) {
        width = element.clientWidth;
        fit();
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <textarea
      ref={ref}
      aria-label={label}
      value={text}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      rows={2}
      dir="auto"
      lang={locale}
      spellCheck
    />
  );
}
