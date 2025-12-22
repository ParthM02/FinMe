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

    // Clear option-specific fields immediately so the UI doesn't show stale chains
    // while a new symbol is loading.
    setData(prev => ({
      ...prev,
      optionData: null,
      putCallRatio: null,
      putCallRatioFar: null,
      putCallRatioNear: null
    }));

    const controller = new AbortController();
    const { signal } = controller;
    const symbol = encodeURIComponent(searchTicker);
    
    const fetchGeneralData = async () => {
      try {
        const response = await fetch(`/api/stockdata?ticker=${symbol}`, { signal });
        const d = await response.json();
        if (signal.aborted) return;
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
          const res = await fetch('/testdata.json', { signal });
          d = await res.json();
        } else {
          // Cache-bust to avoid any intermediary caching of option chains.
          const res = await fetch(`/api/optiondata?symbol=${symbol}&_=${Date.now()}`, { signal });
          d = await res.json();
        }

        if (signal.aborted) return;
        
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
      } catch (e) {
        if (signal.aborted) return;
        console.error(e);
        setData(prev => ({
          ...prev,
          optionData: null,
          putCallRatio: null,
          putCallRatioFar: null,
          putCallRatioNear: null
        }));
      }
    };

    fetchGeneralData();
    fetchOptions();

    return () => controller.abort();
  }, [searchTicker, useTestData]);

  return data;
};