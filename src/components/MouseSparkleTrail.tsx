import React, { useEffect, useRef } from 'react';

interface Position { 
  x: number; 
  y: number; 
}

const config = {
  starAnimationDuration: 1500,
  minimumTimeBetweenStars: 250,
  minimumDistanceBetweenStars: 75,
  
  // Đã tinh chỉnh để đường (trail) ngắn và dày hơn
  glowDuration: 50, 
  maximumGlowPointSpacing: 5, 
  
  colors: ["249 146 253", "252 254 255"],
  sizes: ["1.4rem", "1rem", "0.6rem"],
  animations: ["fall-1", "fall-2", "fall-3"]
}

// --- Hàm tiện ích ---
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const selectRandom = (items: string[]) => items[rand(0, items.length - 1)];
const withUnit = (value: number, unit: string) => `${value}${unit}`;
const px = (value: number) => withUnit(value, "px");
const ms = (value: number) => withUnit(value, "ms");
const calcDistance = (a: Position, b: Position) => {
  const diffX = b.x - a.x;
  const diffY = b.y - a.y;
  return Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
}

const removeElement = (element: HTMLElement, delay: number) => setTimeout(() => {
    if (element.parentNode) element.parentNode.removeChild(element);
}, delay);
// ------------------------------------------------

const createStar = (position: Position, count: React.MutableRefObject<number>) => {
    const star = document.createElement("span");
    const color = selectRandom(config.colors);
  
    star.className = "star fa-solid fa-star"; // đổi fa-sparkle thành fa-star
    star.style.left = px(position.x);
    star.style.top = px(position.y);
    star.style.fontSize = selectRandom(config.sizes);
    star.style.color = `rgb(${color})`;
    star.style.textShadow = `0px 0px 1.5rem rgb(${color} / 0.5)`;
    star.style.animationName = config.animations[count.current++ % 3];
    star.style.animationDuration = ms(config.starAnimationDuration); 
  
    document.body.appendChild(star);
    removeElement(star, config.starAnimationDuration);
  };

const createGlowPoint = (position: Position) => {
  const glow = document.createElement("div");
  glow.className = "glow-point";
  glow.style.left = px(position.x);
  glow.style.top = px(position.y);
  
  document.body.appendChild(glow);
  removeElement(glow, config.glowDuration);
}

const determinePointQuantity = (distance: number) => Math.max(
  Math.floor(distance / config.maximumGlowPointSpacing),
  1
);

const createGlow = (last: Position, current: Position) => {
  const distance = calcDistance(last, current);
  const quantity = determinePointQuantity(distance);
  
  const dx = (current.x - last.x) / quantity;
  const dy = (current.y - last.y) / quantity;
  
  Array.from(Array(quantity)).forEach((_, index) => { 
    const x = last.x + dx * index; 
    const y = last.y + dy * index;
    
    createGlowPoint({ x, y });
  });
}

const MouseSparkleTrail: React.FC = () => {
    // ... (Logic useRef và useEffect giữ nguyên như phiên bản trước)
    const count = useRef(0);
    const originPosition = { x: 0, y: 0 };
    const last = useRef<{
        starTimestamp: number;
        starPosition: Position;
        mousePosition: Position;
    }>({
        starTimestamp: new Date().getTime(),
        starPosition: originPosition,
        mousePosition: originPosition
    });

    useEffect(() => {
        const updateLastStar = (position: Position) => {
          last.current.starTimestamp = new Date().getTime();
          last.current.starPosition = position;
        }

        const updateLastMousePosition = (position: Position) => {
            last.current.mousePosition = position;
        }

        const adjustLastMousePosition = (position: Position) => {
            if(last.current.mousePosition.x === 0 && last.current.mousePosition.y === 0) {
                last.current.mousePosition = position;
            }
        };

        const calcElapsedTime = (start: number, end: number) => end - start;

        const handleOnMove = (e: MouseEvent | Touch) => {
            const mousePosition = { x: e.clientX, y: e.clientY + window.scrollY  };
            
            adjustLastMousePosition(mousePosition);
            
            const now = new Date().getTime();
            const hasMovedFarEnough = calcDistance(last.current.starPosition, mousePosition) >= config.minimumDistanceBetweenStars;
            const hasBeenLongEnough = calcElapsedTime(last.current.starTimestamp, now) > config.minimumTimeBetweenStars;
            
            if(hasMovedFarEnough || hasBeenLongEnough) {
              createStar(mousePosition, count); 
              updateLastStar(mousePosition);
            }
            
            createGlow(last.current.mousePosition, mousePosition);
            
            updateLastMousePosition(mousePosition);
        }

        const onMouseMove = (e: MouseEvent) => handleOnMove(e);
        const onTouchMove = (e: TouchEvent) => handleOnMove(e.touches[0]);
        const onMouseLeave = () => updateLastMousePosition(originPosition);

        // Gắn sự kiện
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("touchmove", onTouchMove);
        document.body.addEventListener("mouseleave", onMouseLeave);

        // Cleanup
        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("touchmove", onTouchMove);
            document.body.removeEventListener("mouseleave", onMouseLeave);
        };
    }, []); 

    return null;
}

export default MouseSparkleTrail;