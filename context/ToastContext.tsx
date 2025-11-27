import React, { createContext, useContext, useRef, useCallback } from 'react';
import Toast from '../components/Toast';

interface ToastContextType {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toastRef = useRef<{ show: (text: string) => void } | null>(null);

  const showToast = useCallback((message: string) => {
    toastRef.current?.show(message);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast ref={toastRef} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
