import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useNotification } from "../components/NotificationContext";

const Projects = () => {
  const navigate = useNavigate();
  const { notify } = useNotification();
  const location = useLocation();
  const tableBodyRef = useRef(null);

  const [ProjectCount, setProjectCount] = useState(1);
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  const [loggedEmpDetails, setloggedEmpDetails] = useState({
    role: "",
    id: "",
  });

  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  // you said "show everything" — default false but even if true we won't hide across roles unless explicitly checked below
  const [showYoursOnly, setShowYoursOnly] = useState(false);
  const [selectedPercentageRange, setSelectedPercentageRange] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [employeeList, setEmployeeList] = useState([]);
  const filterRef = useRef(null);

  const percentageRanges = [
    { label: "0% - 25%", min: 0, max: 25 },
    { label: "26% - 50%", min: 26, max: 50 },
    { label: "51% - 75%", min: 51, max: 75 },
    { label: "76% - 100%", min: 76, max: 100 },
  ];

  const statusOptions = [
    { label: "Completed", value: "completed" },
    { label: "Delayed", value: "delayed" },
    { label: "In Progress", value: "inprogress" },
    { label: "Overdue", value: "overdue" },
    { label: "Not Started", value: "notstarted" },
  ];

  // calculate items per page based on table container height
  useEffect(() => {
    const calculateItemsPerPage = () => {
      if (tableBodyRef.current) {
        const tableHeight = tableBodyRef.current.offsetHeight;
        const rowHeight = 50;
        const calculatedItems = Math.floor(tableHeight / rowHeight);
        setItemsPerPage(calculatedItems > 0 ? calculatedItems : 9);
      }
    };

    calculateItemsPerPage();
    window.addEventListener("resize", calculateItemsPerPage);
    return () => window.removeEventListener("resize", calculateItemsPerPage);
  }, []);

  // read user from storage (robust)
  useEffect(() => {
    const stored =
      sessionStorage.getItem("user") || localStorage.getItem("user");
    if (!stored) return;
    try {
      const user = JSON.parse(stored);
      const id =
        user.id ||
        user.employee_id ||
        user.employeeId ||
        user._id ||
        user.userId ||
        null;
      const role = user.role || user.userRole || user.designation || "";
      setloggedEmpDetails({ role, id });
    } catch (err) {
      console.error("Failed to parse stored user:", err);
    }
  }, []);

  // fetch employee list (only for Super Admin)
  useEffect(() => {
    const fetchEmployees = async () => {
      if (loggedEmpDetails.role !== "Super Admin") return;
      try {
        const resp = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/EmployeeRegister`
        );
        const data = await resp.json();
        if (data && (data.success === true || data.status === "success")) {
          setEmployeeList(data.data || []);
        }
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    };
    fetchEmployees();
  }, [loggedEmpDetails.role]);

  // safe parse helper
  const safeParse = (v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === "object") return v;
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  };

  // fetch projects from backend and normalize results
  const fetchProjects = async (opts = {}) => {
    // opts: { force: boolean } - for debug if needed
    setLoading(true);
    try {
      // Build empIDParam only for backend filtering convenience — but we do not require it.
      let empIDParam = "";
      if (loggedEmpDetails.role === "Employee") {
        empIDParam = loggedEmpDetails.id;
      } else if (loggedEmpDetails.role === "Super Admin" && selectedEmployee) {
        empIDParam = selectedEmployee;
      } else {
        // intentionally leave blank so backend returns all if it handles that
        empIDParam = "";
      }

      const url = `${
        import.meta.env.VITE_API_BASE_URL
      }/projects?search=${encodeURIComponent(
        searchTerm || ""
      )}&empID=${encodeURIComponent(
        empIDParam || ""
      )}&role=${encodeURIComponent(loggedEmpDetails.role || "")}`;

      const resp = await fetch(url);
      if (!resp.ok) {
        console.error(
          "fetchProjects -> non-OK response",
          resp.status,
          await resp.text()
        );
        setAllProjects([]);
        setLoading(false);
        return;
      }

      const data = await resp.json();
      const ok =
        data &&
        (data.success === true ||
          data.status === "success" ||
          data.status === "ok");
      const arr = Array.isArray(data.data) ? data.data : [];

      // Normalize even if empty
      const normalized = (arr || []).map((p) => {
        const colorCode =
          safeParse(p.colorCode) ||
          (p.color ? { code: p.color, name: null } : null);

        const accessRaw =
          safeParse(p.accessGrantedTo) || safeParse(p.access_granted_to) || [];
        const access = Array.isArray(accessRaw) ? accessRaw : [];

        // Normalize access entries to a consistent shape
        const normalizedAccess = access
          .map((a) => ({
            employeeId: String(
              a.employeeId ?? a.employeeID ?? a.employee ?? a.id ?? a._id ?? ""
            ),
            employeeName: a.employeeName ?? a.name ?? a.employeeName ?? "",
            profile: a.profile ?? a.profile_url ?? a.profilePath ?? "",
            grantedAt: a.grantedAt ?? a.granted_at ?? a.updatedAt ?? null,
            raw: a,
          }))
          .filter((a) => a.employeeId);

        // teamHead might be an object or array or id — normalize to list
        let teamHeadList = [];
        if (Array.isArray(p.teamHead) && p.teamHead.length > 0) {
          teamHeadList = p.teamHead.map((th) => ({
            id: th.id || th.employeeId || th.employeeID || th._id || "",
            name: th.name || th.employeeName || th.employee_name || "",
            profile: th.profile || th.profile_url || "",
          }));
        } else if (p.teamHead && typeof p.teamHead === "object") {
          teamHeadList = [
            {
              id:
                p.teamHead.id ||
                p.teamHead.employeeId ||
                p.teamHead.employeeID ||
                p.teamHead._id ||
                "",
              name:
                p.teamHead.name ||
                p.teamHead.employeeName ||
                p.teamHead.employee_name ||
                "",
              profile: p.teamHead.profile || p.teamHead.profile_url || "",
            },
          ];
        } else if (normalizedAccess.length > 0) {
          // fallback: use first access entry as team head (useful when backend stored team head inside accessGrantedTo)
          teamHeadList = normalizedAccess.slice(0, 3).map((a) => ({
            id: a.employeeId,
            name: a.employeeName,
            profile: a.profile,
          }));
        }

        const ownerId = String(
          p.employeeID ?? p.employeeId ?? p.owner ?? p.ownerId ?? ""
        );

        return {
          _id: p._id ?? p.id ?? ownerId ?? Math.random().toString(36).slice(2),
          projectName: p.projectName || p.project_name || p.name || "Untitled",
          companyName: p.companyName || p.company_name || "",
          percentage:
            typeof p.percentage === "number"
              ? p.percentage
              : Number(p.percentage || 0),
          teamHead: teamHeadList, // <-- now an array of head objects
          colorCode,
          accessGrantedTo: normalizedAccess,
          startDate: p.startDate || p.start_date || null,
          endDate: p.endDate || p.end_date || null,
          latestReportDate: p.latestReportDate || p.latest_report_date || null,
          employeeID: ownerId,
          raw: p,
        };
      });

      // Set projects (we show all projects by default; filtering done later by user interactions)
      setAllProjects(normalized);
    } catch (err) {
      console.error("fetchProjects -> error:", err);
      setAllProjects([]);
    } finally {
      setLoading(false);
      setCurrentPage(1);
    }
  };

  // Call fetchProjects on mount and when search/selectedEmployee change.
  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedEmployee, loggedEmpDetails.role]);

  // if base route changes, refetch (keeps parity with your original)
  useEffect(() => {
    if (location.pathname === "/projects") {
      fetchProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // fetch project count (keeps your original endpoint usage)


  // click outside filter dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // helpers for filtering & pagination
  const getProjectStatus = (project) => {
    const today = new Date();
    const endDate = project.endDate ? new Date(project.endDate) : null;

    if (project.percentage === 100) {
      const reportDate = project.latestReportDate
        ? new Date(project.latestReportDate)
        : null;
      if (reportDate && endDate && reportDate > endDate) {
        return "delayed";
      }
      return "completed";
    } else if (endDate && endDate < today) {
      return "overdue";
    } else if (project.percentage > 1) {
      return "inprogress";
    } else {
      return "notstarted";
    }
  };

  const getFilteredProjects = () => {
    // We will show ALL projects by default; apply selected filters only (no role-based hiding)
    let filteredProjects = [...allProjects];

    // client-side search filter (in addition to backend search param)
    if (searchTerm) {
      const st = searchTerm.toLowerCase();
      filteredProjects = filteredProjects.filter(
        (p) =>
          (p.projectName || "").toLowerCase().includes(st) ||
          (p.companyName || "").toLowerCase().includes(st)
      );
    }

    // optional "yours only" — only apply when explicitly checked
    if (showYoursOnly && loggedEmpDetails?.id) {
      const userIdStr = String(loggedEmpDetails.id);
      filteredProjects = filteredProjects.filter(
        (project) =>
          String(project.employeeID || "").trim() === userIdStr ||
          (Array.isArray(project.accessGrantedTo) &&
            project.accessGrantedTo.some(
              (a) =>
                String(a.employeeId || a.employeeID || "").trim() === userIdStr
            ))
      );
    }

    if (selectedPercentageRange) {
      const range = percentageRanges.find(
        (r) => r.label === selectedPercentageRange
      );
      if (range) {
        filteredProjects = filteredProjects.filter(
          (project) =>
            project.percentage >= range.min && project.percentage <= range.max
        );
      }
    }

    if (selectedStatus) {
      filteredProjects = filteredProjects.filter(
        (project) => getProjectStatus(project) === selectedStatus
      );
    }

    if (selectedEmployee) {
      filteredProjects = filteredProjects.filter((project) => {
        const thId =
          project.teamHead?.id ||
          project.teamHead?._id ||
          project.teamHead?.employeeId ||
          "";
        return (
          String(thId) === String(selectedEmployee) ||
          String(project.employeeID) === String(selectedEmployee)
        );
      });
    }

    return filteredProjects;
  };

  const getPaginatedProjects = () => {
    const filtered = getFilteredProjects();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const filteredProjects = getFilteredProjects();
  const paginatedProjects = getPaginatedProjects();
  const totalPages = Math.max(
    1,
    Math.ceil(filteredProjects.length / itemsPerPage || 1)
  );

  const handleClearFilters = () => {
    setSelectedPercentageRange("");
    setSelectedStatus("");
    setShowYoursOnly(false);
    setSelectedEmployee("");
    setSearchTerm("");
  };

  const hasActiveFilters =
    selectedPercentageRange ||
    selectedStatus ||
    selectedEmployee ||
    (showYoursOnly && loggedEmpDetails.role !== "Super Admin");

  const handleViewProject = (project) => {
    navigate("projectOverview/", {
      state: {
        projectId: project._id,
        projectName: project.projectName,
      },
    });
  };

  const handleEditProject = (project) => {
    navigate("newProject", {
      state: {
        projectId: project._id,
        isEditMode: true,
      },
    });
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((c) => c - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((c) => c + 1);
  };

  const handlePageClick = (pageNumber) => setCurrentPage(pageNumber);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
      return pages;
    } else if (currentPage >= totalPages - 2) {
      pages.push(1);
      pages.push("...");
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      return pages;
    } else {
      pages.push(1);
      pages.push("...");
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
      return pages;
    }
  };

  const isBaseRoute = location.pathname === "/projects";

  const ProgressBar = ({ proj }) => {
    const getColor = () => {
      const status = getProjectStatus(proj);
      const bgcolor =
        status === "completed"
          ? "bg-[#22c55e]"
          : status === "overdue"
          ? "bg-[#ef4444]"
          : status === "delayed"
          ? "bg-[#eab308]"
          : status === "inprogress"
          ? "bg-[#6366f1]"
          : "bg-[#d1d5db]";
      return bgcolor;
    };

    return (
      <div className="w-[8vw] bg-gray-200 rounded-full h-[0.8vw] overflow-hidden">
        <div
          className={`h-[0.8vw] rounded-full ${getColor()} transition-all duration-300`}
          style={{ width: `${proj.percentage}%` }}
        />
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedPercentageRange,
    selectedStatus,
    showYoursOnly,
    selectedEmployee,
    itemsPerPage,
  ]);

  return (
    <div className="text-black min-h-[92%] max-h-[92%] w-[100%] max-w-[100%]  overflow-hidden">
      {isBaseRoute ? (
        <>
          <div className="w-[100%] h-[88vh] flex flex-col gap-[1.5vh] mt-[1vw] ">
            {loggedEmpDetails.role !== "Employee" && (
              <div className="w-full flex justify-end h-[5%]">
                <button
                  onClick={() => {
                    navigate("newProject");
                  }}
                  className="px-[0.8vw] py-[0.3vw] bg-[#0064ff] text-white rounded-full hover:bg-blue-700 text-[0.75vw] flex items-center justify-center cursor-pointer"
                >
                  <span className="mr-[0.5vw] text-[0.72vw] text-black bg-white rounded-full w-[1.1vw] font-medium px-[0.5vw] flex justify-center items-center">
                    {ProjectCount}
                  </span>
                  New Projects
                </button>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm h-[94%] flex flex-col">
              <div className="flex items-center justify-between p-[0.8vw] h-[10%] flex-shrink-0">
                <div className="flex items-center gap-[0.5vw]">
                  <span className="font-medium text-[0.9vw] text-gray-800">
                    All projects
                  </span>
                  <span className="text-[0.75vw] text-gray-500">
                    ({filteredProjects.length})
                  </span>
                </div>

                <div className="flex items-center gap-[0.7vw]">
                  <div className="relative">
                    <img
                      src="/ProjectPages/search.webp"
                      alt=""
                      className="w-[1.1vw] h-[1.1vw] absolute left-[0.5vw] top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="Search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-[2vw] pr-[1vw] py-[0.23vw] rounded-full text-[0.8vw] bg-gray-200 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="relative" ref={filterRef}>
                    <button
                      onClick={() => setShowFilterDropdown((s) => !s)}
                      className={`rounded-full hover:bg-gray-100 flex items-center gap-2 text-[0.75vw] px-[0.6vw] py-[0.26vw] text-gray-700 cursor-pointer ${
                        hasActiveFilters
                          ? "bg-blue-100 border border-blue-300"
                          : "bg-gray-200"
                      }`}
                    >
                      <img
                        src="/ProjectPages/filter.webp"
                        alt=""
                        className="w-[1.1vw] h-[1.1vw]"
                      />
                      Filter
                      {hasActiveFilters && (
                        <span className="bg-blue-600 text-white text-[0.6vw] px-[0.4vw] py-[0.05vw] rounded-full flex justify-center items-center">
                          {(selectedPercentageRange ? 1 : 0) +
                            (selectedStatus ? 1 : 0) +
                            (selectedEmployee ? 1 : 0) +
                            (showYoursOnly &&
                            loggedEmpDetails.role !== "Super Admin"
                              ? 1
                              : 0)}
                        </span>
                      )}
                    </button>

                    {showFilterDropdown && (
                      <div className="absolute right-0 mt-[0.3vw] w-[14vw] bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                        <div className="p-[0.8vw]">
                          <div className="flex items-center justify-between mb-[0.8vw]">
                            <span className="font-semibold text-[0.85vw]">
                              Filters
                            </span>
                          </div>

                          {loggedEmpDetails.role === "Super Admin" && (
                            <div className="mb-[1vw]">
                              <label className="block text-[0.75vw] font-medium text-gray-700 mb-[0.3vw]">
                                Employee
                              </label>
                              <select
                                value={selectedEmployee}
                                onChange={(e) =>
                                  setSelectedEmployee(e.target.value)
                                }
                                className="w-full px-[0.5vw] py-[0.3vw] text-[0.75vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">All Employees</option>
                                {employeeList.map((emp) => (
                                  <option
                                    key={emp._id || emp.id}
                                    value={emp._id || emp.id}
                                  >
                                    {emp.employeeName ||
                                      emp.employee_name ||
                                      emp.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div className="mb-[1vw]">
                            <label className="block text-[0.75vw] font-medium text-gray-700 mb-[0.3vw]">
                              Progress Range
                            </label>
                            <select
                              value={selectedPercentageRange}
                              onChange={(e) =>
                                setSelectedPercentageRange(e.target.value)
                              }
                              className="w-full px-[0.5vw] py-[0.3vw] text-[0.75vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">All Ranges</option>
                              {percentageRanges.map((range) => (
                                <option key={range.label} value={range.label}>
                                  {range.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="mb-[0.75vw]">
                            <label className="block text-[0.75vw] font-medium text-gray-700 mb-[0.3vw]">
                              Status
                            </label>
                            <select
                              value={selectedStatus}
                              onChange={(e) =>
                                setSelectedStatus(e.target.value)
                              }
                              className="w-full px-[0.5vw] py-[0.3vw] text-[0.75vw] border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">All Status</option>
                              {statusOptions.map((status) => (
                                <option key={status.value} value={status.value}>
                                  {status.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {loggedEmpDetails.role !== "Employee" &&
                            loggedEmpDetails.role !== "Super Admin" && (
                              <div className="mb-[0.5vw] pt-[0.2vw] ml-[0.3vw] ">
                                <label className="flex items-center gap-[0.5vw] cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={showYoursOnly}
                                    onChange={(e) =>
                                      setShowYoursOnly(e.target.checked)
                                    }
                                    className="w-[1vw] h-[1vw] cursor-pointer accent-blue-600"
                                  />
                                  <span className="text-[0.75vw] font-medium text-gray-700">
                                    Your projects
                                  </span>
                                </label>
                              </div>
                            )}

                          {hasActiveFilters && (
                            <button
                              onClick={handleClearFilters}
                              className="w-full flex items-center justify-end text-[0.7vw] text-gray-900 cursor-pointer mt-[0.7vw] ml-[0.2vw]"
                            >
                              <img
                                src="/ProjectPages/overview/clear-filter.webp"
                                alt="filter"
                                className="w-auto h-[0.9vw] mr-[0.4vw]"
                              />
                              Clear All Filters
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0 h-[87%]">
                {loading ? (
                  <div className="flex items-center justify-center h-full min-h-[400px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : paginatedProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-500">
                    <svg
                      className="w-16 h-16 mb-4 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-lg font-medium mb-2">
                      No projects found
                    </p>
                    <p className="text-sm text-gray-400 mb-4">
                      {searchTerm || hasActiveFilters
                        ? "Try adjusting your search or filters"
                        : "Get started by creating your first project"}
                    </p>
                    {!searchTerm &&
                      !hasActiveFilters &&
                      loggedEmpDetails.role !== "Employee" && (
                        <button
                          onClick={() => {
                            navigate("newProject");
                          }}
                          className="px-[0.6vw] py-[0.3vw] bg-[#0064ff] text-white rounded-lg hover:bg-blue-700 text-[0.75vw] cursor-pointer"
                        >
                          + Add Project
                        </button>
                      )}
                  </div>
                ) : (
                  <div className="h-full mr-[0.8vw] mb-[0.8vw] ml-[0.8vw] border border-gray-300 rounded-xl overflow-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead className="bg-[#E2EBFF] sticky top-0">
                        <tr>
                          <th className="px-[0.7vw] py-[0.5vw] text-left text-[0.85vw] font-medium text-gray-800 border border-gray-300">
                            Project Name
                          </th>
                          <th className="px-[0.7vw] py-[0.5vw] text-left text-[0.85vw] font-medium text-gray-800 border border-gray-300">
                            Progress
                          </th>
                          <th className="px-[0.7vw] py-[0.5vw] text-left text-[0.85vw] font-medium text-gray-800 border border-gray-300">
                            Team Head
                          </th>
                          <th className="px-[0.7vw] py-[0.5vw] text-left text-[0.85vw] font-medium text-gray-800 border border-gray-300">
                            Start date
                          </th>
                          <th className="px-[0.7vw] py-[0.5vw] text-left text-[0.85vw] font-medium text-gray-800 border border-gray-300">
                            Deadline
                          </th>
                          <th className="px-[0.7vw] py-[0.5vw] text-left text-[0.85vw] font-medium text-gray-800 border border-gray-300">
                            Status
                          </th>
                          <th className="px-[0.7vw] py-[0.5vw] text-left text-[0.85vw] font-medium text-gray-800 border border-gray-300">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody ref={tableBodyRef}>
                        {paginatedProjects.map((project) => {
                          const status = getProjectStatus(project);
                          return (
                            <tr key={project._id} className="hover:bg-gray-50">
                              <td className="px-[0.7vw] py-[0.7vw] border border-gray-300">
                                <div className="flex items-center gap-[0.5vw]">
                                  {project.colorCode && (
                                    <div
                                      className="w-[2vw] h-[0.8vw] rounded-full flex-shrink-0"
                                      style={{
                                        backgroundColor: project.colorCode.code,
                                      }}
                                      title={project.colorCode.name}
                                    />
                                  )}
                                  <span className="font-medium text-[0.85vw]">
                                    {project.projectName} -{" "}
                                    <span className="text-gray-700 text-[0.8vw]">
                                      {project.companyName}
                                    </span>
                                  </span>
                                </div>
                              </td>
                              <td className="px-[0.7vw] py-[0.6vw] border border-gray-300">
                                <div className="flex items-center justify-center gap-[0.8vw]">
                                  <ProgressBar proj={project} />
                                  <span className="text-[0.75vw] text-gray-600">
                                    {project.percentage || 0}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-[0.7vw] py-[0.6vw] border border-gray-300 w-fit">
                                <div className="flex items-center gap-[0.8vw]">
                                  <div className="flex -space-x-2">
                                    {project.teamHead &&
                                    project.teamHead.length > 0 ? (
                                      project.teamHead
                                        .slice(0, 3)
                                        .map((th, idx) => (
                                          <div
                                            key={String(th.id) + idx}
                                            className="relative w-[1.8vw] h-[1.8vw] rounded-full bg-gray-200 border-2 border-white overflow-hidden"
                                            title={th.name || "Team Head"}
                                          >
                                            {th.profile ? (
                                              <img
                                                src={`${
                                                  import.meta.env
                                                    .VITE_API_BASE_URL1
                                                }${th.profile}`}
                                                alt={th.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                  e.target.style.display =
                                                    "none";
                                                }}
                                              />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center text-white font-medium bg-blue-500">
                                                {(th.name || "?")
                                                  .charAt(0)
                                                  .toUpperCase()}
                                              </div>
                                            )}
                                          </div>
                                        ))
                                    ) : (
                                      <div className="relative w-[1.8vw] h-[1.8vw] rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                                        <span className="text-[0.85vw] text-gray-600">
                                          —
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  <div>
                                    <div className="text-[0.8vw]">
                                      {project.teamHead &&
                                      project.teamHead.length > 0
                                        ? project.teamHead[0].name ||
                                          "Unassigned"
                                        : "Unassigned"}
                                    </div>
                                    <div className="text-[0.7vw] text-gray-500">
                                      {/* optional subtitle: show count of supporting persons */}
                                      {project.accessGrantedTo &&
                                      project.accessGrantedTo.length > 0
                                        ? `${project.accessGrantedTo.length} supporting`
                                        : ""}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="px-[0.7vw] py-[0.6vw] text-[0.8vw] text-gray-600 border border-gray-300">
                                {formatDate(project.startDate)}
                              </td>
                              <td className="px-[0.7vw] py-[0.6vw] text-[0.8vw] text-gray-600 border border-gray-300">
                                {formatDate(project.endDate)}
                              </td>
                              <td className="px-[0.7vw] py-[0.6vw] border border-gray-300 border-b-0 border-l-0 border-r-0 flex justify-center ">
                                <span
                                  className={`inline-block px-[0.2vw] py-[0.3vw] rounded-[0.5vw] min-w-[5.5vw] flex justify-center items-center text-center text-[0.7vw] font-medium ${
                                    status === "completed"
                                      ? "bg-[#22c55e] text-white"
                                      : status === "overdue"
                                      ? "bg-[#ef4444] text-white"
                                      : status === "delayed"
                                      ? "bg-[#eab308] text-white"
                                      : status === "inprogress"
                                      ? "bg-[#6366f1] text-white"
                                      : "bg-[#d1d5db] text-white"
                                  }`}
                                >
                                  {status === "completed"
                                    ? "Completed"
                                    : status === "overdue"
                                    ? "Overdue"
                                    : status === "delayed"
                                    ? "Delayed"
                                    : status === "inprogress"
                                    ? "In Progress"
                                    : "Not Started"}
                                </span>
                              </td>
                              <td className="px-[0.7vw] py-[0.85vw] border border-gray-300">
                                <div className="flex justify-center items-center gap-[0.5vw]">
                                  {loggedEmpDetails.role === "Admin" ||
                                  loggedEmpDetails.role === "Employee" ||
                                  String(project.employeeID) ===
                                    String(loggedEmpDetails.id) ||
                                  project.accessGrantedTo?.some(
                                    (access) =>
                                      String(access.employeeId) ===
                                      String(loggedEmpDetails.id)
                                  ) ? (
                                    <>
                                      {loggedEmpDetails.role !== "Employee" && (
                                        <button
                                          onClick={() =>
                                            handleEditProject(project)
                                          }
                                          className="px-[0.9vw] py-[0.18vw] flex items-center justify-center bg-blue-600 text-white rounded-full text-[0.65vw] hover:bg-blue-700 cursor-pointer"
                                        >
                                          Edit
                                        </button>
                                      )}

                                      <button
                                        onClick={() =>
                                          handleViewProject(project)
                                        }
                                        className="px-[0.7vw] flex items-center justify-center py-[0.18vw] bg-gray-800 text-white rounded-full text-[0.65vw] hover:bg-gray-900 cursor-pointer"
                                      >
                                        View
                                      </button>
                                    </>
                                  ) : (
                                    // Even if the user doesn't match, we still show the View button (because you wanted everything visible).
                                    <button
                                      onClick={() => handleViewProject(project)}
                                      className="px-[0.7vw] flex items-center justify-center py-[0.18vw] bg-gray-800 text-white rounded-full text-[0.65vw] hover:bg-gray-900 cursor-pointer"
                                    >
                                      View
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {!loading && paginatedProjects.length > 0 && (
                <div className="flex items-center justify-between p-[1.7vw] h-[5%] flex-shrink-0">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-[0.5vw] text-[0.9vw] ${
                      currentPage === 1
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-600 hover:text-gray-700 cursor-pointer"
                    }`}
                  >
                    ← <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {totalPages > 1 &&
                      getPageNumbers().map((page, index) =>
                        page === "..." ? (
                          <span
                            key={`ellipsis-${index}`}
                            className="text-[0.75vw] text-gray-600"
                          >
                            ...
                          </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => handlePageClick(page)}
                            className={`px-[0.4vw] py-[0.2vw] text-[0.7vw] rounded cursor-pointer ${
                              currentPage === page
                                ? "bg-blue-600 text-white"
                                : "text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            {String(page).padStart(2, "0")}
                          </button>
                        )
                      )}
                  </div>

                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-[0.5vw] text-[0.9vw] ${
                      currentPage === totalPages
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-600 hover:text-gray-700 cursor-pointer"
                    }`}
                  >
                    <span>Next</span> →
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <Outlet />
      )}
    </div>
  );
};

export default Projects;
