import React from 'react';
import { motion } from 'framer-motion';

const MitraVisualizer = ({ state }) => {
    // state can be 'IDLE', 'LISTENING', 'PROCESSING', 'SPEAKING', 'ERROR'
    
    if (state === 'IDLE' || state === 'ERROR') {
        return (
            <div className="flex items-center justify-center w-full h-8 opacity-40">
                <div className="w-1.5 h-1.5 bg-current rounded-full mx-1"></div>
                <div className="w-1.5 h-1.5 bg-current rounded-full mx-1"></div>
                <div className="w-1.5 h-1.5 bg-current rounded-full mx-1"></div>
            </div>
        );
    }
    
    if (state === 'PROCESSING') {
        return (
            <div className="flex items-center justify-center w-full h-8 gap-1.5 text-primary">
                <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-current rounded-full" />
                <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-current rounded-full" />
                <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-current rounded-full" />
            </div>
        );
    }
    
    // LISTENING or SPEAKING (waveform)
    return (
        <div className={`flex items-center justify-center w-full h-12 gap-1 px-4 ${state === 'LISTENING' ? 'text-error' : 'text-primary'}`}>
            {[...Array(9)].map((_, i) => (
                <motion.div 
                    key={i}
                    animate={{ 
                        height: state === 'LISTENING' ? [8, Math.random() * 30 + 10, 8] : [8, Math.random() * 40 + 10, 8]
                    }} 
                    transition={{ 
                        repeat: Infinity, 
                        duration: 0.5 + Math.random() * 0.5,
                        delay: i * 0.05
                    }} 
                    className="w-1.5 bg-current rounded-full" 
                    style={{ minHeight: '8px' }}
                />
            ))}
        </div>
    );
};

export default MitraVisualizer;
