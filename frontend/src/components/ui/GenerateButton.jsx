import React, { useState } from "react";

export function GenerateButton({
  hue = 210,
  isGenerating: controlledIsGenerating,
  className = "",
  onClick,
  children,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  
  const isGenerating = controlledIsGenerating !== undefined ? controlledIsGenerating : isFocused;

  return (
    <div className="relative inline-block group">
      <style>{`
        .gen-btn {
          --border-radius: 28px; /* Increased slightly for larger button size */
          --padding: 5px;
          --transition: 0.4s;
          
          /* GLASSMORPHISM ADJUSTMENTS */
          --button-color: rgba(255, 255, 255, 0.07); /* Sheer semi-transparent white */
          --highlight-color-hue: ${hue}deg;

          user-select: none;
          display: flex;
          justify-content: center;
          align-items: center;
          
          /* SIZE BUMP */
          padding: 0.7em 0.8em 0.7em 1.3em; 
          font-family: "Poppins", "Inter", "Segoe UI", sans-serif;
          font-size: 1.25em; /* Scaled font size up from 1em */
          font-weight: 500;

          background-color: var(--button-color);
          
          /* THE GLASS BLUR EFFECT */
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);

          /* Refined shadows to fit glass look better */
          box-shadow:
            inset 0px 1px 2px rgba(255, 255, 255, 0.25),
            inset 0px 2px 4px rgba(255, 255, 255, 0.15),
            0px 4px 15px rgba(0, 0, 0, 0.15);

          /* Sharp glass border edge */
          border: solid 1px rgba(255, 255, 255, 0.2);
          border-radius: var(--border-radius);
          cursor: pointer;

          transition: box-shadow var(--transition), border var(--transition), background-color var(--transition);
        }
        
        .gen-btn::before {
          content: "";
          position: absolute;
          top: calc(0px - var(--padding));
          left: calc(0px - var(--padding));
          width: calc(100% + var(--padding) * 2);
          height: calc(100% + var(--padding) * 2);
          border-radius: calc(var(--border-radius) + var(--padding));
          pointer-events: none;
          background-image: linear-gradient(0deg, rgba(0,0,0,0.1), rgba(0,0,0,0.3));

          z-index: -1;
          transition: box-shadow var(--transition), filter var(--transition);
          box-shadow: 0 -8px 8px -6px rgba(0,0,0,0) inset, 
            0 -16px 16px -8px rgba(0,0,0,0) inset,
            1px 1px 1px rgba(255,255,255,0.1), 
            2px 2px 2px rgba(255,255,255,0.05);
        }
        
        .gen-btn::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: inherit;
          pointer-events: none;
          background-image: linear-gradient(
            0deg,
            #fff,
            hsl(var(--highlight-color-hue), 100%, 70%),
            hsla(var(--highlight-color-hue), 100%, 70%, 50%),
            8%,
            transparent
          );
          background-position: 0 0;
          opacity: 0;
          transition: opacity var(--transition), filter var(--transition);
        }

        .gen-btn-letter {
          position: relative;
          display: inline-block;
          color: rgba(255, 255, 255, 0.6); /* Enhanced letter visibility for transparency contrast */
          animation: gen-letter-anim 2s ease-in-out infinite;
          transition: color var(--transition), text-shadow var(--transition), opacity var(--transition);
        }

        @keyframes gen-letter-anim {
          50% {
            text-shadow: 0 0 5px rgba(255,255,255,0.8);
            color: #fff;
          }
        }

        .gen-btn-svg {
          flex-grow: 0;
          height: 26px;
          width: 26px;
          margin-right: 0.6rem;
          fill: #f3f4f6;
          animation: gen-flicker 2s linear infinite;
          animation-delay: 0.5s;
          filter: drop-shadow(0 0 3px rgba(255,255,255,0.6));
          transition: fill var(--transition), filter var(--transition), opacity var(--transition);
        }
        
        @keyframes gen-flicker {
          50% { opacity: 0.4; }
        }

        .gen-txt-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          min-width: 5.8em;
          height: 26px;
        }
        
        .gen-txt-1,
        .gen-txt-2 {
          position: absolute;
          display: flex;
          left: 0;
        }
        
        .gen-txt-1 {
          opacity: 1;
          transition: opacity 0.3s ease-in-out;
        }
        
        .gen-txt-2 {
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
        }
        
        .gen-btn[data-generating="true"] .gen-txt-1 {
          opacity: 0;
        }
        .gen-btn[data-generating="true"] .gen-txt-2 {
          opacity: 1;
        }

        .gen-btn[data-generating="true"] .gen-btn-letter {
          animation: gen-focused-letter-anim 1s ease-in-out forwards, gen-letter-anim 1.2s ease-in-out infinite;
          animation-delay: 0s, 1s;
        }
        
        @keyframes gen-focused-letter-anim {
          0%, 100% { filter: blur(0px); }
          50% {
            transform: scale(1.1);
            filter: blur(2px) brightness(150%);
          }
        }
        
        .gen-btn[data-generating="true"] .gen-btn-svg {
          animation-duration: 1.2s;
          animation-delay: 0.2s;
        }

        .gen-btn[data-generating="true"]::before {
          box-shadow: 0 -8px 12px -6px rgba(255,255,255,0.2) inset,
            0 -16px 16px -8px hsla(var(--highlight-color-hue), 100%, 70%, 20%) inset,
            1px 1px 1px rgba(255,255,255,0.2), 
            2px 2px 2px rgba(255,255,255,0.067);
        }
        
        .gen-btn[data-generating="true"]::after {
          opacity: 0.5;
          mask-image: linear-gradient(0deg, #fff, transparent);
          filter: brightness(100%);
        }

        /* Animation delays */
        .gen-btn-letter:nth-child(1) { animation-delay: 0s; }
        .gen-btn-letter:nth-child(2) { animation-delay: 0.08s; }
        .gen-btn-letter:nth-child(3) { animation-delay: 0.16s; }
        .gen-btn-letter:nth-child(4) { animation-delay: 0.24s; }
        .gen-btn-letter:nth-child(5) { animation-delay: 0.32s; }
        .gen-btn-letter:nth-child(6) { animation-delay: 0.4s; }
        .gen-btn-letter:nth-child(7) { animation-delay: 0.48s; }
        .gen-btn-letter:nth-child(8) { animation-delay: 0.56s; }
        .gen-btn-letter:nth-child(9) { animation-delay: 0.64s; }
        .gen-btn-letter:nth-child(10) { animation-delay: 0.72s; }
        .gen-btn-letter:nth-child(11) { animation-delay: 0.8s; }

        /* Hover & Active states rewritten to protect transparency */
        .gen-btn:active {
          border: solid 1px hsla(var(--highlight-color-hue), 100%, 80%, 70%);
          background-color: rgba(255, 255, 255, 0.15);
        }
        .gen-btn:active::before {
          box-shadow: 0 -8px 12px -6px rgba(255,255,255,0.4) inset,
            0 -16px 16px -8px hsla(var(--highlight-color-hue), 100%, 70%, 40%) inset;
        }
        .gen-btn:active::after {
          opacity: 0.8;
          filter: brightness(150%);
        }

        .gen-btn:hover {
          border: solid 1px hsla(var(--highlight-color-hue), 100%, 80%, 50%);
          background-color: rgba(255, 255, 255, 0.12); /* Slightly brighter glass fill on hover */
        }
        .gen-btn:hover::after {
          opacity: 0.8;
        }
        .gen-btn:hover .gen-btn-svg {
          fill: #fff;
          filter: drop-shadow(0 0 4px hsl(var(--highlight-color-hue), 100%, 70%));
          animation: none;
        }
      `}</style>

      <button
        type="button"
        className={`gen-btn ${className}`}
        data-generating={isGenerating ? "true" : "false"}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onClick={(e) => {
          setIsFocused(true);
          if (onClick) onClick(e);
        }}
        {...props}
      >
        <svg className="gen-btn-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"></path>
        </svg>

        <div className="gen-txt-wrapper">
          <div className="gen-txt-1">
            {"Get started".split("").map((letter, i) => (
              <span key={`t1-${i}`} className="gen-btn-letter">{letter}</span>
            ))}
          </div>
          <div className="gen-txt-2">
            {"Starting".split("").map((letter, i) => (
              <span key={`t2-${i}`} className="gen-btn-letter">{letter}</span>
            ))}
          </div>
        </div>
      </button>
    </div>
  );
}

export default GenerateButton;