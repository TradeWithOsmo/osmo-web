import { useState, useEffect } from 'react';

/**
 * Hook to detect if viewport is mobile/tablet size
 * Uses CSS media query matching
 */
export const useIsMobile = (breakpoint: number = 1024): boolean => {
    const [isMobile, setIsMobile] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return window.matchMedia(`(max-width: ${breakpoint}px)`).matches;
        }
        return false;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);

        const handleChange = (e: MediaQueryListEvent) => {
            setIsMobile(e.matches);
        };

        // Modern browsers
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
        } else {
            // Legacy support
            mediaQuery.addListener(handleChange as any);
        }

        // Set initial value
        setIsMobile(mediaQuery.matches);

        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', handleChange);
            } else {
                mediaQuery.removeListener(handleChange as any);
            }
        };
    }, [breakpoint]);

    return isMobile;
};

export default useIsMobile;
