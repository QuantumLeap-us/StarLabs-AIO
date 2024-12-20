import React from 'react';
import { ProxyProtocol, ProxyFilters } from '../types';
import { FiCheck } from 'react-icons/fi';

interface ProxyFilterProps {
  filters: ProxyFilters;
  onFiltersChange: (filters: ProxyFilters) => void;
}

const ProxyFilter: React.FC<ProxyFilterProps> = ({ filters, onFiltersChange }) => {
  const protocols: ProxyProtocol[] = ['HTTP', 'HTTPS', 'SOCKS4', 'SOCKS5'];

  const toggleProtocol = (protocol: ProxyProtocol) => {
    const newProtocols = filters.protocols.includes(protocol)
      ? filters.protocols.filter(p => p !== protocol)
      : [...filters.protocols, protocol];
    
    onFiltersChange({ ...filters, protocols: newProtocols });
  };

  return (
    <div className="proxy-filter-content">
      <div className="proxy-filter-section">
        <div className="filter-section-title">Protocols</div>
        <div className="protocol-checkboxes">
          {protocols.map(protocol => (
            <label key={protocol} className="protocol-checkbox">
              <input
                type="checkbox"
                checked={filters.protocols.includes(protocol)}
                onChange={() => toggleProtocol(protocol)}
              />
              <span className="checkbox-custom">
                {filters.protocols.includes(protocol) && <FiCheck size={12} />}
              </span>
              <span className="checkbox-label">{protocol}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="proxy-filter-section">
        <div className="filter-section-title">Status</div>
        <label className="protocol-checkbox">
          <input
            type="checkbox"
            checked={filters.onlyWorking}
            onChange={(e) => onFiltersChange({ 
              ...filters, 
              onlyWorking: e.target.checked 
            })}
          />
          <span className="checkbox-custom">
            {filters.onlyWorking && <FiCheck size={12} />}
          </span>
          <span className="checkbox-label">Show only working</span>
        </label>
      </div>

      <div className="proxy-filter-section">
        <div className="filter-section-title">Speed limit (ms)</div>
        <input
          type="number"
          className="speed-input"
          value={filters.maxSpeed || ''}
          onChange={(e) => onFiltersChange({
            ...filters,
            maxSpeed: parseInt(e.target.value) || 0
          })}
          placeholder="Enter max speed"
        />
      </div>
    </div>
  );
};

export default ProxyFilter; 