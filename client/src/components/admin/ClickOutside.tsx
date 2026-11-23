import React, { useRef, useEffect } from 'react';

interface Props {
  children: React.ReactNode;
  exceptionRef?: React.RefObject<HTMLElement>;
  onClick: () => void;
  className?: string;
}

const ClickOutside: React.FC<Props> = ({
  children,
  exceptionRef,
  onClick,
  className,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickListener = (event: MouseEvent) => {
      const clickedInside = exceptionRef
        ? Boolean(
            (wrapperRef.current &&
              wrapperRef.current.contains(event.target as Node)) ||
            (exceptionRef.current && exceptionRef.current === event.target) ||
            (exceptionRef.current &&
              exceptionRef.current.contains(event.target as Node))
          )
        : Boolean(
            wrapperRef.current &&
            wrapperRef.current.contains(event.target as Node)
          );

      if (!clickedInside) onClick();
    };

    document.addEventListener('mousedown', handleClickListener);

    return () => {
      document.removeEventListener('mousedown', handleClickListener);
    };
  }, [exceptionRef, onClick]);

  return (
    <div ref={wrapperRef} className={`${className || ''}`}>
      {children}
    </div>
  );
};

export default ClickOutside;
