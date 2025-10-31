import * as React from 'react';

// --- 0. Types ---
type ToastVariant = 'default' | 'destructive';

export interface ToastActionElement extends React.ElementRef<'button'> {
  type: 'action';
}

export interface ToastProps extends React.HTMLAttributes<HTMLLIElement> {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: ToastVariant;
  duration?: number;
  onOpenChange: (open: boolean) => void;
}

// --- 1. Toast Viewport (Vị trí hiển thị) ---
const ToastViewport = React.forwardRef<
  HTMLOListElement,
  React.HTMLAttributes<HTMLOListElement>
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className="fixed top-0 right-0 z-[100] flex max-h-full w-full flex-col-reverse p-4 sm:top-auto sm:right-0 sm:bottom-0 sm:flex-col md:max-w-[420px]"
    {...props}
  />
));
ToastViewport.displayName = 'ToastViewport';

// --- 2. Toast Component (Mỗi thông báo) ---
const Toast = React.forwardRef<HTMLLIElement, ToastProps>(
  ({ className, variant = 'default', duration = 5000, title, description, action, onOpenChange, ...props }, ref) => {
    
    // Tự động đóng sau duration
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onOpenChange(false); // Gọi hàm xóa toast
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onOpenChange]);

    const baseClasses = 'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 shadow-lg transition-all data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full';
    const variantClasses = variant === 'destructive'
        ? 'border-red-500 bg-red-600 text-white'
        : 'border-gray-200 bg-white text-gray-900';

    return (
      <li
        ref={ref}
        className={`${baseClasses} ${variantClasses} ${className}`}
        data-state="open" // Đơn giản hóa trạng thái
        {...props}
      >
        <div className="grid gap-1">
          {title && <h3 className="text-sm font-semibold">{title}</h3>}
          {description && <div className="text-sm opacity-90">{description}</div>}
        </div>
        {action}
        <button
            onClick={() => onOpenChange(false)}
            className="absolute right-2 top-2 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100"
        >
            {/* Icon đóng */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
        </button>
      </li>
    );
  }
);
Toast.displayName = 'Toast';

// --- 3. Toast Provider (Quản lý trạng thái và hiển thị) ---
interface ToastProviderProps {
    children: React.ReactNode;
}

const TOAST_LIMIT = 5;

type ToastState = ToastProps & {
    open: boolean;
};

type ToastContextType = {
    toast: (props: Omit<ToastState, 'id' | 'open' | 'onOpenChange'>) => { id: string };
};

// *********** ĐẢM BẢO EXPORT CONTEXT NÀY ***********
export const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: ToastProviderProps) {
    const [toasts, setToasts] = React.useState<ToastState[]>([]);

    const addToast = React.useCallback(
        (props: Omit<ToastState, 'id' | 'open' | 'onOpenChange'>) => {
            const id = `toast-${Date.now()}-${Math.random()}`;
            const newToast: ToastState = {
                ...props,
                id,
                open: true,
                onOpenChange: (open) => {
                    if (!open) {
                        removeToast(id);
                    }
                },
            };

            setToasts((prev) => [newToast, ...prev].slice(0, TOAST_LIMIT));
            return { id };
        },
        []
    );

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toast: addToast }}>
            {children}
            <ToastViewport>
                {toasts.map((toast) => (
                    <Toast key={toast.id} {...toast} />
                ))}
            </ToastViewport>
        </ToastContext.Provider>
    );
}

// *********** ĐIỂM QUAN TRỌNG: SỬA HÀM TOASTER ***********
// Hàm này phải nhận children để bọc toàn bộ ứng dụng trong App.tsx
interface ToasterProps {
    children?: React.ReactNode;
}

export function Toaster({ children }: ToasterProps) {
    // Component wrapper để truyền children xuống ToastProvider
    return <ToastProvider>{children}</ToastProvider>; 
}