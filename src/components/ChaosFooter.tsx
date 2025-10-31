import React from 'react';
import styled from 'styled-components';

const ChaosFooter = () => {
    return (
        <StyledWrapper>
            <div className="chaos-terminal">
                <div className="main-frame">
                    <div className="chaos-text">Social</div>
                </div>
                <div className="icon-chaos">
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-unit">
                        <svg viewBox="0 0 24 24"> <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /> </svg>
                    </a>
                     <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-unit">
                        <svg viewBox="0 0 24 24"> <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /> </svg>
                    </a>
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-unit">
                        <svg viewBox="0 0 24 24"> <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /> </svg>
                    </a>
                    <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-unit">
                        <svg viewBox="0 0 24 24"> <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /> </svg>
                    </a>
                </div>
                <div className="noise-layer" />
            </div>
        </StyledWrapper>
    );
}

const StyledWrapper = styled.div`
    .chaos-terminal {
        width: 250px;
        height: 100px;
        position: relative;
        cursor: pointer;
        transform-style: preserve-3d;
    }
    .main-frame {
        width: 100%;
        height: 100%;
        background: linear-gradient(
            90deg,
            #000 0%,
            #fff 2%,
            #000 4%,
            #fff 6%,
            #000 8%,
            #fff 10%,
            #000 100%
        ),
        repeating-linear-gradient(0deg, #000 0px, #000 1px, #fff 1px, #fff 2px);
        border: 4px solid #000;
        position: relative;
        overflow: visible;
        transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        box-shadow: 0 0 0 2px #fff, 0 0 0 4px #000, 0 0 0 6px #fff, 0 0 0 8px #000,
        8px 8px 0 8px #00ffff, 16px 16px 0 8px rgba(0, 0, 0, 0.8);
    }
    .main-frame::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: repeating-conic-gradient(
            from 0deg,
            #000 0deg,
            #000 5deg,
            #fff 5deg,
            #fff 10deg
        ),
        repeating-linear-gradient(
            45deg,
            transparent 0px,
            transparent 3px,
            #00ffff 3px,
            #00ffff 4px
        );
        opacity: 4%;
        animation: patternShift 3s linear infinite;
    }
    .chaos-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-weight: 900;
        font-size: 16px;
        color: #000;
        text-transform: uppercase;
        letter-spacing: 2px;
        z-index: 10;
        text-shadow: 1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff,
        -1px 1px 0 #fff, 2px 2px 0 #00ffff;
        animation: textGlitch 2s linear infinite;
    }
    @keyframes textGlitch {
        0%,
        100% {
        transform: translate(-50%, -50%);
        }
        10% {
        transform: translate(-51%, -49%);
        }
        20% {
        transform: translate(-49%, -51%);
        }
        30% {
        transform: translate(-52%, -50%);
        }
        40% {
        transform: translate(-48%, -52%);
        }
        50% {
        transform: translate(-50%, -48%);
        }
        60% {
        transform: translate(-53%, -51%);
        }
        70% {
        transform: translate(-47%, -49%);
        }
        80% {
        transform: translate(-51%, -53%);
        }
        90% {
        transform: translate(-49%, -47%);
        }
    }
    .icon-chaos {
        position: absolute;
        top: -10px;
        left: -10px;
        width: calc(100% + 20px);
        height: calc(100% + 20px);
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 5px;
        padding: 15px;
        background: repeating-linear-gradient(
            0deg,
            #000 0px,
            #000 3px,
            #fff 3px,
            #fff 6px
        ),
        repeating-linear-gradient(90deg, #000 0px, #000 3px, #fff 3px, #fff 6px);
        border: 4px solid #000;
        transform: scale(0) rotate(180deg);
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        z-index: 15;
        box-shadow: 0 0 0 2px #00ffff, 0 0 0 4px #000, 0 0 0 6px #fff,
        0 0 0 8px #000;
    }
    .icon-chaos::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: repeating-radial-gradient(
            circle at 50% 50%,
            #000 0px,
            #000 2px,
            #fff 2px,
            #fff 4px
        ),
        linear-gradient(45deg, transparent 40%, #00ffff 50%, transparent 60%);
        opacity: 0.3;
        animation: iconChaosPattern 4s linear infinite;
    }
    .social-unit {
        width: 100%;
        height: 100%;
        background: #fff;
        border: 2px solid #000;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        transform: scale(0) rotate(360deg);
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        box-shadow: inset 0 0 0 1px #00ffff;
    }
    .social-unit::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: repeating-linear-gradient(
            45deg,
            transparent 0px,
            transparent 2px,
            #000 2px,
            #000 3px
        );
        opacity: 0.1;
    }
    .social-unit svg {
        width: 20px;
        height: 20px;
        fill: #000;
        transition: all 0.2s ease;
        filter: drop-shadow(1px 1px 0 #00ffff);
    }
    .noise-layer {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: repeating-linear-gradient(
            0deg,
            transparent 0px,
            transparent 1px,
            rgba(0, 255, 255, 0.1) 1px,
            rgba(0, 255, 255, 0.1) 2px
        ),
        repeating-linear-gradient(
            90deg,
            transparent 0px,
            transparent 1px,
            rgba(0, 0, 0, 0.1) 1px,
            rgba(0, 0, 0, 0.1) 2px
        );
        pointer-events: none;
        z-index: 20;
        animation: noiseShift 1s linear infinite;
    }
    @keyframes noiseShift {
        0% {
        transform: translateX(0) translateY(0);
        }
        25% {
        transform: translateX(1px) translateY(-1px);
        }
        50% {
        transform: translateX(-1px) translateY(1px);
        }
        75% {
        transform: translateX(1px) translateY(1px);
        }
        100% {
        transform: translateX(0) translateY(0);
        }
    }
    .chaos-terminal:hover .main-frame {
        transform: scale(0.9) rotate(5deg);
        opacity: 0.3;
        box-shadow: 0 0 0 2px #fff, 0 0 0 4px #000, 0 0 0 6px #fff,
        0 0 0 8px #000, 20px 20px 0 8px #00ffff,
        40px 40px 0 8px rgba(0, 0, 0, 0.4);
    }
    .chaos-terminal:hover .chaos-text {
        transform: translate(-50%, -50%) scale(0) rotate(720deg);
        opacity: 0;
    }
    .chaos-terminal:hover .icon-chaos {
        transform: scale(1) rotate(0deg);
        opacity: 100%;
        transition-delay: 0.2s;
    }
    .chaos-terminal:hover .social-unit:nth-child(1) {
        transform: scale(1) rotate(0deg);
        transition-delay: 0.1s;
    }
    .chaos-terminal:hover .social-unit:nth-child(2) {
        transform: scale(1) rotate(0deg);
        transition-delay: 0.1s;
    }
    .chaos-terminal:hover .social-unit:nth-child(3) {
        transform: scale(1) rotate(0deg);
        transition-delay: 0.1s;
    }
        .chaos-terminal:hover .social-unit:nth-child(4) {
        transform: scale(1) rotate(0deg);
        transition-delay: 0.1s;
    }
    .social-unit:hover {
        background: #00ffff;
        transform: scale(1.2) rotate(180deg) !important;
        box-shadow: inset 0 0 0 1px #000, 0 0 0 2px #fff, 0 0 0 4px #000,
        0 0 20px #00ffff;
    }
    .social-unit:hover svg {
        fill: #000;
        transform: scale(1.2) rotate(-180deg);
        filter: drop-shadow(1px 1px 0 #fff);
    }
    /* Violent click */
    .chaos-terminal:active {
        animation: terminalDestroy 0.8s ease;
    }
    @keyframes terminalDestroy {
        0% {
        transform: scale(1) rotate(0deg);
        }
        50% {
        transform: scale(0.8) rotate(-5deg);
        filter: invert(1) hue-rotate(180deg);
        }
        100% {
        transform: scale(1) rotate(0deg);
        }
    }
    /* Scanlines */
    .chaos-terminal::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: repeating-linear-gradient(
            0deg,
            transparent 0px,
            transparent 2px,
            rgba(0, 255, 255, 0.205) 2px,
            rgba(0, 255, 255, 0.394) 4px
        );
        pointer-events: none;
        z-index: 25;
        animation: scanlines 1s linear infinite;
    }
    @keyframes scanlines {
        0% {
        transform: translateY(0);
        }
        100% {
        transform: translateY(10px);
        }
    }
`;

export default ChaosFooter;