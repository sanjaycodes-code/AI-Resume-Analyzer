import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, type Variants } from 'framer-motion';

interface GlassTiltCardProps {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
  maxTilt?: number; // Maximum tilt angle in degrees (default: 4.5)
}

export const GlassTiltCard: React.FC<GlassTiltCardProps> = ({
  children,
  className = '',
  variants,
  maxTilt = 4.5,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch-only devices to disable 3D tilt on mobile
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(max-width: 768px)').matches
      );
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  // Motion values for normalized cursor position (-1 to 1)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth spring physics for natural tactile lag
  const springConfig = { stiffness: 280, damping: 22 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  // Calculate 3D rotations based on cursor offset
  const rotateX = useTransform(springY, [-1, 1], [maxTilt, -maxTilt]);
  const rotateY = useTransform(springX, [-1, 1], [-maxTilt, maxTilt]);

  // Dynamic refractive glare position
  const glareX = useTransform(springX, [-1, 1], ['10%', '90%']);
  const glareY = useTransform(springY, [-1, 1], ['10%', '90%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Center coordinates (0 in the middle, -1 at left/top, +1 at right/bottom)
    const mouseX = (e.clientX - rect.left) / width - 0.5;
    const mouseY = (e.clientY - rect.top) / height - 0.5;

    x.set(mouseX * 2);
    y.set(mouseY * 2);
  };

  const handleMouseEnter = () => {
    if (!isTouchDevice) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      variants={variants}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: 'preserve-3d',
        rotateX: isTouchDevice ? 0 : rotateX,
        rotateY: isTouchDevice ? 0 : rotateY,
        perspective: 1000,
      }}
      whileHover={isTouchDevice ? { scale: 1.01 } : { scale: 1.02, y: -2 }}
      transition={{ duration: 0.15 }}
      className={`relative overflow-hidden cursor-default transition-shadow duration-300 ${className}`}
    >
      {/* Dynamic Refractive Glass Sheen / Glare Highlight (Desktop Only) */}
      {!isTouchDevice && isHovered && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-20 rounded-[inherit] transition-opacity duration-300"
          style={{
            background: useTransform(
              [glareX, glareY],
              ([gx, gy]) =>
                `radial-gradient(circle at ${gx} ${gy}, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 80%)`
            ),
          }}
        />
      )}

      {/* Card Content Layer */}
      <div className="relative z-10 h-full flex flex-col justify-between">
        {children}
      </div>
    </motion.div>
  );
};

export default GlassTiltCard;
