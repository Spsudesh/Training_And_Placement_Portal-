import { useQuery } from "@tanstack/react-query";
import { getDashboardData } from "../services/tpoApi";

export const useDashboardData = () =>
  useQuery({
    queryKey: ["tpo-dashboard"],
    queryFn: getDashboardData,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    retry: 1,
  });

