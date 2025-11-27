import React, { createContext, useContext, useCallback } from 'react';
import Toast from 'react-native-toast-message';

interface ToastContextType {
  showToast: (message: string) => void;
  showSuccessToast: (message: string) => void;
  showErrorToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const showToast = useCallback((message: string) => {
    Toast.show({
      type: 'info',
      text1: message,
      position: 'bottom',
      visibilityTime: 2000,
    });
  }, []);

  const showSuccessToast = useCallback((message: string) => {
    Toast.show({
      type: 'success',
      text1: message,
      position: 'bottom',
      visibilityTime: 2000,
    });
  }, []);

  const showErrorToast = useCallback((message: string) => {
    Toast.show({
      type: 'error',
      text1: message,
      position: 'bottom',
      visibilityTime: 2000,
    });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showSuccessToast, showErrorToast }}>
      {children}
      <Toast />
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
