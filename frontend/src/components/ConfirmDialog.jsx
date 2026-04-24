import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

const colorMap = {
  red: {
    button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    icon: 'text-red-600 bg-red-100',
  },
  blue: {
    button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    icon: 'text-blue-600 bg-blue-100',
  },
  green: {
    button: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    icon: 'text-green-600 bg-green-100',
  },
  yellow: {
    button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    icon: 'text-yellow-600 bg-yellow-100',
  },
};

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  confirmColor = 'red',
}) {
  const colors = colorMap[confirmColor] || colorMap.red;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center py-2">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${colors.icon}`}>
          <AlertTriangle className="h-7 w-7" />
        </div>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">{message}</p>
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${colors.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
