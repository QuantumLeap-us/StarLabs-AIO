import React, { useState } from 'react';
import { Proxy } from '../types';
import { FiX, FiUpload } from 'react-icons/fi';

interface ProxyListProps {
  proxies: Proxy[];
  onAdd: (address: string) => void;
  onRemove: (proxy: Proxy) => void;
}

const ProxyList: React.FC<ProxyListProps> = ({ proxies, onAdd, onRemove }) => {
  const [input, setInput] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    // Если пользователь вставляет несколько прокси через пробел
    if (value.includes(' ')) {
      const newProxies = value.split(' ').filter(p => p.trim());
      newProxies.forEach(proxy => onAdd(proxy.trim()));
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      onAdd(input.trim());
      setInput('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    lines.forEach(proxy => onAdd(proxy));
  };

  return (
    <div className="proxy-list">
      <div className="proxy-list-header">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Enter proxy (ip:port:user:pass)"
          className="proxy-input"
        />
        <label className="proxy-upload-btn">
          <FiUpload />
          <input
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>
      </div>
      
      <div className="proxy-items">
        {proxies.map((proxy, index) => (
          <div key={index} className={`proxy-item status-${proxy.status}`}>
            <span className="proxy-address">{`${proxy.ip}:${proxy.port}`}</span>
            <span className="proxy-response-time">{proxy.speed}ms</span>
            <button 
              className="proxy-remove-btn"
              onClick={() => onRemove(proxy)}
            >
              <FiX />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProxyList;