import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, AlertCircle, CheckCircle, XCircle, MessageSquare } from 'lucide-react';

interface ValidationPanelProps {
  validationState: 'pending' | 'validated' | 'invalidated';
  onValidate: (note?: string) => void;
  onInvalidate: (note?: string) => void;
}

const ValidationPanel: React.FC<ValidationPanelProps> = ({ 
  validationState, 
  onValidate, 
  onInvalidate 
}) => {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [validationNote, setValidationNote] = useState('');
  const [noteType, setNoteType] = useState<'validate' | 'invalidate' | null>(null);

  const handleValidateClick = () => {
    setNoteType('validate');
    setShowNoteInput(true);
  };

  const handleInvalidateClick = () => {
    setNoteType('invalidate');
    setShowNoteInput(true);
  };

  const handleConfirm = () => {
    if (noteType === 'validate') {
      onValidate(validationNote || undefined);
    } else if (noteType === 'invalidate') {
      onInvalidate(validationNote || undefined);
    }
    setShowNoteInput(false);
    setValidationNote('');
    setNoteType(null);
  };

  const handleCancel = () => {
    setShowNoteInput(false);
    setValidationNote('');
    setNoteType(null);
  };

  if (validationState === 'validated') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold">Chart Validated</span>
        </div>
        <p className="text-xs text-green-600 mt-1">
          This chart has been validated and is ready to use
        </p>
      </div>
    );
  }

  if (validationState === 'invalidated') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-700">
          <XCircle className="w-5 h-5" />
          <span className="font-semibold">Chart Invalidated</span>
        </div>
        <p className="text-xs text-red-600 mt-1">
          This chart was marked as incorrect. Consider regenerating with a different query.
        </p>
        <button
          onClick={() => {
            onValidate();
          }}
          className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
        >
          Mark as Valid
        </button>
      </div>
    );
  }

  // Pending state
  return (
    <div className="space-y-3">
      {!showNoteInput ? (
        <>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-700 mb-2">
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">Validation Required</span>
            </div>
            <p className="text-xs text-yellow-600 mb-3">
              Please validate if the LLM interpretation matches your query intent
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleValidateClick}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <ThumbsUp className="w-4 h-4" />
                Validate
              </button>
              <button
                onClick={handleInvalidateClick}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <ThumbsDown className="w-4 h-4" />
                Invalidate
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-semibold text-gray-700">
              Add a note (optional)
            </span>
          </div>
          <textarea
            value={validationNote}
            onChange={(e) => setValidationNote(e.target.value)}
            placeholder={`Why are you ${noteType === 'validate' ? 'validating' : 'invalidating'} this chart?`}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleConfirm}
              className={`flex-1 ${
                noteType === 'validate' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              } text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors`}
            >
              Confirm
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium py-2 px-3 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationPanel;