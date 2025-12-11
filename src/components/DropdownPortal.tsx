import React, { useRef, useEffect, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface DropdownPortalProps {
    targetRef: React.RefObject<HTMLButtonElement>; 
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
}

const DropdownPortal: React.FC<DropdownPortalProps> = ({ targetRef, isOpen, onClose, children }) => {
    const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Find the mounting point (document.body) once
    useEffect(() => {
        // Ensure this logic runs only once client-side
        if (typeof document !== 'undefined') {
            setMountNode(document.body);
        }
    }, []);

    // Calculate position and handle global click-outside-to-close logic
    useEffect(() => {
        if (!isOpen || !targetRef.current || !dropdownRef.current) return;

        const targetRect = targetRef.current.getBoundingClientRect();
        const dropdownElement = dropdownRef.current;

        // Position the dropdown (right-aligned to the button, slightly below)
        dropdownElement.style.position = 'absolute';
        
        // Calculate Top position (4px below the button)
        dropdownElement.style.top = `${targetRect.bottom + window.scrollY + 4}px`;
        
        // Calculate Left/Right position to align its right edge with the button's right edge
        // Note: For a right-aligned dropdown, setting 'right' is often easier.
        // It's calculated as the screen width minus the button's right edge position.
        dropdownElement.style.right = `${window.innerWidth - targetRect.right}px`; 
        
        // Ensure there's no width set by default from the parent
        dropdownElement.style.width = '160px'; // Explicitly set width to match inline menu size

        // Handler to close when clicking outside the menu or the button
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (dropdownRef.current && !dropdownRef.current.contains(target) && !targetRef.current?.contains(target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, targetRef, onClose]);

    if (!isOpen || !mountNode) return null;

    // Render the content using a Portal into the document body
    return createPortal(
        <div 
            ref={dropdownRef}
            // Use a globally high z-index to stack over ALL application content
            className="bg-white border border-gray-200 rounded-lg shadow-xl z-[9999]" 
            tabIndex={-1}
            role="menu"
        >
            {children}
        </div>,
        mountNode
    );
};

export default DropdownPortal;