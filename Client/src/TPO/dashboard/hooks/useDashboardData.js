import { useEffect, useState } from "react";
import { getDashboardData } from "../../services/tpoApi";

export const useDashboardData = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      setIsFetching(true);
      setIsError(false);
      setError(null);

      try {
        const dashboardData = await getDashboardData();

        if (!isMounted) {
          return;
        }

        setData(dashboardData);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setIsError(true);
        setError(loadError);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsFetching(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [reloadCount]);

  const refetch = async () => {
    setReloadCount((count) => count + 1);
  };

  return {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
};

