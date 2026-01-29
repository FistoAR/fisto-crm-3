import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";

// --- SVG ICON COMPONENTS ---
const Icon = ({ children, className, strokeWidth = "2" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);

const ChevronLeftIcon = ({ className }) => (
  <Icon className={className} strokeWidth="2.5">
    <polyline points="15 18 9 12 15 6"></polyline>
  </Icon>
);
const ChevronRightIcon = ({ className }) => (
  <Icon className={className} strokeWidth="2.5">
    <polyline points="9 18 15 12 9 6"></polyline>
  </Icon>
);
const CalendarIcon = ({ className }) => (
  <Icon className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </Icon>
);
const MessageSquareIcon = ({ className }) => (
  <Icon className={className}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </Icon>
);
const StarIcon = ({ className }) => (
  <Icon className={className} fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </Icon>
);

// --- CONFIG ---
const statsDataConfig = [
  {
    type: "employees",
    title: "Total Employees",
    color: "text-black",
    iconSrc: "/ProjectPages/overview/assEmp.webp",
  },
  {
    type: "overall",
    title: "Total Projects",
    color: "text-black",
    iconSrc: "/ProjectPages/overview/totalTask.webp",
  },
  {
    type: "completed",
    title: "Completed Projects",
    color: "text-green-500",
    iconSrc: "/ProjectPages/overview/completed.webp",
  },
  {
    type: "ongoing",
    title: "Ongoing Projects",
    color: "text-indigo-500",
    iconSrc: "/ProjectPages/overview/onGoing.webp",
  },
  {
    type: "delayed",
    title: "Delayed Projects",
    color: "text-yellow-500",
    iconSrc: "/ProjectPages/overview/delayed.webp",
  },
  {
    type: "overdue",
    title: "Overdue Projects",
    color: "text-red-500",
    iconSrc: "/ProjectPages/overview/overdue.webp",
  },
];

// --- HELPERS ---
const getInitials = (name) => {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};
const avatarColors = [
  "bg-pink-200 text-pink-800",
  "bg-orange-200 text-orange-800",
  "bg-purple-200 text-purple-800",
  "bg-green-200 text-green-800",
  "bg-blue-200 text-blue-800",
  "bg-yellow-200 text-yellow-800",
];

// --- COMPONENTS ---

const StatCard = ({ value, label, color, iconSrc, iconAlt }) => (
  <div className="bg-white rounded-lg shadow-sm flex flex-col justify-center px-[0.8vw] py-[0.7vw] gap-[0.5vw] w-[16%] h-full">
    <div className="flex items-center justify-between">
      <p className={`text-[1.2vw] font-semibold ${color}`}>{value}</p>
      <img src={iconSrc} alt={iconAlt} className="w-[1.6vw] h-[1.6vw]" />
    </div>
    <p className="text-[0.85vw] text-gray-700">{label}</p>
  </div>
);

const TodayTasksCard = ({
  tasks = [],
  loading,
  apiBaseUrl,
  unscheduledTask = [],
  dayTask = [],
  employees = [],
}) => {
  const [todaysWorkItems, setTodaysWorkItems] = useState([]);
  const [employeeCache, setEmployeeCache] = useState({});
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [hoveredTask, setHoveredTask] = useState(null);

  const fetchEmployeeData = async (employeeId) => {
    if (employeeCache[employeeId]) return employeeCache[employeeId];
    try {
      const response = await fetch(`${apiBaseUrl}/Profile/${employeeId}`);
      if (!response.ok) return null;
      const data = await response.json();
      const employeeData = data?.data || data;
      setEmployeeCache((prev) => ({ ...prev, [employeeId]: employeeData }));
      return employeeData;
    } catch (error) {
      return null;
    }
  };

  const handleImageError = (itemId) => {
    setImageErrors((prev) => ({ ...prev, [itemId]: true }));
  };

  const isToday = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(dateString + "T00:00:00");
    return checkDate.getTime() === today.getTime();
  };

  useEffect(() => {
    const loadTodaysTasks = async () => {
      if (loading) {
        setTodaysWorkItems([]);
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const allWorkItems = [];
      const employeesWithTasks = new Set();

      // Priority 1: Day Task (if reported today)
      (dayTask || []).forEach((day) => {
        if (isToday(day.createdAt?.split("T")[0] || "")) {
          employeesWithTasks.add(day.employeeID);
          
          const taskName = day.activityDetails 
            ? day.activityDetails.activityName 
            : day.taskDetails 
              ? day.taskDetails.taskName 
              : "Day Report";

          allWorkItems.push({
            id: day._id?.$oid || Math.random(),
            type: "dayTask",
            taskName: taskName,
            activityName: day.activityDetails?.activityName || null,
            description: day.activityDetails?.description || day.taskDetails?.description || "Daily task report submitted",
            employeeId: day.employeeID,
            endDate: day.endDate || new Date().toISOString().split("T")[0],
            status: "Completed",
            priority: 1,
            projectName: day.projectName || "",
            startDate: day.startDate || "",
            startTime: day.startTime || "",
            endTime: day.endTime || "",
          });
        }
      });

      // Priority 2: Unscheduled Task (if created today)
      (unscheduledTask || []).forEach((unscheduled) => {
        if (isToday(unscheduled.createdAt?.split("T")[0] || "")) {
          employeesWithTasks.add(unscheduled.employeeID);
          allWorkItems.push({
            id: unscheduled._id?.$oid || Math.random(),
            type: "unscheduled",
            taskName: unscheduled.taskName || "Unscheduled Task",
            activityName: null,
            description: unscheduled.reports || unscheduled.outcomes || "",
            employeeId: unscheduled.employeeID,
            endDate: new Date().toISOString().split("T")[0],
            status: unscheduled.status || "In Progress",
            priority: 2,
            projectName: unscheduled.projectName || "",
            startDate: "",
            startTime: unscheduled.startTime || "",
            endTime: unscheduled.endTime || "",
          });
        }
      });

      // Priority 3: Scheduled Tasks/Activities (only if scheduled for today)
      (tasks || []).forEach((task) => {
        const hasActivities = task.activities && task.activities.length > 0;

        if (!hasActivities) {
          const taskEmployee = task.employee;
          if (taskEmployee && taskEmployee.trim() !== "") {
            if (task.startDate && task.endDate) {
              const taskStartDate = new Date(task.startDate + "T00:00:00");
              const taskEndDate = new Date(task.endDate + "T23:59:59");

              if (today >= taskStartDate && today <= taskEndDate) {
                employeesWithTasks.add(taskEmployee);
                allWorkItems.push({
                  id: task._id?.$oid || Math.random(),
                  type: "task",
                  taskName: task.taskName,
                  activityName: null,
                  description: task.description,
                  employeeId: taskEmployee,
                  endDate: task.endDate,
                  status: task.status,
                  priority: 3,
                  isActivity: false,
                  projectName: task.projectName || "",
                  startDate: task.startDate,
                  startTime: task.startTime || "",
                  endTime: task.endTime || "",
                });
              }
            }
          }
        } else {
          task.activities.forEach((activity) => {
            if (activity.startDate && activity.endDate && activity.employee) {
              const activityStartDate = new Date(activity.startDate + "T00:00:00");
              const activityEndDate = new Date(activity.endDate + "T23:59:59");

              if (today >= activityStartDate && today <= activityEndDate) {
                employeesWithTasks.add(activity.employee);
                allWorkItems.push({
                  id: activity._id?.$oid || Math.random(),
                  type: "activity",
                  taskName: task.taskName,
                  activityName: activity.activityName,
                  description: activity.description,
                  employeeId: activity.employee,
                  endDate: activity.endDate,
                  status: activity.status,
                  priority: 3,
                  isActivity: true,
                  projectName: task.projectName || "",
                  startDate: activity.startDate,
                  startTime: activity.startTime || "",
                  endTime: activity.endTime || "",
                });
              }
            }
          });
        }
      });

      // Add employees without tasks
      (employees || []).forEach((employee) => {
        const empId = employee._id?.$oid || employee._id?.toString();
        if (!employeesWithTasks.has(empId)) {
          allWorkItems.push({
            id: `no-task-${empId}`,
            type: "noTask",
            taskName: "No Task",
            activityName: null,
            description: "No task scheduled or assigned today",
            employeeId: empId,
            endDate: new Date().toISOString().split("T")[0],
            status: "No Task",
            priority: 4,
            projectName: "",
            startDate: "",
            startTime: "",
            endTime: "",
          });
        }
      });

      // Sort by priority
      allWorkItems.sort((a, b) => a.priority - b.priority);

      // Group by employee and find their highest priority type
      const employeeTasksMap = new Map();
      allWorkItems.forEach((item) => {
        if (!employeeTasksMap.has(item.employeeId)) {
          employeeTasksMap.set(item.employeeId, []);
        }
        employeeTasksMap.get(item.employeeId).push(item);
      });

      // For each employee, keep only tasks of the highest priority type
      const filteredWorkItems = [];
      employeeTasksMap.forEach((items, employeeId) => {
        // Find the highest priority (lowest number)
        const highestPriority = Math.min(...items.map(item => item.priority));
        
        // Keep all tasks that match the highest priority
        const tasksToShow = items.filter(item => item.priority === highestPriority);
        
        filteredWorkItems.push(...tasksToShow);
      });

      // Sort final list by priority again
      filteredWorkItems.sort((a, b) => a.priority - b.priority);

      if (filteredWorkItems.length > 0) {
        setLoadingEmployees(true);
        const displayItems = await Promise.all(
          filteredWorkItems.map(async (item, index) => {
            const employee = await fetchEmployeeData(item.employeeId);
            const formattedEndDate = new Date(item.endDate)
              .toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
              .replace(/\//g, "-");

            return {
              id: item.id,
              type: item.type,
              taskName: item.taskName,
              activityName: item.activityName,
              description: item.description,
              employeeName: employee ? employee.employeeName : "Unassigned",
              endDate: formattedEndDate,
              avatar: employee && employee.profile ? `${apiBaseUrl}${employee.profile}` : null,
              initials: employee ? getInitials(employee.employeeName) : "?",
              color: avatarColors[index % avatarColors.length],
              status: item.status,
              isActivity: item.isActivity,
              priority: item.priority,
              projectName: item.projectName,
              startDate: item.startDate,
              startTime: item.startTime,
              endTime: item.endTime,
            };
          })
        );
        setTodaysWorkItems(displayItems);
        setLoadingEmployees(false);
        setImageErrors({});
      } else {
        setTodaysWorkItems([]);
      }
    };

    loadTodaysTasks();
  }, [tasks, loading, apiBaseUrl, unscheduledTask, dayTask, JSON.stringify(employees)]);

  const getTypeLabel = (type) => {
    switch (type) {
      case "dayTask":
        return "Concurrent";
      case "unscheduled":
        return "Unscheduled";
      case "activity":
        return "Sequential";
      case "task":
        return "Sequential";
      case "noTask":
        return "No Task";
      default:
        return "Task";
    }
  };

  const renderTaskList = () => {
    if (loading || loadingEmployees) {
      return (
        <div style={{ padding: "1.04vw", textAlign: "center", color: "#6B7280" }}>
          Loading tasks...
        </div>
      );
    }

    if (todaysWorkItems.length === 0) {
      return (
        <div style={{ padding: "1.04vw", textAlign: "center", color: "#6B7280" }}>
          No employees found.
        </div>
      );
    }

    return todaysWorkItems.map((item) => {
      const showAvatar = item.avatar && !imageErrors[item.id];
      const isHovered = hoveredTask === item.id;
      const isNoTask = item.type === "noTask";

      const formatDate = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr)
          .toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          .replace(/\//g, "-");
      };

      return (
        <div
          key={item.id}
          style={{
            display: "flex",
            alignItems: "flex-start",
            padding: "0.83vw",
            borderBottom: "0.05vw solid #E5E7EB",
            gap: "0.625vw",
            position: "relative",
            backgroundColor: isHovered ? "#F9FAFB" : "transparent",
            transition: "background-color 0.2s ease",
            opacity: isNoTask ? 0.6 : 1,
          }}
          onMouseEnter={() => !isNoTask && setHoveredTask(item.id)}
          onMouseLeave={() => setHoveredTask(null)}
        >
          {showAvatar ? (
            <img
              src={item.avatar}
              alt={item.employeeName}
              style={{
                width: "2.08vw",
                height: "2.08vw",
                borderRadius: "50%",
                objectFit: "cover",
                flexShrink: 0,
              }}
              onError={() => handleImageError(item.id)}
            />
          ) : (
            <div
              style={{
                width: "2.08vw",
                height: "2.08vw",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "600",
                fontSize: "0.73vw",
                flexShrink: 0,
              }}
              className="bg-blue-500"
            >
              {item.initials}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.42vw", marginBottom: "0.21vw" }}>
              <span style={{ fontWeight: "600", color: "#111827", fontSize: "0.73vw" }}>
                {item.employeeName}
              </span>
              <span
                style={{
                  fontSize: "0.57vw",
                  padding: "0.1vw 0.42vw",
                  borderRadius: "0.21vw",
                  backgroundColor: isNoTask ? "#FEE2E2" : "#F3F4F6",
                  color: isNoTask ? "#DC2626" : "#6B7280",
                  fontWeight: "500",
                }}
              >
                {getTypeLabel(item.type)}
              </span>
            </div>

            {item.isActivity && item.activityName ? (
              <div style={{ fontSize: "0.68vw", color: "#374151", marginBottom: "0.1vw" }}>
                <strong>Activity:</strong> {item.activityName}
              </div>
            ) : (
              <div style={{ fontSize: "0.68vw", color: isNoTask ? "#9CA3AF" : "#374151", marginBottom: "0.1vw" }}>
                <strong>{isNoTask ? "" : "Task:"}</strong> {item.taskName}
              </div>
            )}

            {item.description && (
              <div style={{ fontSize: "0.625vw", color: "#6B7280", marginTop: "0.21vw" }}>
                {item.description}
              </div>
            )}
          </div>

          {isHovered && !isNoTask && (item.projectName || item.startDate || item.startTime || item.endTime) && (
            <div
              style={{
                position: "absolute",
                top: "80%",
                right: "2.71vw",
                marginTop: "0.21vw",
                backgroundColor: "#1F2937",
                color: "white",
                padding: "0.52vw 0.73vw",
                borderRadius: "0.31vw",
                fontSize: "0.625vw",
                zIndex: 1000,
                boxShadow: "0 0.21vw 0.52vw rgba(0, 0, 0, 0.15)",
                minWidth: "10.42vw",
                whiteSpace: "nowrap",
              }}
            >
              {item.projectName && (
                <div style={{ marginBottom: "0.26vw" }}>
                  <strong>Project:</strong> {item.projectName}
                </div>
              )}

              
            {item.isActivity && item.activityName && (
              <div style={{ fontSize: "0.68vw", color: "#ffffff", marginBottom: "0.1vw" }}>
                <strong>{isNoTask ? "" : "Task:"}</strong> {item.taskName}
              </div>
            )}
              {item.startDate && (
                <div style={{ marginBottom: "0.26vw" }}>
                  <strong>Start Date:</strong> {formatDate(item.startDate)}
                  {item.startTime && ` at ${item.startTime}`}
                </div>
              )}
              {item.endDate && (
                <div>
                  <strong>End Date:</strong> {item.endDate}
                  {item.endTime && ` at ${item.endTime}`}
                </div>
              )}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "0.9vw",
        boxShadow: "0 0.05vw 0.16vw rgba(0, 0, 0, 0.1)",
        height: "100%",}} className="overflow-hidden"
    >
      <div
        style={{
          padding: "0.83vw",
          borderBottom: "0.05vw solid #E5E7EB",
          backgroundColor: "#ffffff",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "0.94vw", fontWeight: "500", color: "#111827" }}>
          Today's Tasks
        </h3>
      </div>
      <div
        style={{ borderRadius: "0 0 0.42vw 0.42vw" }}
        className=" overflow-y-auto min-h-0 max-h-[90%] bg-white text-gray-700"
      >
        {renderTaskList()}
      </div>
    </div>
  );
};

const CelebrationsCard = ({
  employees = [],
  events = [],
  loading,
  apiBaseUrl,
}) => {
  const [celebrations, setCelebrations] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (loading || !apiBaseUrl) {
      setCelebrations([]);
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const birthdaysToday = (employees || [])
      .filter((emp) => {
        if (!emp.dob) return false;
        const dobDate = new Date(emp.dob);
        return (
          dobDate.getMonth() === today.getMonth() &&
          dobDate.getDate() === today.getDate()
        );
      })
      .map((emp) => ({
        id: emp._id?.$oid || emp.emailId,
        type: "birthday",
        title: emp.employeeName,
        avatar: emp.profile ? `${apiBaseUrl}${emp.profile}` : null,
        initials: getInitials(emp.employeeName),
      }));

    const specialDaysToday = (events || [])
      .filter((event) => {
        if (event.eventtype !== "Special day" || !event.date) return false;
        const startDate = new Date(event.date + "T00:00:00");
        const endDate = event.endDate
          ? new Date(event.endDate + "T23:59:59")
          : startDate;
        return today >= startDate && today <= endDate;
      })
      .map((event) => ({
        id: event._id?.$oid || event.title,
        type: "special_day",
        title: event.title,
        description: event.agenda,
      }));

    setCelebrations([...birthdaysToday, ...specialDaysToday]);
  }, [employees, events, loading, apiBaseUrl]);

  useEffect(() => {
    if (celebrations.length > 1) {
      const interval = setInterval(
        () => setCurrentIndex((prev) => (prev + 1) % celebrations.length),
        5000
      );
      return () => clearInterval(interval);
    }
  }, [celebrations.length]);

  const handleNext = () =>
    setCurrentIndex((prev) => (prev + 1) % celebrations.length);
  const handlePrev = () =>
    setCurrentIndex(
      (prev) => (prev - 1 + celebrations.length) % celebrations.length
    );

  if (loading)
    return (
      <div className="bg-white p-[1vw] rounded-xl shadow-sm h-full flex items-center justify-center">
        <p className="text-gray-500 text-[0.8vw]">Loading...</p>
      </div>
    );
  if (celebrations.length === 0)
    return (
      <div className="bg-white p-[1vw] rounded-xl shadow-sm h-full flex justify-between items-start">
        <div className="flex flex-col gap-[0.5vw]">
          <div className="flex items-center gap-[0.5vw]">
            <CalendarIcon className="w-[1.3vw] h-[1.3vw] text-blue-500" />
            <span className="text-blue-500 font-bold text-[0.9vw]">
              Celebrations
            </span>
          </div>
          <p className="text-gray-500 font-medium text-[0.85vw]">
            No celebrations today.
          </p>
        </div>
        <div className="w-[4vw] h-[4vw] opacity-80">
          <img
            src="https://cdn-icons-png.flaticon.com/512/2617/2617978.png"
            alt="None"
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    );

  const item = celebrations[currentIndex];
  const isBirthday = item.type === "birthday";

  return (
    <div className="bg-white p-[1vw] rounded-xl shadow-sm h-full flex flex-col justify-start relative overflow-hidden group">
      <div className="flex justify-between items-start w-full">
        <div className="flex flex-col gap-[0.5vw] w-full z-10 flex-1 min-w-0 mr-2">
          <div className="flex  gap-[0.5vw]">
            {isBirthday ? (
              <CalendarIcon className="w-[1.2vw] h-[1.2vw] text-red-500" />
            ) : (
              <StarIcon className="w-[1.2vw] h-[1.2vw] text-yellow-500" />
            )}
            <span
              className={`font-bold text-[0.9vw] ${
                isBirthday ? "text-red-500" : "text-yellow-600"
              }`}
            >
              {isBirthday ? "Happy Birthday!" : "Special Day!"}
            </span>
          </div>

          <div className="flex gap-[1vw] mt-[1vw]">
            {isBirthday &&
              (item.avatar ? (
                <div className="relative w-[3vw] h-[3vw]">
                  <img
                    src={item.avatar}
                    alt={item.title}
                    className="w-full h-full rounded-full object-cover border-2 border-blue-100"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                  <div className="hidden absolute  inset-0 bg-blue-500 text-white rounded-full flex items-center justify-center font-medium text-[1.2vw]">
                    {item.initials || "?"}
                  </div>
                </div>
              ) : (
                <div
                  className={`w-[3vw] h-[3vw]  rounded-full flex items-center justify-center text-[1.2vw] font-bold bg-blue-100 text-blue-700`}
                >
                  {item.initials}
                </div>
              ))}
            {isBirthday ? (
              <p className="text-gray-700 font-medium text-[0.85vw] ">
                Wishing you a wonderful day, <br />
                <span className="font-semibold text-gray-900 text-[0.95vw]">
                  {item.title}!
                </span>
              </p>
            ) : (
              <div className="flex justify-between items-center w-full">
                <div>
                  <p className="font-semibold text-gray-900 text-[0.95vw] max-w-[17vw] leading-tight truncate">
                    {item.title}
                  </p>
                  <p className="text-gray-600 font-medium text-[0.8vw] max-w-[17vw] leading-tight mt-1 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="w-[4vw] h-[4vw] rounded-full flex items-center justify-center bg-yellow-100">
                  <StarIcon className="w-[2vw] h-[2vw] text-yellow-500" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {celebrations.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 p-1 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm"
          >
            <ChevronLeftIcon className="w-[1vw] h-[1vw] text-gray-700" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 p-1 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm"
          >
            <ChevronRightIcon className="w-[1vw] h-[1vw] text-gray-700" />
          </button>
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1 z-20">
            {celebrations.map((_, idx) => (
              <div
                key={idx}
                className={`w-[0.4vw] h-[0.4vw] rounded-full transition-colors ${
                  idx === currentIndex ? "bg-blue-600" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const AnnouncementCard = ({ allEvents = [], isLoading, apiError }) => {
  const [todaysAnnouncements, setTodaysAnnouncements] = useState([]);

  useEffect(() => {
    if (isLoading) {
      setTodaysAnnouncements([]);
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeAnnouncements = (allEvents || []).filter((event) => {
      if (event.eventtype !== "Announcement" || !event.date) return false;
      const startDate = new Date(event.date + "T00:00:00");
      const endDate = event.endDate
        ? new Date(event.endDate + "T23:59:59")
        : startDate;
      return today >= startDate && today <= endDate;
    });
    setTodaysAnnouncements(activeAnnouncements);
  }, [allEvents, isLoading]);

  const renderList = () => {
    if (isLoading)
      return (
        <div className="flex items-center justify-center h-full text-gray-500 text-[0.8vw]">
          Loading...
        </div>
      );
    if (todaysAnnouncements.length === 0)
      return (
        <div className="flex items-center justify-center h-full text-gray-500 text-[0.8vw]">
          No announcements.
        </div>
      );

    return todaysAnnouncements.map((item) => (
      <div
        key={item._id.$oid}
        className="bg-blue-50 p-[0.8vw] rounded-lg flex items-start gap-[0.8vw]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 488 486"
          className="w-[1.8vw] h-[1.8vw] flex-shrink-0 mt-[0.2vw] text-blue-600 fill-current"
        >
          <path d="m374.3 2.3c-1.2 1.2-10.9 16-21.7 33-15 23.4-19.6 31.5-19.6 34-0.1 1.8 0.7 3.9 1.7 4.8 1 0.9 2.6 1.9 3.5 2.2 1 0.4 3 0.2 4.5-0.3 2.1-0.8 6-5.9 15.8-21.3 7.1-11.1 16.4-25.8 20.7-32.7 4.3-6.9 7.8-13.5 7.8-14.7 0-1.3-1.1-3.4-2.5-4.8-1.5-1.5-3.6-2.5-5.3-2.5-1.7 0-3.7 0.9-4.9 2.3zm-246.8 360.8c-12.1 7.1-25 14-28.8 15.4l-6.7 2.5c1 5.8 3.2 13.6 5.7 21 2.5 7.7 7.2 18.9 10.9 26 3.5 6.9 9.5 16.7 13.2 21.9 3.7 5.2 11.2 14.1 16.7 19.9 7.6 7.9 11.5 11.1 16 13.3 4.9 2.3 7.4 2.8 13.3 2.9 6.3 0 8.1-0.4 14-3.4 3.7-1.9 8.5-5.4 10.6-7.8 2.2-2.4 4.9-6.3 5.9-8.8 1.1-2.5 2.2-7.2 2.5-10.5 0.3-3.8-0.1-8-1.1-11.5-1.2-4.2-3.7-8.2-10.3-16.5-4.8-6.1-10.4-13.5-12.4-16.5-2.1-3-6.3-10.2-9.3-16-3-5.8-7.1-14.8-9-20-2-5.2-4.4-12.9-5.5-17-1.1-4.1-2.4-7.6-2.8-7.7-0.5 0-10.8 5.7-22.9 12.8zm80-356.9c-1.1 0.6-2.8 2.8-3.8 4.9-1 2.3-1.7 6.3-1.7 9.9 0 3.3 0.9 10.6 2 16.2 1.1 5.7 3.9 16.4 6.3 23.8 2.5 7.4 6.7 19.1 9.5 26 2.7 6.9 7.1 17.2 9.7 23 2.6 5.8 6.7 14.4 9.1 19.2l4.4 8.8c10.2-3.8 13.9-4.3 22-4.4 7.8-0.1 11.9 0.4 16 1.8 3 1 8 3.2 11 4.9 3 1.7 8 5.6 11 8.7 3 3 7 8.5 8.9 12 1.9 3.6 4 8.7 4.8 11.5 0.7 2.7 1.3 8.8 1.3 13.5 0 4.7-0.7 11-1.5 14-0.8 3-2.7 8-4.2 11-1.6 3-5.9 8.6-9.6 12.5l-6.8 7c10.5 15.4 18.5 26.5 24.6 34.6 6 8.1 15.7 20.2 21.5 27 5.8 6.7 13.9 15.3 18 19.1 4.1 3.8 10.8 9.2 14.8 11.9 3.9 2.7 8.9 5.2 11 5.5 2 0.4 4.8 0.3 6.2-0.2 1.4-0.5 3.3-2.5 4.3-4.4 1.5-2.9 1.8-5.2 1.4-14-0.2-6.1-1.3-14-2.6-19-1.2-4.7-3.8-13.5-5.8-19.5-1.9-6.1-5.7-16.4-8.3-23-2.6-6.6-6.9-17-9.5-23-2.7-6.1-10.1-21.4-16.5-34-6.5-12.7-16.1-30.7-21.5-40-5.4-9.4-13.2-22.4-17.3-29-4.1-6.6-11.1-17.4-15.5-24-4.4-6.6-12.3-17.9-17.5-25-5.2-7.2-13.3-17.7-18.1-23.5-4.7-5.7-12.4-14.5-17.1-19.4-4.7-4.9-11.9-11.6-16-14.9-4.1-3.3-9.7-7.1-12.5-8.3-2.7-1.3-6.1-2.4-7.5-2.3-1.4 0-3.4 0.5-4.5 1.1zm-24.3 21.5c-1.1 1.6-3.9 6.6-6.2 11.3-2.3 4.7-5.1 10.7-6.2 13.5-1.1 2.7-7.1 19.8-13.3 38-6.2 18.1-12.7 36.6-14.5 41-1.7 4.4-5.7 13.2-8.8 19.5-3.1 6.3-9.1 16.7-13.3 23-4.2 6.3-11.1 15.2-15.3 19.7l-7.6 8.3c53.7 93.4 69.6 120.9 70.1 121.5 0.5 0.7 3.3 0.4 8.1-0.8 4-0.9 11.1-2.3 15.8-2.9 4.7-0.7 16.6-1.2 26.5-1.2 10.6 0.1 22.9 0.8 30 1.7 6.6 0.9 24.6 4.2 40 7.2 15.4 3 32.9 6.5 39 7.6 6 1.1 17.1 2.3 24.5 2.6 7.9 0.4 13.8 0.3 14.2-0.3 0.4-0.5-2-2.9-5.4-5.4-3.4-2.5-10.4-8.8-15.7-14-5.3-5.2-13.4-14-18-19.5-4.6-5.5-12.7-15.9-18-23-5.4-7.2-14-19.3-19.3-27-5.2-7.7-13.5-20.3-18.3-28-4.9-7.7-13.7-22.6-19.7-33-6.1-10.5-16.8-30.7-23.8-45-7.1-14.3-15.8-33-19.3-41.5-3.5-8.5-8.5-21.6-11-29-2.6-7.4-5.8-18-7.2-23.5-1.4-5.5-2.8-13-3.1-16.8-0.3-3.7-0.9-6.7-1.4-6.7-0.5 0-1.8 1.2-2.8 2.7zm233.3 66.8c-17.6 10.1-32.8 19.5-33.8 20.7-1 1.3-1.8 3.3-1.7 4.5 0 1.3 1.1 3.4 2.5 4.8 1.5 1.5 3.6 2.5 5.3 2.5 1.7 0 14.6-6.9 34.2-18.1 17.3-10 32.5-19.2 33.8-20.5 1.3-1.4 2.2-3.7 2.2-5.4 0-1.7-0.9-3.9-2-5-1.2-1.2-3.3-2-5.2-2-2.5 0-11.6 4.8-35.3 18.5zm20.5 83.2c-26.5 1.2-30.8 1.6-33 3.2-1.6 1.2-2.6 3-2.8 5.2q-0.3 3.4 1.6 5.9c1.9 2.3 2.6 2.5 9.4 2.3 4-0.1 19.4-0.7 34.3-1.3 14.8-0.6 29.4-1.3 32.3-1.5 3.4-0.3 5.9-1.2 7.2-2.5 1.2-1.2 2-3.4 2-5.3 0-2-0.8-4-2.2-5.4-2-2-3.3-2.2-10.3-2.1-4.4 0-21.7 0.7-38.5 1.5zm-379.4 50.7c-15.3 8.9-30.2 18-33.1 20.3-3 2.4-7.5 6.9-10 10-2.5 3.2-6.1 8.9-8 12.8-1.9 3.8-4.1 9.9-4.9 13.5-0.9 3.6-1.6 11-1.6 16.5 0 7.1 0.6 12.2 2.1 17.5 1.1 4.1 3.7 10.6 5.7 14.5 2.5 4.8 6.4 9.7 12.2 15.6 6.9 7 10.1 9.4 17 12.7 4.7 2.3 11.4 4.8 15 5.6 3.6 0.9 10.5 1.6 15.5 1.6 5.6 0 11.8-0.7 16.5-1.9 4.1-1 9.5-2.9 12-4.1 2.5-1.2 16.3-9 30.8-17.3 18.6-10.8 26.2-15.6 25.9-16.7-0.2-0.8-14.9-26.7-32.7-57.5-17.8-30.8-32.9-56.7-33.5-57.6-1.1-1.4-4.6 0.4-28.9 14.5z" />
        </svg>
        <div className="flex-1">
          <p
            className="text-[0.9vw] font-bold text-blue-800 max-w-[20vw] truncate leading-tight"
            title={item.title}
          >
            {item.title}
          </p>
          <p
            className="text-[0.8vw] font-medium text-gray-600 max-w-[20vw] truncate mt-1"
            title={item.agenda}
          >
            {item.agenda}
          </p>
        </div>
      </div>
    ));
  };

  return (
    <div className="bg-white p-[1vw] rounded-xl shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-[0.5vw] mb-[0.8vw] flex-shrink-0">
        <MessageSquareIcon className="w-[1.2vw] h-[1.2vw] text-blue-500" />
        <h3 className="font-bold text-[1vw] text-blue-500">Announcements</h3>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 pr-[0.5vw] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <div className="space-y-[0.8vw]">{renderList()}</div>
      </div>
    </div>
  );
};

const MeetingsCard = ({
  allEvents = [],
  isLoading: parentLoading,
  apiError,
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekViewDates, setWeekViewDates] = useState([]);
  const [filteredMeetings, setFilteredMeetings] = useState([]);
  const [hoveredMeeting, setHoveredMeeting] = useState(null);
  const [attendeeNames, setAttendeeNames] = useState({});
  const [loadingAttendees, setLoadingAttendees] = useState({});
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const meetingRefs = useRef({});

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    "https://hcxqp38j-5000.inc1.devtunnels.ms";
  const monthYearString = selectedDate
    .toLocaleString("default", { month: "long", year: "numeric" })
    .toUpperCase();

  const isSameDay = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  useEffect(() => {
    const meetings = allEvents.filter((e) => e.eventtype === "Meeting");
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dates = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + i);
      dates.push({
        fullDate: d,
        num: String(d.getDate()).padStart(2, "0"),
        name: dayNames[d.getDay()],
      });
    }
    setWeekViewDates(dates);

    const selectedDay = new Date(selectedDate);
    selectedDay.setHours(0, 0, 0, 0);

    const meetingsForDay = meetings.filter((m) => {
      if (!m.date) return false;
      const start = new Date(m.date + "T00:00:00");
      const end = m.endDate ? new Date(m.endDate + "T23:59:59") : start;
      return selectedDay >= start && selectedDay <= end;
    });

    setFilteredMeetings(meetingsForDay);
  }, [selectedDate, allEvents]);

  const fetchAttendees = async (meetingId, employeeIds) => {
    if (!employeeIds || employeeIds.length === 0) {
      setAttendeeNames((prev) => ({ ...prev, [meetingId]: ["No attendees"] }));
      return;
    }
    if (attendeeNames[meetingId]) return;

    setLoadingAttendees((prev) => ({ ...prev, [meetingId]: true }));

    try {
      const responses = await Promise.all(
        employeeIds.map((id) =>
          fetch(`${API_BASE}/Profile/${id}`)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        )
      );

      const names = responses
        .map((emp) => emp?.data?.employeeName)
        .filter(Boolean)
        .sort();

      setAttendeeNames((prev) => ({
        ...prev,
        [meetingId]: names.length > 0 ? names : ["Unknown"],
      }));
    } catch (err) {
      console.error("Failed to load attendees:", err);
      setAttendeeNames((prev) => ({ ...prev, [meetingId]: ["Error loading"] }));
    } finally {
      setLoadingAttendees((prev) => ({ ...prev, [meetingId]: false }));
    }
  };

  const handleMouseEnter = (meetingId, employeeIds) => {
    setHoveredMeeting(meetingId);
    const element = meetingRefs.current[meetingId];
    if (element) {
      const rect = element.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top - 10,
        left: rect.left + rect.width / 2,
      });
    }
    if (employeeIds.length > 0 && !attendeeNames[meetingId]) {
      fetchAttendees(meetingId, employeeIds);
    }
  };

  const formatTime = (start, end) => {
    if (!start && !end) return "12:00 AM - 11:59 PM";
    const fmt = (t) => {
      if (!t || t.trim() === "") return null;
      const [h, m] = t.split(":");
      if (!h || !m) return null;
      let hr = parseInt(h, 10);
      const suffix = hr >= 12 ? "PM" : "AM";
      hr = hr % 12 || 12;
      return `${hr}:${m.padStart(2, "0")} ${suffix}`;
    };
    const s = fmt(start);
    const e = fmt(end);
    if (s && e) return `${s} - ${e}`;
    if (s) return `${s} - 11:59 PM`;
    if (e) return `12:00 AM - ${e}`;
    return "12:00 AM - 11:59 PM";
  };

  const changeDate = (offset) => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + offset);
      return d;
    });
  };

  const Tooltip = ({ meetingId }) => {
    if (hoveredMeeting !== meetingId) return null;
    const employeeIds =
      filteredMeetings.find((m) => {
        const id = m._id?.$oid || m._id;
        return id === meetingId;
      })?.employees || [];
    if (employeeIds.length === 0) return null;

    return createPortal(
      <div
        className="fixed px-[0.7vw] py-[0.5vw] bg-black text-white rounded-lg shadow-2xl text-[0.78vw] whitespace-nowrap z-[9999] pointer-events-none"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          transform: "translate(-50%, -100%)",
        }}
      >
        <div className="font-semibold text-gray-300 text-[0.9vw] mb-[0.4vw]">
          Attendees
        </div>
        {loadingAttendees[meetingId] ? (
          <div className="text-[0.85vw]">Loading...</div>
        ) : (
          attendeeNames[meetingId]?.map((name, i) => (
            <div key={i} className="leading-tight">
              • {name}
            </div>
          )) || <div>No names found</div>
        )}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-black"></div>
      </div>,
      document.body
    );
  };

  return (
    <div className="bg-white p-[1vw] px-[1.5vw] rounded-xl shadow-sm flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-[1vw] flex-shrink-0">
        <h3 className="font-semibold text-[0.9vw] text-gray-800">Meetings</h3>
        <div className="flex items-center gap-[1vw]">
          <p className="text-[0.75vw] text-gray-500 font-medium">
            {monthYearString}
          </p>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="text-[0.7vw] cursor-pointer font-semibold bg-gray-200 text-gray-700 px-[0.8vw] py-[0.25vw] rounded-full hover:bg-gray-300 transition"
          >
            Today
          </button>
        </div>
      </div>

      {/* Week Navigator */}
      <div className="flex items-center justify-between mb-[1vw] flex-shrink-0 border-b border-gray-200 pb-[0.5vw]">
        <button
          onClick={() => changeDate(-1)}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <ChevronLeftIcon className="w-[1vw] h-[1vw] text-gray-600" />
        </button>
        <div className="flex justify-around flex-grow px-1">
          {weekViewDates.map((day, i) => {
            const selected = isSameDay(day.fullDate, selectedDate);
            return (
              <div
                key={i}
                onClick={() => setSelectedDate(day.fullDate)}
                className="flex flex-col items-center gap-1 cursor-pointer p-1"
              >
                <span className="text-[0.8vw] font-medium text-gray-500">
                  {day.name}
                </span>
                <span
                  className={`w-[2vw] h-[2vw] flex items-center justify-center rounded-full font-bold text-[0.85vw] transition ${
                    selected
                      ? "bg-blue-600 text-white"
                      : "text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  {day.num}
                </span>
              </div>
            );
          })}
        </div>
        <button
          onClick={() => changeDate(1)}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <ChevronRightIcon className="w-[1vw] h-[1vw] text-gray-600" />
        </button>
      </div>

      {/* Meetings List - Height changed to flex-1 for full screen compatibility */}
      <div className="space-y-[0.8vw] overflow-y-auto flex-1 min-h-0 pr-[0.5vw] scrollbar-thin">
        {parentLoading ? (
          <div className="text-center text-gray-500 text-[0.8vw] py-8">
            Loading meetings...
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="text-center text-gray-500 text-[0.8vw] py-8">
            No meetings scheduled
          </div>
        ) : (
          filteredMeetings.map((meeting) => {
            const meetingId = meeting._id?.$oid || meeting._id;
            const employeeIds = meeting.employees || [];
            return (
              <div
                key={meetingId}
                ref={(el) => (meetingRefs.current[meetingId] = el)}
                className="bg-gray-100 p-[0.8vw] rounded-lg hover:bg-gray-150 transition-colors relative group"
                onMouseEnter={() => handleMouseEnter(meetingId, employeeIds)}
                onMouseLeave={() => setHoveredMeeting(null)}
              >
                <p className="text-[0.8vw] font-semibold text-gray-700">
                  {formatTime(meeting.startTime, meeting.endTime)}
                </p>
                <p
                  className="text-[0.9vw] font-bold text-gray-900 mt-1 truncate max-w-full"
                  title={meeting.title}
                >
                  {meeting.title}
                </p>
                {meeting.agenda && (
                  <p className="text-[0.8vw] text-gray-600 mt-1 line-clamp-2">
                    {meeting.agenda}
                  </p>
                )}
                <Tooltip meetingId={meetingId} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// --- MAIN PAGE ---
const Personal = () => {
  const [stats, setStats] = useState({
    employees: 0,
    overall: 0,
    completed: 0,
    ongoing: 0,
    delayed: 0,
    overdue: 0,
  });
  const [employees, setEmployees] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [unscheduledTask, setUnscheduledTask] = useState([]);
  const [dayTask, setDayTask] = useState([]);
  const [taskEmployees, setTaskEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const memoizedEmployees = useMemo(() => taskEmployees, [taskEmployees]);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, empsRes, eventsRes, tasksRes] = await Promise.all([
          fetch(`${API_BASE_URL}/analytics/overview`),
          fetch(`${API_BASE_URL}/employeeRegister/all`),
          fetch(`${API_BASE_URL}/events`),
          fetch(`${API_BASE_URL}/tasks/dashboard`),
        ]);

        if (!statsRes.ok || !empsRes.ok || !eventsRes.ok || !tasksRes.ok)
          throw new Error("Data fetch failed");

        const [statsData, empsData, eventsData, tasksData] = await Promise.all([
          statsRes.json(),
          empsRes.json(),
          eventsRes.json(),
          tasksRes.json(),
        ]);

        const s = statsData.data.overallStats;
        setStats({
          employees:
            empsData.employees?.filter((e) => e.role === "Employee").length ||
            0,
          overall:
            (s.completed || 0) +
            (s.ongoing || 0) +
            (s.delayed || 0) +
            (s.overdue || 0),
          completed: s.completed || 0,
          ongoing: s.ongoing || 0,
          delayed: s.delayed || 0,
          overdue: s.overdue || 0,
        });
        setEmployees(empsData.employees || []);
        setAllEvents(eventsData.data || []);
        setAllTasks(tasksData.tasks || []);
        setUnscheduledTask(tasksData.unscheduledTask || []);
        setDayTask(tasksData.dayTask || []);
        setTaskEmployees(tasksData.employees || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [API_BASE_URL]);

  return (
    <div className="flex flex-col gap-[1.5vh] h-full w-full pb-[1vh]">
      <div className="flex justify-between w-full  flex-none">
        {statsDataConfig.map((s) => (
          <StatCard
            key={s.type}
            value={loading ? "-" : stats[s.type]}
            label={s.title}
            color={s.color}
            iconSrc={s.iconSrc}
            iconAlt={s.title}
          />
        ))}
      </div>

      {error && (
        <div className="text-red-500 text-[0.8vw] bg-red-100 p-2 rounded">
          Error: {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-[1vw] flex-1 min-h-0">
        <div className="h-full min-h-0">
          <TodayTasksCard
            tasks={allTasks}
            loading={loading}
            apiBaseUrl={API_BASE_URL}
            unscheduledTask={unscheduledTask}
            dayTask={dayTask}
            employees={memoizedEmployees}
          />
        </div>

        <div className="flex flex-col gap-[1.5vh] h-full min-h-0">
          <div className="h-[28%] flex-none">
            <CelebrationsCard
              employees={employees}
              events={allEvents}
              loading={loading}
              apiBaseUrl={API_BASE_URL}
            />
          </div>
          <div className="flex-1 min-h-0">
            <AnnouncementCard
              allEvents={allEvents}
              isLoading={loading}
              apiError={error}
            />
          </div>
        </div>

        <div className="h-full min-h-0">
          <MeetingsCard
            allEvents={allEvents}
            isLoading={loading}
            apiError={error}
          />
        </div>
      </div>
    </div>
  );
};

export default Personal;
