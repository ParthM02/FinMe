import { useState, useEffect, useRef } from 'react';
import { calculatePutCallRatio, getNearestExpiryRows, getFurthestExpiryRows } from '../optionAnalysis';

export const useStockData = (searchTicker, useTestData) => {
  const pollTimerRef = useRef(null);
  const etaTimerRef = useRef(null);
  const fetchRef = useRef(null);
  const applyDataRef = useRef(null);
  const cachedResponseRef = useRef(null);
  const cachePromptVisibleRef = useRef(false);
  const decisionTickerRef = useRef(null);
  const baselineUpdatedAtRef = useRef(null);
  const initialData = {
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
  };
  const [data, setData] = useState(initialData);
  const [queueInfo, setQueueInfo] = useState({
    isPending: false,
    queuePosition: null,
    etaSeconds: null,
    etaRemainingSeconds: null,
    etaUpdatedAt: null
  });
  const [cachePrompt, setCachePrompt] = useState({
    isVisible: false,
    updatedAt: null
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
      setCachePrompt({
        isVisible: false,
        updatedAt: null
      });
      cachedResponseRef.current = null;
      cachePromptVisibleRef.current = false;
      decisionTickerRef.current = null;
      baselineUpdatedAtRef.current = null;
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
    setData(initialData);
    setCachePrompt({
      isVisible: false,
      updatedAt: null
    });
    cachedResponseRef.current = null;
    cachePromptVisibleRef.current = false;
    decisionTickerRef.current = null;
    baselineUpdatedAtRef.current = null;
    
    const stopPolling = () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };

    const applyData = async (payload) => {
      let optionPayload = payload.optionData ?? null;
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
        vwap: payload.vwap ?? null,
        close: payload.close ?? null,
        headlines: payload.headlines || [],
        institutionalSummary: payload.institutionalSummary || null,
        shortInterest: payload.shortInterest || [],
        rsiValues: payload.rsiValues || [],
        financials: payload.financials || null,
        insiderActivity: payload.insiderActivity || null,
        optionData: optionPayload ?? null,
        putCallRatio: putCallFar !== null ? putCallFar.toFixed(2) : null,
        putCallRatioFar: putCallFar !== null ? putCallFar.toFixed(2) : null,
        putCallRatioNear: putCallNear !== null ? putCallNear.toFixed(2) : null
      }));
    };

    const fetchAllData = async (forceRefresh = false) => {
      try {
        const response = await fetch(`/api/stockdata?ticker=${symbol}${forceRefresh ? '&force=true' : ''}`, { signal });
        let d = await response.json();
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

        if (response.status === 200 && d?.cached && d?.response) {
          const updatedAt = d.updated_at ?? null;

          if (decisionTickerRef.current === searchTicker) {
            if (baselineUpdatedAtRef.current && updatedAt && baselineUpdatedAtRef.current === updatedAt) {
              if (!pollTimerRef.current) {
                pollTimerRef.current = setInterval(fetchAllData, 15000);
              }
              return;
            }
            d = d.response;
          } else {
            if (cachePromptVisibleRef.current) return;
            stopPolling();
            cachedResponseRef.current = d.response;
            setCachePrompt({
              isVisible: true,
              updatedAt: updatedAt
            });
            cachePromptVisibleRef.current = true;
            return;
          }
        }

        stopPolling();
        setQueueInfo({
          isPending: false,
          queuePosition: null,
          etaSeconds: null,
          etaRemainingSeconds: null,
          etaUpdatedAt: null
        });

        await applyData(d);
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

    fetchRef.current = fetchAllData;
    applyDataRef.current = applyData;

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

  const acceptCached = async () => {
    const cached = cachedResponseRef.current;
    if (!cached || !applyDataRef.current) return;
    setCachePrompt({ isVisible: false, updatedAt: null });
    cachedResponseRef.current = null;
    cachePromptVisibleRef.current = false;
    decisionTickerRef.current = searchTicker;
    baselineUpdatedAtRef.current = null;
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setQueueInfo({
      isPending: false,
      queuePosition: null,
      etaSeconds: null,
      etaRemainingSeconds: null,
      etaUpdatedAt: null
    });
    await applyDataRef.current(cached);
  };

  const requestRefresh = () => {
    setCachePrompt({ isVisible: false, updatedAt: null });
    baselineUpdatedAtRef.current = cachePrompt.updatedAt ?? null;
    cachedResponseRef.current = null;
    cachePromptVisibleRef.current = false;
    decisionTickerRef.current = searchTicker;
    fetchRef.current?.(true);
  };

  return { data, queueInfo, cachePrompt, acceptCached, requestRefresh };
};