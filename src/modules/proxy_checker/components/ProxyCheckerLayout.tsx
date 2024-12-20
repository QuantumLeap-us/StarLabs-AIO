import React, { useState, useRef } from 'react';
import { FiUpload } from 'react-icons/fi';
import ProxyProgress from './ProxyProgress';
import ProxyTable from './ProxyTable';
import { useProxyChecking } from '../hooks/useProxyChecking';
import './styles.css';
import './ProxyProgress.css';

const ProxyCheckerLayout: React.FC = () => {
  const [proxyStrings, setProxyStrings] = useState<string[]>([]);
  const [checkUrl, setCheckUrl] = useState('https://www.google.com');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    isChecking,
    checkedCount,
    proxies,
    startChecking,
    isServerAvailable
  } = useProxyChecking();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(Boolean);
    
    setProxyStrings(lines);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setProxyStrings(e.target.value.split('\n'));
  };

  const handleStart = () => {
    const urls = checkUrl.split('\n')
      .map(url => url.trim())
      .filter(Boolean);
    
    if (urls.length === 0) {
      urls.push('https://www.google.com');
    }

    console.log('Starting check with proxies:', proxyStrings);
    console.log('URLs:', urls);
    startChecking(proxyStrings, urls);
  };

  return (
    <div className="proxy-checker-layout">
      {!isServerAvailable && (
        <div className="proxy-checker-server-error">
          Proxy checker server is not available. Please check the connection.
        </div>
      )}
      <h1 className="proxy-checker-title">Proxy Checker</h1>
      <div className="proxy-checker-divider" />
      
      <div className="proxy-checker-content">
        <div className="proxy-input-section">
          <button 
            className="proxy-import-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <FiUpload size={16} />
            Import proxies .txt file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <textarea
            className="proxy-textarea"
            value={proxyStrings.join('\n')}
            onChange={handleTextareaChange}
            placeholder="Enter proxies (one per line)"
            spellCheck="false"
          />
        </div>

        <div className="proxy-settings-section">
          <div className="proxy-settings-title">
            Custom links for proxy checker
          </div>
          <textarea
            className="proxy-url-input"
            value={checkUrl}
            onChange={(e) => setCheckUrl(e.target.value)}
            placeholder="Enter URL to check"
            spellCheck="false"
          />
          <button 
            className="proxy-start-btn"
            onClick={handleStart}
            disabled={isChecking || proxyStrings.length === 0 || !isServerAvailable}
          >
            {isChecking ? 'Checking...' : 'Start'}
          </button>
        </div>

        <ProxyProgress
          total={proxyStrings.length}
          checked={checkedCount}
          success={proxies.filter(p => p.status === 'working').length}
          error={proxies.filter(p => p.status === 'failed').length}
        />
      </div>

      <ProxyTable proxies={proxies} />
    </div>
  );
};

export default ProxyCheckerLayout; 