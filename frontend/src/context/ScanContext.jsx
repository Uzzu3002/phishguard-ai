import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import API_BASE_URL from '../constants/api';

const ScanContext = createContext(null);

export const useScan = () => useContext(ScanContext);

export const ScanProvider = ({ children }) => {
  const [scanData, setScanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(null);

  const fetchScanStats = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(`${API_BASE_URL}/api/gmail/scan`, {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        const rawText = await response.text();

        const result = JSON.parse(rawText);

        if (result.success && result.data) {
          setScanData(result.data);
          setLastScanTime(new Date());
        } else {
          setError(true);
        }
      } else {
        setError(true);
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch once on mount
  useEffect(() => {
    fetchScanStats();
  }, [fetchScanStats]);

  // Compute derived values
  const derivedValues = useMemo(() => {
    let safeCount = 0;
    let reviewCount = 0;
    let highRiskCount = 0;
    let securityScore = 0;
    let hasThreats = false;
    let recentThreats = [];

    if (scanData && Array.isArray(scanData.results)) {
      const threats = scanData.results.filter(e => e.verdict === 'HIGH_RISK');
      const reviews = scanData.results.filter(e => e.verdict === 'REVIEW');
      
      highRiskCount = threats.length;
      reviewCount = reviews.length;
      safeCount = scanData.results.filter(e => e.verdict === 'SAFE').length;
      
      hasThreats = highRiskCount > 0;
      recentThreats = threats.slice(0, 5); // top 5 for quick access

      let calculatedScore = 100 - (highRiskCount * 10) - (reviewCount * 2);
      if (calculatedScore < 0) calculatedScore = 0;
      if (calculatedScore > 100) calculatedScore = 100;
      securityScore = calculatedScore;
    }

    return {
      safeCount,
      reviewCount,
      highRiskCount,
      securityScore,
      hasThreats,
      recentThreats
    };
  }, [scanData]);

  const value = {
    scanData,
    loading,
    error,
    lastScanTime,
    refreshScan: fetchScanStats,
    ...derivedValues
  };

  return (
    <ScanContext.Provider value={value}>
      {children || <Outlet />}
    </ScanContext.Provider>
  );
};
