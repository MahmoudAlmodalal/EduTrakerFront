import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './HorizontalScroll.css';

/**
 * HorizontalScroll Component
 * Provides smooth horizontal scrolling with navigation arrows
 * Mobile-friendly with touch support
 * 
 * @param {React.ReactNode} children - Content to scroll
 * @param {boolean} showArrows - Show navigation arrows
 * @param {boolean} showIndicator - Show scroll indicator
 * @param {string} className - Additional CSS classes
 * @param {function} onScroll - Callback when scrolling
 */
const HorizontalScroll = ({
    children,
    showArrows = true,
    showIndicator = true,
    className = '',
    onScroll,
    scrollAmount = 300,
    autoHide = true,
}) => {
    const scrollContainerRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [showControls, setShowControls] = useState(!autoHide);

    // Check scroll position
    const checkScroll = useCallback(() => {
        if (!scrollContainerRef.current) return;

        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        
        const newCanScrollLeft = scrollLeft > 0;
        const newCanScrollRight = scrollLeft < scrollWidth - clientWidth - 10;
        
        setCanScrollLeft(newCanScrollLeft);
        setCanScrollRight(newCanScrollRight);

        if (autoHide) {
            setShowControls(scrollWidth > clientWidth);
        }

        if (onScroll) {
            onScroll({
                scrollLeft,
                scrollWidth,
                clientWidth,
                canScrollLeft: newCanScrollLeft,
                canScrollRight: newCanScrollRight,
            });
        }
    }, [onScroll, autoHide]);

    // Initialize and watch for changes
    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        
        const observer = new ResizeObserver(() => {
            checkScroll();
        });
        if (scrollContainerRef.current) {
            observer.observe(scrollContainerRef.current);
        }

        return () => {
            window.removeEventListener('resize', checkScroll);
            observer.disconnect();
        };
    }, [checkScroll]);

    // Scroll handler
    const scroll = (direction) => {
        if (!scrollContainerRef.current) return;

        const amount = direction === 'left' ? -scrollAmount : scrollAmount;
        scrollContainerRef.current.scrollBy({
            left: amount,
            behavior: 'smooth',
        });
    };

    // Handle scroll event
    const handleScroll = () => {
        checkScroll();
    };

    return (
        <div className={`horizontal-scroll-wrapper ${className}`}>
            {/* Left Arrow */}
            {showArrows && showControls && (
                <button
                    className={`horizontal-scroll-arrow horizontal-scroll-arrow--left ${!canScrollLeft ? 'disabled' : ''}`}
                    onClick={() => scroll('left')}
                    disabled={!canScrollLeft}
                    aria-label="Scroll left"
                    title="Scroll left"
                >
                    <ChevronLeft size={20} />
                </button>
            )}

            {/* Scroll Container */}
            <div
                ref={scrollContainerRef}
                className="horizontal-scroll-container"
                onScroll={handleScroll}
            >
                {children}
            </div>

            {/* Right Arrow */}
            {showArrows && showControls && (
                <button
                    className={`horizontal-scroll-arrow horizontal-scroll-arrow--right ${!canScrollRight ? 'disabled' : ''}`}
                    onClick={() => scroll('right')}
                    disabled={!canScrollRight}
                    aria-label="Scroll right"
                    title="Scroll right"
                >
                    <ChevronRight size={20} />
                </button>
            )}

            {/* Scroll Indicator */}
            {showIndicator && showControls && (
                <div className="horizontal-scroll-indicator" />
            )}
        </div>
    );
};

export default HorizontalScroll;
