import { apiClient } from "../../shared/apiClient";

const dashboardSnapshot = {
  overview: {
    totalStudents: 1248,
    eligibleStudents: 932,
    jobOpenings: 47,
    studentsPlaced: 618,
  },
  placementRatio: [
    { name: "Placed", value: 618 },
    { name: "Not Placed", value: 630 },
  ],
  departmentPlacements: [
    { department: "CSE", placed: 178, offers: 214 },
    { department: "IT", placed: 132, offers: 156 },
    { department: "ENTC", placed: 96, offers: 121 },
    { department: "Mechanical", placed: 82, offers: 94 },
    { department: "Civil", placed: 58, offers: 66 },
    { department: "Electrical", placed: 72, offers: 87 },
  ],
  monthlyPlacementTrend: [
    { month: "Jul", placements: 28 },
    { month: "Aug", placements: 54 },
    { month: "Sep", placements: 76 },
    { month: "Oct", placements: 112 },
    { month: "Nov", placements: 98 },
    { month: "Dec", placements: 84 },
    { month: "Jan", placements: 73 },
    { month: "Feb", placements: 93 },
  ],
  recentActivities: [
    {
      id: 1,
      company: "Infosys",
      event: "Drive scheduled for final interviews",
      department: "CSE, IT",
      status: "Scheduled",
      time: "2 hours ago",
    },
    {
      id: 2,
      company: "TCS",
      event: "164 students shortlisted for round 2",
      department: "All Departments",
      status: "In Review",
      time: "Today, 10:30 AM",
    },
    {
      id: 3,
      company: "Accenture",
      event: "Offer letters released to selected candidates",
      department: "CSE, ENTC",
      status: "Completed",
      time: "Yesterday",
    },
    {
      id: 4,
      company: "Capgemini",
      event: "Eligibility criteria updated for new opening",
      department: "IT, Mechanical",
      status: "Updated",
      time: "Yesterday",
    },
  ],
};

export const getDashboardData = async () => {
  try {
    const response = await apiClient.get("/tpo/dashboard");
    return response.data?.data ?? response.data;
  } catch {
    // Keep the current dashboard visible until the backend endpoints are ready.
    return structuredClone(dashboardSnapshot);
  }
};

