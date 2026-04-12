export const noticeDepartmentOptions = [
  "All Departments",
  "Computer Engineering",
  "Computer Engineering and Information Technology",
  "Artificial Intelligence and Machine Learning",
  "Mechatronics Engineering",
  "Robotics Engineering",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Civil Engineering",
];

export const selectableNoticeDepartmentOptions = noticeDepartmentOptions.filter(
  (department) => department !== "All Departments",
);

function getFinalYearBatch(referenceDate = new Date()) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  return month >= 6 ? year + 1 : year;
}

export function getPassingYearOptions(referenceDate = new Date()) {
  const finalYearBatch = getFinalYearBatch(referenceDate);

  return [
    { label: "All Batches", value: "All Batches" },
    { label: `4th Year - Batch ${finalYearBatch}`, value: String(finalYearBatch) },
    { label: `3rd Year - Batch ${finalYearBatch + 1}`, value: String(finalYearBatch + 1) },
    { label: `2nd Year - Batch ${finalYearBatch + 2}`, value: String(finalYearBatch + 2) },
    { label: `1st Year - Batch ${finalYearBatch + 3}`, value: String(finalYearBatch + 3) },
  ];
}
