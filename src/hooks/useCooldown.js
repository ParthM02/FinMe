import { useState, useEffect } from 'react';

export const useCooldown = (initialTime = 60) => {
  const [cooldown, setCooldown] = useState(0);
  const [cooldownActive, setCooldownActive] = useState(false);

  useEffect(() => {
    if (!cooldownActive) return;
    if (cooldown === 0) {
      setCooldownActive(false);
      return;
    }
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown, cooldownActive]);

  const startCooldown = () => {
    setCooldown(initialTime);
    setCooldownActive(true);
  };

  return { cooldown, cooldownActive, startCooldown };
};