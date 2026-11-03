/**
 * src/components/ConfirmDialog.jsx
 * ---------------------------------------------------------------------------
 * Destructive-action confirmation (used by Admin Dashboard before DELETE).
 * Props: { open, title, message, confirmLabel, loading, onCancel, onConfirm }
 * ---------------------------------------------------------------------------
 */
import Modal from './Modal.jsx';

export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  loading = false,
  onCancel,
  onConfirm,
}) {
  return (
    <Modal open={open} title={title} onClose={onCancel} size="sm">
      <p className="text-sm leading-relaxed text-ink-500">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="button" className="btn-danger" onClick={onConfirm} disabled={loading}>
          {loading ? 'Deleting…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
