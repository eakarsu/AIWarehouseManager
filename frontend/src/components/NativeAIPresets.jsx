import React, { useState } from 'react';

const labels = ['Quick review', 'Planning scenario', 'Detailed review'];

export default function NativeAIPresets({ onFill, disabled = false }) {
  const [notice, setNotice] = useState('');
  return <section aria-label="AI input examples" className="rounded-lg border border-blue-200 bg-blue-50 p-3">
    <strong className="text-sm text-blue-900">Fill example inputs</strong>
    <div className="mt-2 flex flex-wrap gap-2">
      {labels.map((label, index) => <button key={label} type="button" disabled={disabled} onClick={() => setNotice(onFill(index) || 'Example inputs filled. Review them before generating.')} className="rounded-md border border-blue-300 bg-white px-3 py-2 text-sm font-medium text-blue-900 disabled:opacity-50">{label}</button>)}
    </div>
    {notice && <p role="status" className="mt-2 text-sm text-blue-900">{notice}</p>}
  </section>;
}
