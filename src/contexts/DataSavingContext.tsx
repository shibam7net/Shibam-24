import { useState, useMemo, createContext, useContext, useEffect, type ReactNode } from 'react';

interface DataSavingContextType {
  isLowData: boolean;
  toggle: () => void;
}

const DataSavingContext = createContext<DataSavingContextType>({ isLowData: false, toggle: () => {} });

export function useDataSaving() {
  return useContext(DataSavingContext);
}

export function DataSavingProvider({ children }: { children: ReactNode }) {
  const [isLowData, setIsLowData] = useState(() => {
    try { return localStorage.getItem('low_data_mode') === 'true'; } catch { return false; }
  });

  useEffect(() => {
    localStorage.setItem('low_data_mode', String(isLowData));
  }, [isLowData]);

  const toggle = () => setIsLowData(prev => !prev);

  return (
    <DataSavingContext.Provider value={{ isLowData, toggle }}>
      {children}
    </DataSavingContext.Provider>
  );
}
