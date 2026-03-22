import axios from "axios";

const tpcApi = axios.create({
  baseURL: "http://localhost:3000/tpc/dashboard",
});

const dashboardSnapshot = {
  overview: {
    assignedStudents: 286,
    activeDrives: 12,
    pendingReferrals: 34,
    placedStudents: 118,
  },
  driveStatus: [
    { name: "Ready", value: 7 },
    { name: "Pending", value: 5 },
  ],
  departmentSupport: [
    { department: "CSE", coordinated: 64, tasks: 78 },
    { department: "IT", coordinated: 51, tasks: 59 },
    { department: "ENTC", coordinated: 37, tasks: 46 },
    { department: "Mechanical", coordinated: 29, tasks: 35 },
    { department: "Civil", coordinated: 21, tasks: 27 },
    { department: "Electrical", coordinated: 26, tasks: 31 },
  ],
  weeklyTaskTrend: [
    { week: "W1", updates: 14 },
    { week: "W2", updates: 22 },
    { week: "W3", updates: 19 },
    { week: "W4", updates: 28 },
    { week: "W5", updates: 24 },
    { week: "W6", updates: 31 },
    { week: "W7", updates: 26 },
    { week: "W8", updates: 34 },
  ],
  recentActivities: [
    {
      id: 1,
      company: "Infosys",
      event: "Student shortlist sheet prepared for coordinator review",
      department: "CSE, IT",
      status: "Scheduled",
      time: "1 hour ago",
    },
    {
      id: 2,
      company: "Wipro",
      event: "Drive instructions shared with eligible candidates",
      department: "All Departments",
      status: "In Review",
      time: "Today, 9:15 AM",
    },
    {
      id: 3,
      company: "Accenture",
      event: "Coordinator verified attendance and reporting desk",
      department: "CSE, ENTC",
      status: "Completed",
      time: "Yesterday",
    },
    {
      id: 4,
      company: "Capgemini",
      event: "Student query log updated after pre-placement talk",
      department: "IT, Mechanical",
      status: "Updated",
      time: "Yesterday",
    },
  ],
};

export const getDashboardData = async () => {
  try {
    const response = await tpcApi.get("/");
    return response.data?.data ?? response.data;
  } catch {
    return structuredClone(dashboardSnapshot);
  }
};
