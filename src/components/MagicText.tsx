import React, { useEffect, useRef } from 'react';
import './MagicText.css'; // Import file CSS ở trên nếu bạn dùng webpack/vite

// Star SVG: Biểu tượng ngôi sao 5 cánh từ mã gốc
const StarSVG = (
  <svg viewBox="0 0 512 512" fill="currentColor">
    <path d="M512 255.1c0 11.34-7.406 20.86-18.44 23.64l-171.3 42.78l-42.78 171.1C276.7 504.6 267.2 512 255.9 512s-20.84-7.406-23.62-18.44l-42.66-171.2L18.47 279.6C7.406 276.8 0 267.3 0 255.1c0-11.34 7.406-20.83 18.44-23.61l171.2-42.78l42.78-171.1C235.2 7.406 244.7 0 256 0s20.84 7.406 23.62 18.44l42.78 171.2l171.2 42.78C504.6 235.2 512 244.6 512 255.1z" />
  </svg>
);

const NUM_STARS = 3;
const ANIMATION_INTERVAL = 1000; // 1 giây

// Hàm tạo số ngẫu nhiên
const rand = (min: number, max: number): number => 
  Math.floor(Math.random() * (max - min + 1)) + min;

// Hàm kích hoạt lại animation
const animate = (star: HTMLElement) => {
  star.style.setProperty("--star-left", `${rand(-10, 100)}%`);
  star.style.setProperty("--star-top", `${rand(-40, 80)}%`);

  // Trick để force re-run CSS animation
  star.style.animation = "none";
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  star.offsetHeight; 
  star.style.animation = "";
}

interface MagicTextProps {
  text: string;
}

const MagicText: React.FC<MagicTextProps> = ({ text }) => {
  const magicRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!magicRef.current) return;

    const stars = magicRef.current.getElementsByClassName("magic-star");
    const timeouts: NodeJS.Timeout[] = [];
    const intervals: NodeJS.Timeout[] = [];
    let index = 0;

    for(const star of Array.from(stars) as HTMLElement[]) {
      // Bắt đầu animation lặp lại sau một khoảng delay staggered
      const initialTimeout = setTimeout(() => {
        animate(star);
        
        // Thiết lập lặp lại
        const recurringInterval = setInterval(() => animate(star), ANIMATION_INTERVAL);
        intervals.push(recurringInterval);
      }, index++ * (ANIMATION_INTERVAL / NUM_STARS)); 
      timeouts.push(initialTimeout);
    }

    // Cleanup: Dọn dẹp tất cả timer khi component unmount
    return () => {
      timeouts.forEach(clearTimeout);
      intervals.forEach(clearInterval);
    };
  }, [text]);

  return (
    <span className="magic" ref={magicRef}>
      {/* Render các ngôi sao */}
      {Array.from({ length: NUM_STARS }).map((_, i) => (
        <span key={i} className="magic-star">
          {StarSVG}
        </span>
      ))}
      
      {/* Text chính với hiệu ứng gradient */}
      <span className="magic-text">
        {text}
      </span>
    </span>
  );
}

export default MagicText;