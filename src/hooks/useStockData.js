import { useState, useEffect } from 'react';
import { calculatePutCallRatio, getNearestExpiryRows, getFurthestExpiryRows } from '../optionAnalysis';

export const useStockData = (searchTicker, useTestData) => {
  const [data, setData] = useState({
    vwap: null,
    close: null,
    headlines: [],
    institutionalSummary: null,
    shortInterest: [],
    rsiValues: [],
    optionData: null,
    putCallRatio: null,
    putCallRatioFar: null,
    putCallRatioNear: null,
    financials: null,
    insiderActivity: null
  });

  useEffect(() => {
    if (!searchTicker) return;
    
    const fetchGeneralData = async () => {
      try {
        const response = await fetch(`/api/stockdata?ticker=${searchTicker}`);
        const d = await response.json();
        setData(prev => ({
          ...prev,
          vwap: d.vwap ?? null,
          close: d.close ?? null,
          headlines: d.headlines || [],
          institutionalSummary: d.institutionalSummary || null,
          shortInterest: d.shortInterest || [],
          rsiValues: d.rsiValues || [],
          financials: d.financials || null,
          insiderActivity: d.insiderActivity || null
        }));
      } catch (e) { console.error(e); }
    };

    const fetchOptions = async () => {
      try {
        let d;
        if (useTestData) {
          const res = await fetch('/testdata.json');
          d = await res.json();
        } else {
          const res = await fetch(`/api/optiondata?symbol=${searchTicker}`);
          d = await res.json();
        }
        
        const rows = d?.data?.table?.rows || [];
        const nearestRows = getNearestExpiryRows(rows);
        const furthestRows = getFurthestExpiryRows(rows);

        const putCallNear = calculatePutCallRatio(nearestRows);
        const putCallFar = calculatePutCallRatio(furthestRows);

        setData(prev => ({
          ...prev,
          optionData: d,
          putCallRatio: putCallFar !== null ? putCallFar.toFixed(2) : null,
          putCallRatioFar: putCallFar !== null ? putCallFar.toFixed(2) : null,
          putCallRatioNear: putCallNear !== null ? putCallNear.toFixed(2) : null
        }));
      } catch (e) { console.error(e); }
    };

    fetchGeneralData();
    fetchOptions();
  }, [searchTicker, useTestData]);

  return data;
};