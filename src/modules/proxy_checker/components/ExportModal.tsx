import React, { useState } from 'react';
import { Proxy, ProxyFormat, ProxyProtocol } from '../types';
import { FiX } from 'react-icons/fi';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  proxies: Proxy[];
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, proxies }) => {
  const [format, setFormat] = useState<ProxyFormat>('ip:port');
  const [selectedProtocol, setSelectedProtocol] = useState<ProxyProtocol | 'default'>('default');

  const formatProxy = (proxy: Proxy): string => {
    const base = `${proxy.ip}:${proxy.port}`;
    const auth = proxy.username ? `${proxy.username}:${proxy.password}` : '';
    
    // Определяем протокол
    let protocol = '';
    if (format.includes('protocol')) {
      if (selectedProtocol === 'default') {
        protocol = proxy.protocols[0]?.toLowerCase() || '';
      } else {
        protocol = selectedProtocol.toLowerCase();
      }
    }

    switch (format) {
      case 'protocol://ip:port':
        return `${protocol}://${base}`;
      case 'user:pass@ip:port':
        return auth ? `${auth}@${base}` : base;
      case 'protocol://user:pass@ip:port':
        return `${protocol}://${auth}@${base}`;
      case 'user:pass:ip:port':
        return auth ? `${auth}:${base}` : base;
      case 'ip:port:user:pass':
        return auth ? `${base}:${auth}` : base;
      case 'ip:port@user:pass':
        return auth ? `${base}@${auth}` : base;
      case 'protocol://user:pass:ip:port':
        return `${protocol}://${auth}:${base}`;
      case 'protocol://ip:port:user:pass':
        return `${protocol}://${base}:${auth}`;
      case 'protocol://ip:port@user:pass':
        return `${protocol}://${base}@${auth}`;
      default:
        return base;
    }
  };

  const handleExport = () => {
    const content = proxies.map(formatProxy).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proxies_${format.replace(/[/:@]/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onClose();
  };

  const showProtocolSelect = format.includes('protocol');

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="export-modal">
        <div className="export-modal-header">
          <h2>Export Proxies</h2>
          <button className="close-btn" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>
        
        <div className="export-modal-content">
          <div className="export-field">
            <label>Export Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as ProxyFormat)}
            >
              <option value="ip:port">ip:port</option>
              <option value="protocol://ip:port">protocol://ip:port</option>
              <option value="user:pass@ip:port">user:pass@ip:port</option>
              <option value="protocol://user:pass@ip:port">protocol://user:pass@ip:port</option>
              <option value="user:pass:ip:port">user:pass:ip:port</option>
              <option value="ip:port:user:pass">ip:port:user:pass</option>
              <option value="ip:port@user:pass">ip:port@user:pass</option>
              <option value="protocol://user:pass:ip:port">protocol://user:pass:ip:port</option>
              <option value="protocol://ip:port:user:pass">protocol://ip:port:user:pass</option>
              <option value="protocol://ip:port@user:pass">protocol://ip:port@user:pass</option>
            </select>
          </div>

          {showProtocolSelect && (
            <div className="export-field">
              <label>Protocol</label>
              <select
                value={selectedProtocol}
                onChange={(e) => setSelectedProtocol(e.target.value as ProxyProtocol | 'default')}
              >
                <option value="default">Default (First Available)</option>
                <option value="HTTP">HTTP</option>
                <option value="HTTPS">HTTPS</option>
                <option value="SOCKS4">SOCKS4</option>
                <option value="SOCKS5">SOCKS5</option>
              </select>
            </div>
          )}

          <div className="export-info">
            <div>Total proxies: {proxies.length}</div>
            <div>Working proxies: {proxies.filter(p => p.status === 'working').length}</div>
          </div>
        </div>

        <div className="export-modal-footer">
          <button className="proxy-checker-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="proxy-checker-export-btn" onClick={handleExport}>Export</button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal; 