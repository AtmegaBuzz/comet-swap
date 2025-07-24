import { useState, useCallback, createContext, useContext, useEffect, type ReactNode } from 'react';
import { CheckCircle } from 'lucide-react';

// Types
interface ToastContextType {
    showTxSent: () => void;
}

// Context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast Provider Component
export function ToastProvider({ children }: { children: ReactNode }) {
    const [isVisible, setIsVisible] = useState(false);

    const showTxSent = useCallback(() => {
        setIsVisible(true);

        // Auto hide after 3 seconds
        setTimeout(() => {
            setIsVisible(false);
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ showTxSent }}>
            {children}
            {isVisible && <TxSentToast />}
        </ToastContext.Provider>
    );
}

// useToast Hook
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

// Simple Tx Sent Toast Component
function TxSentToast() {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        // Trigger animation on mount
        setIsAnimating(true);

        // Start exit animation before removal
        const timer = setTimeout(() => {
            setIsAnimating(false);
        }, 2700); // 300ms before removal

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg shadow-lg border transition-all duration-300 ${isAnimating
                        ? 'transform translate-x-0 opacity-100'
                        : 'transform translate-x-full opacity-0'
                    }`}
                style={{
                    backgroundColor: '#1B1B1B',
                    borderColor: '#10B981'
                }}
            >
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-white text-sm font-medium">Tx sent</span>
            </div>
        </div>
    );
}
