import React, { useEffect, useState } from 'react';
import { useDistricts } from '@/hooks/useDistricts';
import type { District } from '@/lib/graphql';
import { NoSSR } from './NoSSR';

const DistrictStatusIndicatorContent: React.FC = () => {
  const { data: districts, isLoading, error } = useDistricts();
  const [currentDistrict, setCurrentDistrict] = useState<District | null>(null);
  const [lastDistrictChange, setLastDistrictChange] = useState<Date | null>(null);

  // Listen for district change events
  useEffect(() => {
    const handleDistrictChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ current: District | null; previous: District | null }>;
      const { current } = customEvent.detail;
      setCurrentDistrict(current);
      setLastDistrictChange(new Date());
    };

    window.addEventListener('districtchange', handleDistrictChange);

    return () => {
      window.removeEventListener('districtchange', handleDistrictChange);
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg text-sm font-mono z-50">
      <h3 className="font-bold mb-2">🏙️ District Status</h3>

      <div className="space-y-1">
        <div>
          System: {isLoading ? (
            <span className="text-yellow-400">Loading...</span>
          ) : error ? (
            <span className="text-red-400">Error</span>
          ) : (
            <span className="text-green-400">Ready</span>
          )}
        </div>

        <div>
          Count: <span className="text-blue-400">{districts?.length || 0}</span>
        </div>

        <div className="border-t border-gray-600 pt-2 mt-2">
          <div className="font-bold text-yellow-400 mb-1">Current Location:</div>
          {currentDistrict ? (
            <>
              <div>District: <span className="text-green-400">{currentDistrict.zoneCode}</span></div>
              <div>Name: <span className="text-blue-300">{currentDistrict.name}</span></div>
              {lastDistrictChange && (
                <div className="text-xs text-gray-300">
                  Changed: {lastDistrictChange.toLocaleTimeString()}
                </div>
              )}
            </>
          ) : (
            <div>District: <span className="text-gray-400">Outside districts</span></div>
          )}
        </div>

        {error && (
          <div className="text-red-300 text-xs mt-2">
            Error: {error.message}
          </div>
        )}

        {districts && districts.length > 0 && (
          <div className="mt-2 text-xs border-t border-gray-600 pt-2">
            <div className="text-gray-400">Available Districts:</div>
            <div>First: {districts[0].zoneCode}</div>
            <div>Last: {districts[districts.length - 1].zoneCode}</div>
          </div>
        )}
      </div>

      <div className="mt-2 text-xs text-gray-400">
        🖱️ window.simulateDistrictChange(&quot;D-0101&quot;)
      </div>
    </div>
  );
};

export const DistrictStatusIndicator: React.FC = () => {
  return (
    <NoSSR fallback={
      <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg text-sm font-mono z-50">
        <h3 className="font-bold mb-2">🏙️ District Status</h3>
        <div>System: <span className="text-green-400">Loading...</span></div>
        <div>Count: <span className="text-blue-400">--</span></div>
        <div className="mt-2">
          <div className="font-medium text-yellow-400">Current Location:</div>
          <div>District: <span className="text-gray-400">Initializing...</span></div>
        </div>
      </div>
    }>
      <DistrictStatusIndicatorContent />
    </NoSSR>
  );
};