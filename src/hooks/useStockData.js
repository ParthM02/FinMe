import { useState, useEffect } from 'react';

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
    financials: null
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
          financials: d.financials || null
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
        let putVol = 0, callVol = 0;
        rows.forEach(r => {
          callVol += Number(r.c_Volume) || 0;
          putVol += Number(r.p_Volume) || 0;
        });

        setData(prev => ({
          ...prev,
          optionData: d,
          putCallRatio: callVol > 0 ? (putVol / callVol).toFixed(2) : null
        }));
      } catch (e) { console.error(e); }
    };

    fetchGeneralData();
    fetchOptions();
  }, [searchTicker, useTestData]);

  return data;
};