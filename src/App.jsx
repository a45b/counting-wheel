import { useState, useEffect, useRef, useCallback } from 'react';
import WheelColumn from './components/WheelColumn';
import { numberToWords } from './utils/numberToWords';
import { playPop, playTada, playClean, toggleMute } from './utils/soundEffects';

export default function App() {
  const [count, setCount] = useState(0);
  const [digitMode, setDigitMode] = useState('billions'); // 'hundreds' | 'thousands' | 'billions'
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTadaActive, setIsTadaActive] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const autoPlayRef = useRef(null);

  // Extract digits from the current count
  const getDigitsArray = (num) => {
    const digits = [];
    let temp = num;
    for (let i = 0; i < 10; i++) {
      digits.unshift(temp % 10);
      temp = Math.floor(temp / 10);
    }
    return digits;
  };

  const digits = getDigitsArray(count);

  const getModeConfig = useCallback((mode) => {
    switch (mode) {
      case 'hundreds':
        return { max: 999, digitsCount: 3, label: 'Hundreds' };
      case 'thousands':
        return { max: 999999, digitsCount: 6, label: 'Thousands' };
      case 'billions':
      default:
        return { max: 1000000000, digitsCount: 10, label: 'Billions' };
    }
  }, []);

  const modeConfig = getModeConfig(digitMode);

  // Bounded count updater
  const updateCount = useCallback((newVal, skipSound = false) => {
    const config = getModeConfig(digitMode);
    const bounded = Math.max(0, Math.min(config.max, newVal));
    const isMobileViewport = typeof window !== 'undefined' && window.innerWidth <= 768;
    setCount(bounded);

    // Play celebration sound when hitting a milestone
    if (!skipSound && !isMuted) {
      const isMilestone = bounded === config.max || (
        isMobileViewport ? (bounded > 0 && bounded % 100 === 0) : (bounded > 0 && bounded % 100000 === 0)
      );

      if (isMilestone) {
        playTada();
        setIsTadaActive(true);
        setTimeout(() => setIsTadaActive(false), 600);
      }
    }
  }, [digitMode, isMuted, getModeConfig]);

  // Voice Speech synthesizer with enhanced UX
  const speakNumber = useCallback(() => {
    if ('speechSynthesis' in window) {
      const synth = window.speechSynthesis;
      
      // Cancel any ongoing speech
      synth.cancel();
      
      const words = numberToWords(count);
      const utterance = new SpeechSynthesisUtterance(words);
      
      // Select a female voice
      const voices = synth.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.name.includes('Female') || 
        voice.name.includes('female') ||
        voice.name.includes('Woman') ||
        voice.name.includes('woman')
      ) || voices.find(voice => voice.name.includes('Google UK English Female')) || voices[1];
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      // Enhanced settings for better clarity and engagement
      utterance.rate = 0.8;        // Slightly slower for clarity
      utterance.pitch = 1.2;       // Friendly pitch
      utterance.volume = 1.0;      // Full volume
      
      // Error handling
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
      };
      
      // Optional: Provide feedback when speech completes
      utterance.onend = () => {
        // Speech completed successfully
      };
      
      synth.speak(utterance);
    } else {
      console.warn("Speech synthesis is not supported in this browser.");
    }
  }, [count]);

  // Handle level change and clamp value
  const handleLevelChange = (newMode) => {
    if (!isMuted) playPop();
    setDigitMode(newMode);
    const config = getModeConfig(newMode);
    if (count > config.max) {
      setCount(config.max);
    }
  };

  // Wheel increment callback
  const handleIncrement = (power) => {
    const placeValue = Math.pow(10, power);
    updateCount(count + placeValue);
  };

  // Wheel decrement callback
  const handleDecrement = (power) => {
    const placeValue = Math.pow(10, power);
    updateCount(count - placeValue);
  };

  // Button clicks helper
  const handleQuickAdd = (amount) => {
    if (!isMuted) playPop();
    
    // Play subtle haptic feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(8);
      } catch {
        // Haptic feedback not supported or blocked
      }
    }
    
    updateCount(count + amount);
  };

  const handleReset = () => {
    if (!isMuted) playClean();
    updateCount(0, true);
    setIsPlaying(false);
  };

  const handleRandom = () => {
    if (!isMuted) playTada();
    // Random between 1 and 999,999,999
    const rand = Math.floor(Math.random() * 999999999) + 1;
    updateCount(rand, true);
    setIsTadaActive(true);
    setTimeout(() => setIsTadaActive(false), 600);
  };

  const handleMuteToggle = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    toggleMute(nextMuted);
  };

  // Autoplay handler
  useEffect(() => {
    if (isPlaying) {
      autoPlayRef.current = setInterval(() => {
        setCount((prev) => {
          const config = getModeConfig(digitMode);
          if (prev >= config.max) {
            setIsPlaying(false);
            return prev;
          }
          // Increment ones digit. Odometer rolls over automatically
          return prev + 1;
        });
      }, 400);
    } else {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isPlaying, digitMode, getModeConfig]);

  // Auto-speak handler - speaks number when count changes
  useEffect(() => {
    if (autoSpeak && count > 0) {
      // Add slight delay to avoid overlapping speech
      const timer = setTimeout(() => {
        speakNumber();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [count, autoSpeak, speakNumber]);

  // Wheel definitions configuration
  const wheelConfigs = [
    { label: '1 Billion', short: '1B', color: 'bg-billions', power: 9 },
    { label: '100 Million', short: '100M', color: 'bg-hundred-millions', power: 8 },
    { label: '10 Million', short: '10M', color: 'bg-ten-millions', power: 7 },
    { label: '1 Million', short: '1M', color: 'bg-millions', power: 6 },
    { label: '100 Thousand', short: '100K', color: 'bg-hundred-thousands', power: 5 },
    { label: '10 Thousand', short: '10K', color: 'bg-ten-thousands', power: 4 },
    { label: '1 Thousand', short: '1K', color: 'bg-thousands', power: 3 },
    { label: 'Hundreds', short: '100', color: 'bg-hundreds', power: 2 },
    { label: 'Tens', short: '10', color: 'bg-tens', power: 1 },
    { label: 'Ones', short: '1', color: 'bg-ones', power: 0 }
  ];

  return (
    <div className="app-container">
      <div className="toy-cabinet">
        <header className="app-header">
          <h1 className="app-title">
            🎡 Counting Wheels 🎡
          </h1>
          <p className="app-subtitle">
            Spin the colorful wheels to count all the way up to 1 Billion!
          </p>
        </header>

        {/* Dynamic Level Selector */}
        <section className="level-selector-section" aria-label="Game levels">
          <span className="level-selector-title">Select Level:</span>
          <div className="level-selector-buttons">
            <button 
              className={`level-btn level-hundreds ${digitMode === 'hundreds' ? 'active' : ''}`}
              onClick={() => handleLevelChange('hundreds')}
              aria-pressed={digitMode === 'hundreds'}
            >
              🧸 Hundreds (3 Digits)
            </button>
            <button 
              className={`level-btn level-thousands ${digitMode === 'thousands' ? 'active' : ''}`}
              onClick={() => handleLevelChange('thousands')}
              aria-pressed={digitMode === 'thousands'}
            >
              🚀 Thousands (6 Digits)
            </button>
            <button 
              className={`level-btn level-billions ${digitMode === 'billions' ? 'active' : ''}`}
              onClick={() => handleLevelChange('billions')}
              aria-pressed={digitMode === 'billions'}
            >
              🌌 Billions (10 Digits)
            </button>
          </div>
        </section>

        {/* Rotating Odometer */}
        <section className="wheels-rack" aria-label="Counting wheels board">
          {wheelConfigs.slice(10 - modeConfig.digitsCount).map((cfg) => (
            <WheelColumn
              key={cfg.power}
              digit={digits[9 - cfg.power]}
              onIncrement={() => handleIncrement(cfg.power)}
              onDecrement={() => handleDecrement(cfg.power)}
              colorClass={cfg.color}
              label={cfg.label}
              shortLabel={cfg.short}
              isMuted={isMuted}
            />
          ))}
        </section>

        {/* Display Panel */}
        <section 
          className={`display-bubble ${isTadaActive ? 'tada-animation' : ''}`}
          aria-label="Display screen"
        >
          <div className="number-digits">
            {count.toLocaleString()}
          </div>
          <div className="number-words-container">
            <p className="number-words" id="number-words-label">
              {numberToWords(count)}
            </p>
            <button 
              className="speak-btn" 
              onClick={speakNumber} 
              aria-label="Read number out loud"
              title="Hear how to say it!"
            >
              🔊
            </button>
          </div>
        </section>

        {/* Dynamic Quick Add Section */}
        <section className="quick-add-section">
          <h3 className="quick-add-title">Add or Subtract Helper</h3>
          <div className="quick-add-buttons">
            {(() => {
              const buttons = [
                { val: 1, label: '+1' },
                { val: -1, label: '-1' },
                { val: 10, label: '+10' },
                { val: -10, label: '-10' },
                { val: 100, label: '+100' },
                { val: -100, label: '-100' }
              ];

              if (digitMode === 'thousands' || digitMode === 'billions') {
                buttons.push(
                  { val: 1000, label: '+1,000' },
                  { val: -1000, label: '-1,000' },
                  { val: 10000, label: '+10,000' },
                  { val: -10000, label: '-10,000' }
                );
              }

              if (digitMode === 'billions') {
                buttons.push(
                  { val: 1000000, label: '+1,000,000' },
                  { val: -1000000, label: '-1,000,000' }
                );
              }

              return buttons.map((btn, bidx) => (
                <button
                  key={bidx}
                  className="quick-add-btn"
                  onClick={() => handleQuickAdd(btn.val)}
                >
                  {btn.label}
                </button>
              ));
            })()}
          </div>
        </section>

        {/* Playground Control Hub */}
        <section className="control-hub">
          <button 
            className={`hub-btn btn-random`} 
            onClick={handleRandom}
          >
            🎲 Roll Random Number!
          </button>
          
          <button 
            className={`hub-btn btn-reset`} 
            onClick={handleReset}
          >
            🧼 Clear to Zero
          </button>

          <button 
            className={`hub-btn ${isPlaying ? 'btn-mute active' : 'btn-random'}`}
            onClick={() => {
              if (!isMuted) playPop();
              setIsPlaying(!isPlaying);
            }}
          >
            {isPlaying ? '⏸️ Stop Counting' : '🚀 Start Counting Up'}
          </button>

          <button 
            className={`hub-btn btn-mute ${isMuted ? 'active' : ''}`}
            onClick={handleMuteToggle}
          >
            {isMuted ? '🔇 Sound Off' : '🔊 Sound On'}
          </button>

          <button 
            className={`hub-btn btn-random ${autoSpeak ? 'active' : ''}`}
            onClick={() => setAutoSpeak(!autoSpeak)}
          >
            {autoSpeak ? '🗣️ Auto-Speak On' : '🤐 Auto-Speak Off'}
          </button>
        </section>
      </div>
    </div>
  );
}
