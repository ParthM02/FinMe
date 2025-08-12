export function calculatePutCallRatio(optionRows) {
  let totalPutVolume = 0;
  let totalCallVolume = 0;
  optionRows.forEach(row => {
    // Handle missing or non-numeric values (like "--")
    const putVol = Number(row.p_Volume && row.p_Volume !== '--' ? row.p_Volume : 0);
    const callVol = Number(row.c_Volume && row.c_Volume !== '--' ? row.c_Volume : 0);
    totalPutVolume += putVol;
    totalCallVolume += callVol;
  });
  return totalCallVolume === 0 ? null : totalPutVolume / totalCallVolume;
}