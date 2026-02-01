import { useState, useEffect, useRef } from 'react';
import { calculatePutCallRatio, getNearestExpiryRows, getFurthestExpiryRows } from '../optionAnalysis';

export const useStockData = (searchTicker, useTestData) => {
  const pollTimerRef = useRef(null);
  const etaTimerRef = useRef(null);
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
  const [queueInfo, setQueueInfo] = useState({
    isPending: false,
    queuePosition: null,
    etaSeconds: null,
    etaRemainingSeconds: null,
    etaUpdatedAt: null
  });

  useEffect(() => {
    if (!searchTicker) {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      if (etaTimerRef.current) {
        clearInterval(etaTimerRef.current);
        etaTimerRef.current = null;
      }
      setQueueInfo({
        isPending: false,
        queuePosition: null,
        etaSeconds: null,
        etaRemainingSeconds: null,
        etaUpdatedAt: null
      });
      return;
    }

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

    setQueueInfo({
      isPending: false,
      queuePosition: null,
      etaSeconds: null,
      etaRemainingSeconds: null,
      etaUpdatedAt: null
    });
    
    const stopPolling = () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };

    const fetchAllData = async () => {
      try {
        const response = await fetch(`/api/stockdata?ticker=${symbol}`, { signal });
        const d = await response.json();
        if (signal.aborted) return;

        if (response.status === 202) {
          const position = d.queue_position ?? null;
          const etaSeconds = d.eta_seconds ?? (position ? position * 120 : null);

          setQueueInfo(prev => {
            if (prev.isPending && prev.etaSeconds !== null) {
              return {
                ...prev,
                queuePosition: position
              };
            }
            return {
              isPending: true,
              queuePosition: position,
              etaSeconds,
              etaRemainingSeconds: etaSeconds,
              etaUpdatedAt: Date.now()
            };
          });

          if (!pollTimerRef.current) {
            pollTimerRef.current = setInterval(fetchAllData, 15000);
          }
          return;
        }

        stopPolling();
        setQueueInfo({
          isPending: false,
          queuePosition: null,
          etaSeconds: null,
          etaRemainingSeconds: null,
          etaUpdatedAt: null
        });

        let optionPayload = d.optionData ?? null;
        if (useTestData) {
          const res = await fetch('/testdata.json', { signal });
          optionPayload = await res.json();
        }

        const rows = optionPayload?.data?.table?.rows || [];
        const nearestRows = getNearestExpiryRows(rows);
        const furthestRows = getFurthestExpiryRows(rows);

        const putCallNear = calculatePutCallRatio(nearestRows);
        const putCallFar = calculatePutCallRatio(furthestRows);

        setData(prev => ({
          ...prev,
          vwap: d.vwap ?? null,
          close: d.close ?? null,
          headlines: d.headlines || [],
          institutionalSummary: d.institutionalSummary || null,
          shortInterest: d.shortInterest || [],
          rsiValues: d.rsiValues || [],
          financials: d.financials || null,
          insiderActivity: d.insiderActivity || null,
          optionData: optionPayload ?? null,
          putCallRatio: putCallFar !== null ? putCallFar.toFixed(2) : null,
          putCallRatioFar: putCallFar !== null ? putCallFar.toFixed(2) : null,
          putCallRatioNear: putCallNear !== null ? putCallNear.toFixed(2) : null
        }));
      } catch (e) {
        if (signal.aborted) return;
        console.error(e);
        stopPolling();
        setQueueInfo({
          isPending: false,
          queuePosition: null,
          etaSeconds: null,
          etaRemainingSeconds: null,
          etaUpdatedAt: null
        });
        setData(prev => ({
          ...prev,
          optionData: null,
          putCallRatio: null,
          putCallRatioFar: null,
          putCallRatioNear: null
        }));
      }
    };

    fetchAllData();

    return () => {
      controller.abort();
      stopPolling();
    };
  }, [searchTicker, useTestData]);

  useEffect(() => {
    if (!queueInfo.isPending || queueInfo.etaSeconds === null || queueInfo.etaUpdatedAt === null) {
      if (etaTimerRef.current) {
        clearInterval(etaTimerRef.current);
        etaTimerRef.current = null;
      }
      return;
    }

    if (etaTimerRef.current) return;

    etaTimerRef.current = setInterval(() => {
      setQueueInfo(prev => {
        if (!prev.isPending || prev.etaSeconds === null || prev.etaUpdatedAt === null) return prev;
        const elapsed = Math.floor((Date.now() - prev.etaUpdatedAt) / 1000);
        const remaining = Math.max(0, prev.etaSeconds - elapsed);
        if (remaining === prev.etaRemainingSeconds) return prev;
        return {
          ...prev,
          etaRemainingSeconds: remaining
        };
      });
    }, 1000);

    return () => {
      if (etaTimerRef.current) {
        clearInterval(etaTimerRef.current);
        etaTimerRef.current = null;
      }
    };
  }, [queueInfo.isPending, queueInfo.etaSeconds, queueInfo.etaUpdatedAt]);

  return { data, queueInfo };
};