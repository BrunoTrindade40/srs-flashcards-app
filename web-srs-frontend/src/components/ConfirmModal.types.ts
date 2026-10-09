export interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}
