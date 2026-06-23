import { useRef, useState, useEffect } from 'react';
import { playTick } from '../utils/soundEffects';

export default function WheelColumn({ digit, onIncrement, onDecrement, colorClass, label, shortLabel, isMuted }) {
  const containerRef = useRef(null);
  const dragStartY = useRef(null);
  const isDragging = useRef(false);
  const [isCompactLabel, setIsCompactLabel] = useState(false);

  // Keep references to latest callbacks/props to avoid re-binding event listeners
  const incrementRef = useRef(onIncrement);
  const decrementRef = useRef(onDecrement);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    incrementRef.current = onIncrement;
    decrementRef.current = onDecrement;
    isMutedRef.current = isMuted;
  });

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(8);
      } catch {
        // Suppress errors (some browsers restrict vibrations without prior user interaction)
      }
    }
  };

  const increment = () => {
    if (!isMutedRef.current) playTick();
    triggerHaptic();
    incrementRef.current();
  };

  const decrement = () => {
    if (!isMutedRef.current) playTick();
    triggerHaptic();
    decrementRef.current();
  };

  // Drag start
  const handleStart = (y) => {
    dragStartY.current = y;
    isDragging.current = true;
  };

  // Drag move
  const handleMove = (y) => {
    if (!isDragging.current || dragStartY.current === null) return;
    const diff = y - dragStartY.current;
    const threshold = 25; // slightly lower threshold for easier mobile swiping
    
    if (Math.abs(diff) >= threshold) {
      if (diff > 0) {
        decrement();
      } else {
        increment();
      }
      dragStartY.current = y; // reset base to support continuous swiping
    }
  };

  const handleEnd = () => {
    isDragging.current = false;
    dragStartY.current = null;
  };

  useEffect(() => {
    const updateCompactLabel = () => {
      setIsCompactLabel(typeof window !== 'undefined' && window.innerWidth <= 480);
    };

    updateCompactLabel();
    window.addEventListener('resize', updateCompactLabel);

    return () => window.removeEventListener('resize', updateCompactLabel);
  }, []);

  // Bind non-passive wheel event listener to support scrolling on desktop
  // Bind touch event listeners with passive: false to block page scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Wheel handler
    const onWheel = (e) => {
      e.preventDefault();
      const now = Date.now();
      if (!el.lastWheelTime || now - el.lastWheelTime > 150) {
        if (e.deltaY > 0) {
          decrement();
        } else {
          increment();
        }
        el.lastWheelTime = now;
      }
    };

    // Touch handlers
    const onTouchStart = (e) => {
      if (e.touches.length > 1) return; // avoid multi-touch issues
      handleStart(e.touches[0].clientY);
    };

    const onTouchMove = (e) => {
      if (!isDragging.current || dragStartY.current === null) return;
      if (e.cancelable) {
        e.preventDefault(); // lock viewport scrolling during spin
      }
      handleMove(e.touches[0].clientY);
    };

    const onTouchEnd = () => {
      handleEnd();
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Bind once on mount!

  // Desktop Mouse event bindings
  const handleMouseDown = (e) => {
    handleStart(e.clientY);
    
    const handleMouseMove = (moveEvent) => {
      handleMove(moveEvent.clientY);
    };
    
    const handleMouseUp = () => {
      handleEnd();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="wheel-column-container">
      <span className="place-value-label" data-short={shortLabel}>
        <span className="full-text">{isCompactLabel ? shortLabel : label}</span>
      </span>
      <button 
        className="wheel-btn" 
        onClick={increment} 
        aria-label={`Increase ${label}`}
      >
        ▲
      </button>
      
      <div 
        ref={containerRef}
        className="wheel-viewport"
        onMouseDown={handleMouseDown}
      >
        <div 
          className="wheel-3d-cylinder"
          style={{ transform: `rotateX(${-digit * 36}deg)` }}
        >
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((val) => (
            <div 
              key={val}
              className={`digit-card ${colorClass}`}
              style={{
                transform: `rotateX(${val * 36}deg) translateZ(var(--cylinder-radius, 77px))`
              }}
            >
              {val}
            </div>
          ))}
        </div>
      </div>
      
      <button 
        className="wheel-btn" 
        onClick={decrement} 
        aria-label={`Decrease ${label}`}
      >
        ▼
      </button>
    </div>
  );
}
