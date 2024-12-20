import React, { useState } from 'react';
import { FiFilter, FiDownload } from 'react-icons/fi';
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaClock } from 'react-icons/fa';
import ProxyFilter from './ProxyFilter';
import ExportModal from './ExportModal';
import { ProxyFilters } from '../types';

interface ProxyTableProps {
  proxies: Array<{
    ip: string;
    port: string;
    protocols: string[];
    status: 'working' | 'failed' | 'processing' | 'queue';
    speed: number;
  }>;
}

const ProxyTable: React.FC<ProxyTableProps> = ({ proxies }) => {
  console.log('ProxyTable received proxies:', proxies);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [filters, setFilters] = useState<ProxyFilters>({
    protocols: [],
    onlyWorking: false,
    maxSpeed: 0
  });

  const filteredProxies = proxies.filter(proxy => {
    if (filters.protocols.length > 0 && 
        !proxy.protocols.some(p => filters.protocols.includes(p))) {
      return false;
    }
    
    if (filters.onlyWorking && proxy.status !== 'working') {
      return false;
    }
    
    if (filters.maxSpeed > 0 && proxy.speed > filters.maxSpeed) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="proxy-table-container">
      <div className="proxy-table-header">
        <div className="proxy-table-actions">
          <button 
            className="proxy-table-btn"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <FiFilter size={16} />
            Filter
          </button>
          <button 
            className="proxy-table-btn"
            onClick={() => setIsExportOpen(true)}
          >
            <FiDownload size={16} />
            Export proxies
          </button>
        </div>
      </div>

      {isFilterOpen && (
        <ProxyFilter
          filters={filters}
          onFiltersChange={setFilters}
        />
      )}

      <table className="proxy-table">
        <thead>
          <tr>
            <th>IP</th>
            <th>Port</th>
            <th>Protocols</th>
            <th>Status</th>
            <th>Speed</th>
          </tr>
        </thead>
        <tbody>
          {filteredProxies.map((proxy, index) => (
            <tr key={index}>
              <td>{proxy.ip}</td>
              <td>{proxy.port}</td>
              <td>{proxy.protocols.join(', ')}</td>
              <td>
                <span className={`proxy-status ${proxy.status}`}>
                  {proxy.status === 'working' ? (
                    <>
                      <FaCheckCircle size={16} />
                      WORKING
                    </>
                  ) : proxy.status === 'failed' ? (
                    <>
                      <FaTimesCircle size={16} />
                      FAILED
                    </>
                  ) : proxy.status === 'processing' ? (
                    <>
                      <FaSpinner size={16} className="animate-spin" />
                      CHECKING
                    </>
                  ) : (
                    <>
                      <FaClock size={16} />
                      QUEUE
                    </>
                  )}
                </span>
              </td>
              <td>
                <span className="proxy-speed">
                  {proxy.speed}ms
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        proxies={filteredProxies}
      />
    </div>
  );
};

export default ProxyTable; 