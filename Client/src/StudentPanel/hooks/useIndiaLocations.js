import { useEffect, useState } from "react";

const API_BASE = "https://www.india-location-hub.in/api";

async function fetchJson(url, signal) {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

  return response.json();
}

function normalizeItems(items, fallbackPrefix) {
  return (items ?? []).map((item, index) => ({
    ...item,
    id:
      item?.id ??
      item?.code ??
      item?.state_code ??
      item?.district_code ??
      item?.taluka_code ??
      `${fallbackPrefix}-${index}`,
  }));
}

function useIndiaLocations(stateId, districtId) {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadStates() {
      try {
        setLoadingStates(true);
        setError("");
        const data = await fetchJson(
          `${API_BASE}/locations/states`,
          controller.signal
        );
        setStates(normalizeItems(data?.data?.states, "state"));
      } catch (fetchError) {
        if (fetchError.name !== "AbortError") {
          setError("Unable to load states from the location API.");
        }
      } finally {
        setLoadingStates(false);
      }
    }

    loadStates();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!stateId) {
      setDistricts([]);
      return;
    }

    const controller = new AbortController();

    async function loadDistricts() {
      try {
        setLoadingDistricts(true);
        setError("");
        const data = await fetchJson(
          `${API_BASE}/locations/districts?state_id=${stateId}`,
          controller.signal
        );
        setDistricts(normalizeItems(data?.data?.districts, "district"));
      } catch (fetchError) {
        if (fetchError.name !== "AbortError") {
          setError("Unable to load districts for the selected state.");
          setDistricts([]);
        }
      } finally {
        setLoadingDistricts(false);
      }
    }

    loadDistricts();

    return () => controller.abort();
  }, [stateId]);

  useEffect(() => {
    if (!districtId) {
      setCities([]);
      return;
    }

    const controller = new AbortController();

    async function loadCities() {
      try {
        setLoadingCities(true);
        setError("");
        const data = await fetchJson(
          `${API_BASE}/locations/talukas?district_id=${districtId}`,
          controller.signal
        );
        setCities(normalizeItems(data?.data?.talukas, "city"));
      } catch (fetchError) {
        if (fetchError.name !== "AbortError") {
          setError("Unable to load cities for the selected district.");
          setCities([]);
        }
      } finally {
        setLoadingCities(false);
      }
    }

    loadCities();

    return () => controller.abort();
  }, [districtId]);

  return {
    states,
    districts,
    cities,
    loadingStates,
    loadingDistricts,
    loadingCities,
    error,
  };
}

export default useIndiaLocations;
