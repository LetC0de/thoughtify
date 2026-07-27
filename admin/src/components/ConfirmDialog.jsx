import { useEffect, useRef } from 'react'

export default function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (open) {
      dialogRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && open) onCancel?.()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div
        className="dialog"
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="dialog-icon">🗑️</div>
        <h3 className="dialog-title">{title || 'Confirm'}</h3>
        <p className="dialog-message">{message || 'Are you sure?'}</p>
        <div className="dialog-actions">
          <button className="btn-dialog btn-dialog-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-dialog btn-dialog-confirm" onClick={onConfirm}>
            {confirmLabel || 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
