import React, { useState, useCallback } from 'react';
import styles from './Resizer.module.css';

interface ResizerProps {
    direction: 'horizontal' | 'vertical';
    onResize: (delta: number) => void;
}

const Resizer: React.FC<ResizerProps> = ({ direction, onResize }) => {
    const [isResizing, setIsResizing] = useState(false);

    const startResize = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        document.body.classList.add('is-resizing'); // Add class to body to handle iframe overlays

        // Use a mutable ref-like variable within the closure to track last position
        let lastX = e.clientX;
        let lastY = e.clientY;

        const handleMouseMove = (mmEvent: MouseEvent) => {
            const deltaX = mmEvent.clientX - lastX;
            const deltaY = mmEvent.clientY - lastY;

            // Update last position for the next event
            lastX = mmEvent.clientX;
            lastY = mmEvent.clientY;

            if (direction === 'horizontal') {
                onResize(deltaX);
            } else {
                onResize(deltaY);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.classList.remove('is-resizing'); // Remove class
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none'; // Prevent text selection
    }, [direction, onResize]);

    return (
        <div
            className={`${direction === 'horizontal' ? styles.resizerHorizontal : styles.resizerVertical} ${isResizing ? styles.resizing : ''}`}
            onMouseDown={startResize}
        />
    );
};

export default Resizer;
