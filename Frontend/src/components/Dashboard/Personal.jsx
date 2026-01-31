import React, { useState, useEffect, useRef } from "react";
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
const QuoteIcon = ({ className }) => (
  <Icon className={className}>
    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
  </Icon>
);
const SparkleIcon = ({ className }) => (
  <Icon className={className}>
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z"></path>
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

const StatCard = ({ value, label, color, iconSrc, iconAlt }) => (
  <div className="bg-white rounded-lg shadow-sm flex flex-col justify-center px-[0.8vw] py-[0.7vw] gap-[0.5vw] w-[16%] h-full">
    <div className="flex items-center justify-between">
      <p className={`text-[1.2vw] font-semibold ${color}`}>{value}</p>
      <img src={iconSrc} alt={iconAlt} className="w-[1.6vw] h-[1.6vw]" />
    </div>
    <p className="text-[0.85vw] text-gray-700">{label}</p>
  </div>
);

const TodayTasksCard = () => {
  const [todaysWorkItems, setTodaysWorkItems] = useState([]);
  const [imageErrors, setImageErrors] = useState({});
  const [hoveredTask, setHoveredTask] = useState(null);

  const handleImageError = (itemId) => {
    setImageErrors((prev) => ({ ...prev, [itemId]: true }));
  };

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
    if (todaysWorkItems.length === 0) {
      return (
        <div style={{ padding: "1.04vw", textAlign: "center", color: "#6B7280" }}>
          No tasks available
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
        height: "100%",
      }}
      className="overflow-hidden"
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
        className="overflow-y-auto min-h-0 max-h-[90%] bg-white text-gray-700"
      >
        {renderTaskList()}
      </div>
    </div>
  );
};

const CelebrationsCard = () => {
  const [celebrations, setCelebrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  // Fetch today's celebrations
  useEffect(() => {
    const fetchTodayCelebrations = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/celebrations/today`);
        const data = await response.json();
        
        if (data.status && data.celebrations) {
          setCelebrations(data.celebrations);
        } else {
          setCelebrations([]);
        }
      } catch (error) {
        console.error("Error fetching celebrations:", error);
        setCelebrations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayCelebrations();
  }, [API_URL]);

  // Auto-rotate celebration items
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

  // Get occasion color
  const getOccasionColor = (occasion) => {
    switch (occasion) {
      case "Birthday":
        return { 
          bg: "bg-gradient-to-br from-red-50 to-pink-50", 
          text: "text-red-600", 
          border: "border-red-200", 
          badge: "bg-red-100 text-red-800"
        };
      case "Work Anniversary":
        return { 
          bg: "bg-gradient-to-br from-indigo-50 to-purple-50", 
          text: "text-indigo-600", 
          border: "border-indigo-200", 
          badge: "bg-indigo-100 text-indigo-800"
        };
      case "Holiday":
        return { 
          bg: "bg-gradient-to-br from-blue-50 to-cyan-50", 
          text: "text-blue-600", 
          border: "border-blue-200", 
          badge: "bg-blue-100 text-blue-800"
        };
      case "Special Day":
      case "Celebration":
        return { 
          bg: "bg-gradient-to-br from-yellow-50 to-orange-50", 
          text: "text-yellow-600", 
          border: "border-yellow-200", 
          badge: "bg-yellow-100 text-yellow-800"
        };
      default:
        return { 
          bg: "bg-gradient-to-br from-gray-50 to-slate-50", 
          text: "text-gray-600", 
          border: "border-gray-200", 
          badge: "bg-gray-100 text-gray-800"
        };
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (celebrations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm h-full flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 mb-3 text-gray-400">
          <SparkleIcon className="w-full h-full" />
        </div>
        <h3 className="font-bold text-gray-700 mb-1">No Celebrations Today</h3>
      </div>
    );
  }

  const item = celebrations[currentIndex];
  const colors = getOccasionColor(item.occasion);
  const API_URL1 = import.meta.env.VITE_API_BASE_URL1;
  const imageUrl = item.imageUrl?.startsWith("http") ? item.imageUrl : `${API_URL1}${item.imageUrl}`;

  return (
<div className={`${colors.bg} rounded-xl shadow-sm h-full relative overflow-hidden group`}>
  {/* Navigation Arrows */}
  {celebrations.length > 1 && (
    <>
      <button
        onClick={handlePrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-md"
      >
        <ChevronLeftIcon className="w-3.5 h-3.5 text-gray-700" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-md"
      >
        <ChevronRightIcon className="w-3.5 h-3.5 text-gray-700" />
      </button>
    </>
  )}

  {/* Celebration Content */}
  <div className="h-full p-4 flex flex-col lg:flex-row gap-4">
    {/* Left Side - ONLY Image */}
    <div className="lg:w-2/5">
      <div className="relative h-full rounded-xl overflow-hidden shadow-md">
        <img
          src={imageUrl}
          alt={item.occasion || "Celebration"}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236B7280'%3E%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Cline x1='16' y1='2' x2='16' y2='6'%3E%3C/line%3E%3Cline x1='8' y1='2' x2='8' y2='6'%3E%3C/line%3E%3Cline x1='3' y1='10' x2='21' y2='10'%3E%3C/line%3E%3C/svg%3E`;
          }}
        />
      </div>
    </div>

    {/* Right Side - ALL other content */}
    <div className="lg:w-3/5 flex flex-col">
      {/* Header with Occasion and Date */}
      <div className="mb-3">
        <h2 className={`text-sm font-semibold ${colors.text} mb-1`}>
          {item.occasion}
        </h2>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <CalendarIcon className="w-3 h-3" />
          <span>{formatDate(item.date)}</span>
        </div>
      </div>

      {/* Quote Section */}
      <div className="flex-1 flex flex-col">
        {/* Quote Icon */}
        <div className="mb-2 flex items-center gap-1.5">
          <QuoteIcon className={`w-4 h-4 ${colors.text}`} />
          <span className={`text-xs font-medium ${colors.text}`}>Quote</span>
        </div>

        {/* Quote Text */}
        <div className="flex-1">
          <div className="relative p-3 rounded-lg bg-white/70 border ${colors.border}">
            <p className="text-xs text-gray-800 leading-relaxed italic">
              {item.quote || item.description}
            </p>
          </div>

          {/* Decorative Elements */}
          <div className="flex items-center gap-1 mt-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            <div className="w-1 h-1 rounded-full bg-gray-400"></div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-3 pt-2 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${colors.badge.split(' ')[0]}`}></div>
            <span className="text-gray-600">Today's Celebration</span>
          </div>
          <div className="flex items-center gap-1">
            <SparkleIcon className="w-3 h-3 text-yellow-500" />
            <span className="text-gray-600">#{currentIndex + 1} of {celebrations.length}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Bottom Indicators */}
  {celebrations.length > 1 && (
    <div className="px-4 pb-2">
      <div className="flex items-center justify-center gap-1">
        {celebrations.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`transition-all duration-300 ${
              idx === currentIndex 
                ? `w-5 h-1 rounded-full ${colors.badge.split(' ')[0]}` 
                : "w-1 h-1 rounded-full bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`Go to celebration ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  )}
</div>
  );
};

const AnnouncementCard = () => {
  const [todaysAnnouncements, setTodaysAnnouncements] = useState([]);

  const renderList = () => {
    if (todaysAnnouncements.length === 0)
      return (
        <div className="flex items-center justify-center h-full text-gray-500 text-[0.8vw]">
          No announcements.
        </div>
      );

    return todaysAnnouncements.map((item) => (
      <div
        key={item._id?.$oid || item.id}
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

const MeetingsCard = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekViewDates, setWeekViewDates] = useState([]);
  const [filteredMeetings, setFilteredMeetings] = useState([]);
  const [hoveredMeeting, setHoveredMeeting] = useState(null);
  const [attendeeNames, setAttendeeNames] = useState({});
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const meetingRefs = useRef({});

  const monthYearString = selectedDate
    .toLocaleString("default", { month: "long", year: "numeric" })
    .toUpperCase();

  const isSameDay = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  useEffect(() => {
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

    const meetingsForDay = filteredMeetings.filter((m) => {
      if (!m.date) return false;
      const start = new Date(m.date + "T00:00:00");
      const end = m.endDate ? new Date(m.endDate + "T23:59:59") : start;
      return selectedDay >= start && selectedDay <= end;
    });

    setFilteredMeetings(meetingsForDay);
  }, [selectedDate]);

  const getAttendeeNames = (employeeIds) => {
    const placeholderEmployees = [
      { _id: "1", employeeName: "John Smith" },
      { _id: "2", employeeName: "Sarah Johnson" },
      { _id: "3", employeeName: "Mike Wilson" },
      { _id: "4", employeeName: "Emily Davis" },
      { _id: "5", employeeName: "David Brown" },
    ];
    
    return employeeIds
      .map((id) => {
        const emp = placeholderEmployees.find((e) => e._id === id);
        return emp ? emp.employeeName : "Unknown";
      })
      .sort();
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
      const names = getAttendeeNames(employeeIds);
      setAttendeeNames((prev) => ({
        ...prev,
        [meetingId]: names.length > 0 ? names : ["Unknown"],
      }));
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
        {attendeeNames[meetingId]?.map((name, i) => (
          <div key={i} className="leading-tight">
            • {name}
          </div>
        )) || <div>No names found</div>}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-black"></div>
      </div>,
      document.body
    );
  };

  return (
    <div className="bg-white p-[1vw] px-[1.5vw] rounded-xl shadow-sm flex flex-col overflow-hidden h-full">
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

      <div className="space-y-[0.8vw] overflow-y-auto flex-1 min-h-0 pr-[0.5vw] scrollbar-thin">
        {filteredMeetings.length === 0 ? (
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
    employees: 5,
    overall: 12,
    completed: 5,
    ongoing: 4,
    delayed: 2,
    overdue: 1,
  });

  const placeholderIconSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236B7280'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'/%3E%3C/svg%3E";

  return (
    <div className="flex flex-col gap-[1.5vh] h-full w-full pb-[1vh]">
      <div className="flex justify-between w-full flex-none">
        {statsDataConfig.map((s) => (
          <StatCard
            key={s.type}
            value={stats[s.type]}
            label={s.title}
            color={s.color}
            iconSrc={placeholderIconSrc}
            iconAlt={s.title}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-[1vw] flex-1 min-h-0">
        <div className="h-full min-h-0">
          <TodayTasksCard />
        </div>

        <div className="flex flex-col gap-[1.5vh] h-full min-h-0">
          <div className="flex-1 min-h-0">
            <CelebrationsCard />
          </div>
          <div className="flex-1 min-h-0">
            <AnnouncementCard />
          </div>
        </div>

        <div className="h-full min-h-0">
          <MeetingsCard />
        </div>
      </div>
    </div>
  );
};

export default Personal;