import React, { useState } from 'react';
// HMR Refresh Trigger

// Assets
import circlePattern from '../assets/circle pettern.png';
import dotsPattern from '../assets/Dots pettern.png';
import activeLogo from '../assets/deposited chain/Active.png';
import nonActiveLogo from '../assets/deposited chain/nonactive.png';
// Store
import { useUIStore } from '../store/useUIStore';

const FaucetBackground = React.memo(() => (
    <>
        {/* Layer 1: Dots Pattern (New) */}
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0.1,
            zIndex: 1,
            pointerEvents: 'none'
        }}>
            <img
                src={dotsPattern}
                alt="Dots Pattern"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
        </div>

        {/* Layer 2: Circle Pattern (Old) */}
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0.15,
            zIndex: 2,
            pointerEvents: 'none'
        }}>
            <img
                src={circlePattern}
                alt="Circle Pattern"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
        </div>
    </>
));

const Faucet: React.FC = () => {
    const [isHovered, setIsHovered] = useState(false);
    const { openFaucetModal } = useUIStore();

    const handleClaim = () => {
        openFaucetModal();
    };

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            backgroundColor: '#12000A',
            paddingBottom: '80px'
        }}>
            <FaucetBackground />

            {/* Layer 3: Double Circle Button with USDC Logo */}
            <button
                onClick={handleClaim}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: isHovered ? 'translate(-50%, -50%) scale(1.05)' : 'translate(-50%, -50%) scale(1)',
                    width: 'min(90vw, 800px)', // Responsive Outer Circle
                    height: 'min(90vw, 800px)',
                    borderRadius: '50%',
                    border: '1px solid #420024',
                    background: isHovered ? '#12000A' : '#0A0005', // Hover effect
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    // Avoid heavy glow/box-shadow effects; keep hover lightweight.
                    transition: 'transform 0.25s ease, background-color 0.25s ease',
                    zIndex: 20,
                    outline: 'none',
                }}
            >
                {/* Inner Circle */}
                <div style={{
                    width: 'min(78vw, 700px)', // Responsive Inner Circle
                    height: 'min(78vw, 700px)',
                    borderRadius: '50%',
                    border: '1px solid #420024',
                    background: isHovered ? '#12000A' : '#0A0005',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.25s ease'
                }}>
                    {/* Logo Always Shown */}
                    <img
                        src={isHovered ? nonActiveLogo : activeLogo}
                        alt="Claim"
                        style={{ width: 'min(50vw, 450px)', height: 'min(50vw, 450px)', objectFit: 'contain' }}
                    />
                </div>
            </button>
        </div>
    );
};

export default Faucet;
