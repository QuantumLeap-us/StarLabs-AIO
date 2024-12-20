import { useState } from 'react';
import { FiX, FiDownload } from 'react-icons/fi';
import './ExportAccountsModal.css';

interface ExportAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  accounts: Array<{ token: string; proxy: string }>;
}

const ExportAccountsModal = ({ isOpen, onClose, groupName, accounts }: ExportAccountsModalProps) => {
  const [format, setFormat] = useState('token:proxy');
  const [fileName, setFileName] = useState(groupName || 'accounts');

  const handleExport = () => {
    let content = '';
    accounts.forEach(account => {
      switch (format) {
        case 'token:proxy':
          content += `${account.token}:${account.proxy}\n`;
          break;
        case 'token':
          content += `${account.token}\n`;
          break;
        case 'proxy':
          content += `${account.proxy}\n`;
          break;
      }
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="export-modal">
        <div className="modal-header">
          <h2>Export Accounts</h2>
          <button className="close-btn" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>
        <div className="export-modal-content">
          <div className="export-field">
            <label htmlFor="fileName">File Name</label>
            <input
              type="text"
              id="fileName"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Enter file name"
            />
          </div>
          <div className="export-field">
            <label htmlFor="format">Export Format</label>
            <select
              id="format"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              <option value="token:proxy">token:proxy</option>
              <option value="token">token</option>
              <option value="proxy">proxy</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="export-btn" onClick={handleExport}>
            <FiDownload size={16} />
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportAccountsModal;