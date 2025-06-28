import React, { useEffect, useState } from 'react';

const LiquidGlass: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative">
      <div className="fixed inset-0 bg-gradient-to-br from-red-500/30 via-pink-500/20 to-yellow-500/10 transition-all duration-300"
      style={{
        backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`
      }}
      />
      <div className="fixed inset-0 backdrop-blur-[120px]" />
      <div 
      className="fixed inset-0 transition-opacity duration-300"
      style={{
        backgroundImage: 'radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(255,0,0,0.18), transparent 80%)',
        opacity: 0.8,
        '--mouse-x': `${mousePosition.x}%`,
        '--mouse-y': `${mousePosition.y}%`
      } as React.CSSProperties}
      />
    </div>
  );
};

export default LiquidGlass;