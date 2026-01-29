import React, { useMemo, useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const FILE_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --- HELPER: Format Currency ---
const formatCurrency = (amount) => {
  const abs = Math.abs(Number(amount) || 0);
  const formatted = abs.toLocaleString('en-IN');
  return `₹ ${amount < 0 ? '-' : ''}${formatted}`;
};

// --- HELPER: Format Date ---
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-GB').replace(/\//g, '-'); 
};

// --- HELPER: Download File (Force Save) ---
const handleFileDownload = async (path, filename) => {
  if (!path) return;
  const fullUrl = `${FILE_BASE_URL}${path}`;
  
  try {
    const response = await fetch(fullUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || 'document');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url); 
  } catch (error) {
    console.error("Download failed, opening in new tab", error);
    window.open(fullUrl, '_blank'); 
  }
};

// --- HELPER: Export Table to CSV ---
const downloadTableCSV = (data, projectName) => {
  if (!data || Object.keys(data).length === 0) return;

  const headers = ['No,Cost Category,Cost Item,Amount'];
  const rows = [];
  let counter = 1;

  Object.keys(data).forEach(category => {
    data[category].forEach(item => {
      const safeCat = `"${category || ''}"`;
      const safeItem = `"${item.item || ''}"`;
      const amount = item.amount || 0;
      rows.push(`${counter++},${safeCat},${safeItem},${amount}`);
    });
  });

  const csvContent = [headers.join('\n'), rows.join('\n')].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${projectName.replace(/\s+/g, '_')}_Budget_Report.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- SUB-COMPONENT: Project Detail View ---
const ProjectDetailView = ({ project, onBack }) => {
  
  const groupedCosts = useMemo(() => {
    const groups = {};
    if (project.costItems) {
      project.costItems.forEach(item => {
        if (!groups[item.category]) groups[item.category] = [];
        groups[item.category].push(item);
      });
    }
    return groups;
  }, [project.costItems]);

  const getCategoryTotal = (items) => items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  const roiPeriod = project.roiDetails?.roiPeriod || "N/A"; 
  const roiPerMonth = project.budget > 0 ? (project.profit / (parseInt(roiPeriod) || 1)) : 0;

  // Document Logic
  const invoiceDoc = useMemo(() => {
    const doc = project.documents?.invoice?.finalized;
    return (doc && doc.path) ? doc : null;
  }, [project.documents]);

  const otherDocs = useMemo(() => {
    const docs = [];
    const po = project.documents?.po?.finalized;
    if (po && po.path) docs.push({ ...po, docType: 'Purchase Order' });
    const qa = project.documents?.quotation?.finalized;
    if (qa && qa.path) docs.push({ ...qa, docType: 'Quotation' });
    return docs;
  }, [project.documents]);

  return (
    <div className="flex flex-col h-full w-full">
      
      {/* --- FIXED HEADER --- */}

      {/* --- FIXED HEADER WITH BREADCRUMBS --- */}

<div className="flex-none flex items-center justify-between border-b border-gray-200/50 mb-2 pb-[1vh]">
  
  {/* Left: Breadcrumbs */}

  <div className="flex items-center text-[0.85vw]">
    <button 
      onClick={onBack}
      className="text-blue-700 hover:text-blue-800 font-medium transition cursor-pointer"
    >
      Budgets
    </button>
    
    <span className="mx-[0.25vw] text-gray-400 font-normal">/</span>
    
    <span className="text-gray-800 font-semibold">
      {project.name}
    </span>
    
    <span className="text-gray-600 font-normal ml-[0.5vw]">
      ({project.client})
    </span>
  </div>

  {/* Right: Download CSV Button */}

  <button 
     onClick={() => downloadTableCSV(groupedCosts, project.name)}
     className="bg-green-600 hover:bg-green-700 text-white rounded-full py-[0.8vh] px-[1.5vw] text-[0.85vw] transition flex items-center gap-2 shadow-sm cursor-pointer"
  >
     <svg className="w-[1vw] h-[1vw]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
     </svg>

     <span>Download CSV</span>
  </button>
</div>


      {/* --- SCROLLABLE CONTENT --- */}

      <div className="flex-1 overflow-y-auto pb-[2vh]">

        {/* Top Cards */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-[1vw] mb-[2.5vh] mt-[1.5vh]">
          <div className="bg-white rounded-xl shadow-sm flex flex-col justify-center py-[1.5vh] px-[1vw]">
            <div className="font-bold text-[1.25vw] text-gray-800">{formatCurrency(project.budget)}</div>

            <div className="text-gray-500 text-[0.75vw] mt-[0.5vh]">Target Budget</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm flex flex-col justify-center py-[1.5vh] px-[1vw]">
            <div className="font-bold text-cyan-500 text-[1.25vw]">{formatCurrency(project.planned_cost)}</div>

            <div className="text-gray-500 text-[0.75vw] mt-[0.5vh]">Total Planned Cost</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm flex flex-col justify-center py-[1.5vh] px-[1vw]">
            <div className="font-bold text-[#9B59B6] text-[1.25vw]">{formatCurrency(project.actual_cost)}</div>

            <div className="text-gray-500 text-[0.75vw] mt-[0.5vh]">Total Actual Cost</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm flex flex-col justify-center py-[1.5vh] px-[1vw]">
            <div className={`font-bold text-[1.25vw] ${project.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {project.profit >= 0 ? '+' : ''}

{formatCurrency(project.profit)}
            </div>

            <div className="text-gray-500 text-[0.75vw] mt-[0.5vh]">Profit / Loss</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm flex flex-col justify-center py-[1.5vh] px-[1vw]">
            <div className={`font-bold text-[1.25vw] text-black`}>
              {formatCurrency(project.remaining_budget)}
            </div>

            <div className="text-gray-500 text-[0.75vw] mt-[0.5vh]">Remaining Budget</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm flex flex-col justify-center py-[1.5vh] px-[1vw]">
            <div className="font-bold text-blue-600 text-[1.25vw]">
              {roiPeriod} 

<span className="text-gray-400 font-normal text-[0.9vw]">Months</span>
            </div>

            <div className="text-gray-500 text-[0.75vw] mt-[0.5vh]">Expected ROI Period</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm flex flex-col justify-center py-[1.5vh] px-[1vw]">
            <div className="font-bold text-orange-400 text-[1.25vw]">{formatCurrency(roiPerMonth)}</div>

            <div className="text-gray-500 text-[0.75vw] mt-[0.5vh]">ROI / Month</div>
          </div>
        </div>

        {/* Cost Table */}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-[2.5vh] overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-blue-50 text-gray-700 font-medium">
                <tr>
                  <th className="border-b border-gray-200 py-[1.5vh] px-[1vw] text-[0.85vw] w-[4vw]">No</th>

                  <th className="border-b border-gray-200 py-[1.5vh] px-[1vw] text-[0.85vw] w-1/4">Cost Category</th>

                  <th className="border-b border-gray-200 py-[1.5vh] px-[1vw] text-[0.85vw] w-1/3">Cost Item</th>

                  <th className="border-b border-gray-200 text-right py-[1.5vh] px-[1vw] text-[0.85vw]">Amount</th>

                  <th className="border-b border-gray-200 text-right bg-blue-100/50 py-[1.5vh] px-[1vw] text-[0.85vw]">Total</th>
                </tr>
              </thead>

              <tbody className="text-gray-600">
                {Object.keys(groupedCosts).length === 0 ? (
                  <tr><td colSpan="5" className="text-center text-gray-400 py-[3vh] px-[1vw] text-[0.85vw]">No cost items found</td></tr>
                ) : (
                  Object.keys(groupedCosts).map((category, catIndex) => {
                    const items = groupedCosts[category];
                    const catTotal = getCategoryTotal(items);
                    return items.map((item, itemIndex) => (
                      <tr key={`${catIndex}-${itemIndex}`} className="border-b border-gray-100 hover:bg-gray-50">
                        {itemIndex === 0 && (
                          <>
                            <td className="align-top border-r border-gray-100 py-[1.5vh] px-[1vw] text-[0.8vw]" rowSpan={items.length}>{catIndex + 1}</td>

                            <td className="align-top font-medium text-gray-800 border-r border-gray-100 py-[1.5vh] px-[1vw] text-[0.8vw]" rowSpan={items.length}>{category || 'Uncategorized'}</td>
                          </>
                        )}

                        <td className="border-r border-gray-100 py-[1.5vh] px-[1vw] text-[0.8vw]">{item.item || 'Unknown Item'}</td>

                        <td className="text-right font-medium border-r border-gray-100 py-[1.5vh] px-[1vw] text-[0.8vw]">{formatCurrency(item.amount)}</td>

                        {itemIndex === 0 && (
                          <td className="text-right font-bold text-gray-800 align-middle bg-gray-50/30 py-[1.5vh] px-[1vw] text-[0.8vw]" rowSpan={items.length}>{formatCurrency(catTotal)}</td>
                        )}
                      </tr>
                    ));
                  })
                )}
              </tbody>

              <tfoot className="bg-white">
                <tr>
                  <td colSpan="4" className="text-right text-gray-500 font-medium py-[1.5vh] px-[1vw] text-[0.9vw]">Total Cost</td>

                  <td className="text-right py-[1.5vh] px-[.65vw]">
                    <div className="border border-gray-300 rounded font-bold text-gray-800 inline-block py-[0.5vh] px-[0.8vw] text-[0.9vw]">
                      {formatCurrency(project.billing)}
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Documents Section */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[2vw]">
          
          {/* Invoices (Finalized) */}

          <div className="bg-blue-50 rounded-xl h-fit py-[2vh] px-[1.5vw]">
            <div className="flex items-center mb-[1.5vh]">
                <span className="mr-[0.5vw] text-[1.2vw]">📂</span>

                <h3 className="font-semibold text-gray-800 text-[1vw]">Invoices (Finalized)</h3>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {invoiceDoc ? (
                  <div className="flex items-center justify-between border-b border-gray-100 last:border-0 py-[1.5vh] px-[1.5vw] hover:bg-gray-50">
                      <span className="text-gray-700 font-medium text-[0.85vw] w-[40%] truncate" title={invoiceDoc.filename}>{invoiceDoc.filename || 'Final Invoice'}</span>

                      <span className="text-gray-500 text-[0.85vw] w-[30%] text-center">{formatDate(invoiceDoc.finalizedAt)}</span>

                      <div className="w-[30%] flex justify-end">
                        <button 
                          onClick={() => handleFileDownload(invoiceDoc.path, invoiceDoc.filename)}
                          className="bg-[#2d333b] text-white rounded-full py-[0.6vh] px-[1.5vw] text-[0.75vw] hover:bg-black transition flex items-center gap-2"
                        >
                          <span>Download</span>
                        </button>
                      </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-[2vh] px-[1vw] text-[0.9vw]">No finalized invoices</div>
                )}
            </div>
          </div>

          {/* Others (Finalized) */}

          <div className="bg-blue-50 rounded-xl h-fit py-[2vh] px-[1.5vw]">
            <div className="flex items-center mb-[1.5vh]">
                <span className="mr-[0.5vw] text-[1.2vw]">📁</span>

                <h3 className="font-semibold text-gray-800 text-[1vw]">Others (Finalized)</h3>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {otherDocs.length > 0 ? (
                   otherDocs.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-gray-100 last:border-0 py-[1.5vh] px-[1.5vw] hover:bg-gray-50">
                        <div className="flex flex-col w-[40%] truncate">
                           <span className="text-gray-700 font-medium text-[0.85vw] truncate" title={doc.filename}>{doc.docType}</span>

                           <span className="text-gray-400 text-[0.75vw] truncate">{doc.filename || 'Document'}</span>
                        </div>

                        <span className="text-gray-500 text-[0.85vw] w-[30%] text-center">{formatDate(doc.finalizedAt)}</span>

                        <div className="w-[30%] flex justify-end">
                          <button 
                             onClick={() => handleFileDownload(doc.path, doc.filename)}
                             className="bg-[#2d333b] text-white rounded-full py-[0.6vh] px-[1.5vw] text-[0.75vw] hover:bg-black transition flex items-center gap-2"
                          >
                             <span>Download</span>
                          </button>
                        </div>
                    </div>
                   ))
                ) : (
                    <div className="text-center text-gray-400 py-[2vh] px-[1vw] text-[0.85vw]">No other finalized documents</div>
                )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function Budgets() {
  const [currentPage, setCurrentPage] = useState(1);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); 
  const itemsPerPage = 8;

  useEffect(() => {
    fetchBudgetData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const fetchBudgetData = async () => {
    try {
      setLoading(true);
      setError(null);

      const projectsResponse = await fetch(`${API_BASE_URL}/projects`);
      if (!projectsResponse.ok) throw new Error('Failed to fetch projects list');
      const projectsResponseData = await projectsResponse.json();
      
      let projectsList = [];
      if (projectsResponseData.data && Array.isArray(projectsResponseData.data)) {
        projectsList = projectsResponseData.data;
      } else if (Array.isArray(projectsResponseData)) {
        projectsList = projectsResponseData;
      } else {
        projectsList = [projectsResponseData];
      }

      const processedData = await Promise.all(
        projectsList.map(async (project) => {
          try {
            const projectId = project._id;
            const clientId = project.clientId;

            if (!projectId || !clientId) return null;

            const [clientRes, billingRes, roiRes] = await Promise.all([
              fetch(`${API_BASE_URL}/notification/client/${clientId}`),
              fetch(`${API_BASE_URL}/client_Budgetary/client/${clientId}`),
              fetch(`${API_BASE_URL}/ReturnInvestment/${projectId}`)
            ]);

            let clientName = 'Unknown Project';
            let companyName = 'Unknown Client';
            if (clientRes.ok) {
              const clientData = await clientRes.json();
              const actualClientData = clientData.data || clientData; 
              clientName = actualClientData.projectName || 'N/A';
              companyName = actualClientData.companyName || 'N/A';
            }

            let billing = 0;
            let rawCostItems = [];
            let rawDocuments = {};

            if (billingRes.ok) {
              const billingData = await billingRes.json();
              const billingPayload = billingData.data || billingData;
              
              // Get Documents (Capital D)
              rawDocuments = billingPayload.Documents || {};

              // Get Cost Entries (Capital C)
              const costData = billingPayload.CostEntries;
              if (costData?.finalized?.items && Array.isArray(costData.finalized.items)) {
                rawCostItems = costData.finalized.items;
                billing = rawCostItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
              }
            }

            let budget = 0;
            let roiDetails = {};
            let plannedCost = 0;
            let actualCost = 0;

            if (roiRes.ok) {
              const roiData = await roiRes.json();
              const roiPayload = roiData.data || roiData;
              const roiObj = Array.isArray(roiPayload) ? roiPayload[0] : roiPayload;
              
              if (roiObj?.ReturnOfInvestment?.finalized?.totalBudget) {
                budget = parseFloat(roiObj.ReturnOfInvestment.finalized.totalBudget || 0);
                roiDetails = roiObj.ReturnOfInvestment.finalized;
              }
                plannedCost = parseFloat(roiData.data?.totalTaskActivityBudget || 0);
              actualCost = parseFloat(roiData.data?.totalReportedBudget || 0);

            }
            

            if (budget === 0 && billing === 0) return null;

            const profit = plannedCost - actualCost;
            const remaining_budget = budget - plannedCost;

            return {
              id: projectId,
              name: clientName,
              client: companyName,
              budget: budget,
              planned_cost: plannedCost,
              actual_cost: actualCost,
              billing: billing,
              profit: profit,
              remaining_budget: remaining_budget,
              costItems: rawCostItems,
              documents: rawDocuments,
              roiDetails: roiDetails,
              projectId: projectId,
              clientId: clientId
            };

          } catch (err) {
            console.error(`Error processing project ${project._id}:`, err);
            return null;
          }
        })
      );

      setProjects(processedData.filter(p => p !== null));
      
    } catch (err) {
      console.error('Fatal error:', err);
      setError('Failed to load budget data.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
      let matchesFilter = true;
      if (filterStatus === 'Profit') matchesFilter = project.profit >= 0;
      else if (filterStatus === 'Loss') matchesFilter = project.profit < 0;
      return matchesSearch && matchesFilter;
    });
  }, [projects, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    if (projects.length === 0) return { 
      totalProjects: 0, 
      totalBudget: 0, 
      totalPlannedCost: 0,    // NEW
      totalActualCost: 0,      // NEW
      totalProfit: 0, 
      avgMargin: 0, 
      withinBudget: 0, 
      overBudget: 0 
    };
    
    const totalProjects = projects.length;
    const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
    const totalBilling = projects.reduce((sum, p) => sum + p.billing, 0);
    
    // NEW: Calculate total planned cost and actual cost
    const totalPlannedCost = projects.reduce((sum, p) => sum + (p.planned_cost || 0), 0);
    const totalActualCost = projects.reduce((sum, p) => sum + (p.actual_cost || 0), 0);
    
    const totalProfit = projects.reduce((sum, p) => sum + p.profit, 0);
    
    // NEW: Calculate average profit margin using planned vs actual
    const avgMargin = totalPlannedCost > 0 ? (((totalPlannedCost - totalActualCost) / totalPlannedCost) * 100).toFixed(2) : 0;
    
    const withinBudget = projects.filter(p => p.billing <= p.budget).length;
    const overBudget = projects.filter(p => p.billing > p.budget).length;

    return { 
      totalProjects, 
      totalBudget, 
      totalPlannedCost,    // NEW
      totalActualCost,     // NEW
      totalProfit, 
      avgMargin: parseFloat(avgMargin), 
      withinBudget, 
      overBudget 
    };
  }, [projects]);


  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProjects = filteredProjects.slice(startIndex, endIndex);

  const paginationRange = useMemo(() => {
    if (totalPages === 0) return [];
    const delta = 2;
    const range = [];
    let l;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) range.push(i);
    }
    const rangeWithDots = [];
    range.forEach((i) => {
      if (l) {
        if (i - l === 2) rangeWithDots.push(l + 1);
        else if (i - l !== 1) rangeWithDots.push('...');
      }
      rangeWithDots.push(i);
      l = i;
    });
    return rangeWithDots;
  }, [currentPage, totalPages]);

  if (selectedProject) {
    return (
        <div className="h-full overflow-hidden">
            <ProjectDetailView project={selectedProject} onBack={() => setSelectedProject(null)} />
        </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>

          <p className="mt-4 text-gray-600">Loading budget data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>

          <button onClick={fetchBudgetData} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="text-gray-800 text-[.85vw] mb-[.75vw]"><strong className='text-blue-800'>Note: </strong> Only projects with finalised budgets are shown here.</div>

      {/* Stats Grid */}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-[0.7vw] mb-[2vh]">
        <div className="bg-white rounded-lg shadow-sm flex flex-col py-[1.5vh] px-[1vw]">
          <div className="font-semibold text-gray-800 text-[1.2vw] ">{stats.totalProjects}</div>

          <div className="text-gray-500 text-[0.8vw] mt-[0.3vw]">Total Projects</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm flex flex-col py-[1.5vh] px-[1vw] items-end">
          <div className="font-semibold text-cyan-600 text-[1.2vw] ">{formatCurrency(stats.totalBudget)}</div>

          <div className="text-gray-500 text-[0.8vw] mt-[0.3vw]">Initially Planned Budget</div>
        </div>
       
          <div className="bg-white rounded-lg shadow-sm flex flex-col py-[1.5vh] px-[1vw] items-end">
          <div className="font-semibold text-blue-600 text-[1.2vw] ">{formatCurrency(stats.totalPlannedCost)}</div>

          <div className="text-gray-500 text-[0.8vw] mt-[0.3vw]">Total Planned Cost</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm flex flex-col py-[1.5vh] px-[1vw] items-end">
          <div className="font-semibold text-orange-500 text-[1.2vw] ">{formatCurrency(stats.totalActualCost)}</div>

          <div className="text-gray-500 text-[0.8vw] mt-[0.3vw]">Total Actual Cost</div>
        </div>

       <div className="bg-white rounded-lg shadow-sm flex flex-col py-[1.5vh] px-[1vw] items-end">
          <div className={`font-semibold text-[1.2vw]  ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.totalProfit >= 0 ? `+ ${formatCurrency(stats.totalProfit)}` : formatCurrency(stats.totalProfit)}
          </div>

          <div className="text-gray-500 text-[0.8vw] mt-[0.3vw]">Total Profit / Loss</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm flex flex-col py-[1.5vh] px-[1vw] items-end">
          <div className="font-semibold text-gray-800 text-[1.2vw] ">{stats.avgMargin}%</div>

          <div className="text-gray-500 text-[0.8vw] mt-[0.3vw]">Avg. Profit Margin</div>
        </div>
      </section>

      {/* Table */}

      <main className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-[1vh]">
          <div className="flex items-center gap-[1vw]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 bg-white rounded-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent py-[0.8vh] pr-[0.8vw] pl-[2.2vw] text-[0.85vw] w-[15vw]"
              />

              <svg className="absolute text-gray-400 w-[1vw] h-[1vw] left-[0.7vw] top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-full text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 py-[0.8vh] px-[1vw] text-[0.85vw] cursor-pointer"
            >
              <option value="All">All Status</option>

              <option value="Profit">Profit Only</option>

              <option value="Loss">Loss Only</option>
            </select>
          </div>
        </div>

        <div className='overflow-hidden rounded-xl border border-gray-200 shadow'>

        <div className="relative min-h-[54vh] max-h-[54vh]  bg-white flex flex-col">
          <div className="w-full overflow-x-auto">
            <table className="w-full table-fixed text-gray-800 text-[0.9vw]">
              <thead className="bg-blue-50 text-gray-800">
                <tr>
                  <th className="text-left font-medium w-2/7 py-[1.35vh] px-[1vw]">Project Name</th>

                  <th className="text-left font-medium w-1/7 py-[1.35vh] px-[1vw]">Client</th>

                  <th className="text-right font-medium w-1/7 py-[1.35vh] px-[1vw]">Total Budget</th>

                  <th className="text-right font-medium w-1/7 py-[1.35vh] px-[1vw]">Planned Cost</th>

                  <th className="text-right font-medium w-1/7 py-[1.35vh] px-[1vw]">Actual Cost</th>

                  <th className="text-right font-medium w-1/7 py-[1.35vh] px-[1vw]">Profit/Loss</th>

                  <th className="text-center font-medium w-1/7 py-[1.35vh] px-[1vw]">Action</th>
                </tr>
              </thead>
            </table>
          </div>

          <div className="overflow-y-auto max-h-[48vh]">
            <table className="w-full table-fixed text-gray-700 text-[0.8vw]">
              <tbody>
                {currentProjects.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-8 text-gray-500">No projects found matching your filters</td></tr>
                ) : (
                  currentProjects.map((project, index) => {
                    const isProfit = project.profit >= 0;
                    const globalIndex = startIndex + index;
                    return (
                      <tr key={project.id} className={globalIndex % 2 === 0 ? 'bg-gray-50' : 'bg-gray-100'}>
                        <td className="text-left font-normal w-2/7 py-[1.35vh] px-[1vw]">{project.name}</td>

                        <td className="text-left font-normal w-1/7 py-[1.35vh] px-[1vw]">{project.client}</td>

                        <td className="text-right font-normal w-1/7 py-[1.35vh] px-[1vw]">{formatCurrency(project.budget)}</td>

                        <td className="text-right font-normal w-1/7 py-[1.35vh] px-[1vw]">{formatCurrency(project.planned_cost)}</td>

                        <td className="text-right font-normal w-1/7 py-[1.35vh] px-[1vw]">{formatCurrency(project.actual_cost)}</td>

                        <td className="text-right font-normal w-1/7 py-[1.35vh] px-[1vw]">
                          <div className="flex items-center justify-end gap-[0.5vw]">
                            <span className={`font-normal ${isProfit ? 'text-green-600' : 'text-red-600'}`}>{isProfit ? '+' : ''}

{formatCurrency(project.profit)}</span>
                          </div>
                        </td>

                        <td className="text-center w-1/7 py-[1.35vh] px-[1vw]">
                          <button 
                            onClick={() => setSelectedProject(project)}
                            className="bg-gray-800 text-white rounded-full cursor-pointer font-medium hover:bg-gray-700 py-[0.3vh] px-[0.9vw] w-fit text-[0.8vw]" 
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>

        <div className="relative bottom-0 flex items-center justify-between bg-white pb-[1.5vh] pt-[0.25vw] px-[1.5vw]">
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className={`flex items-center text-gray-600 hover:text-gray-800 disabled:opacity-50 gap-[0.5vw] text-[0.8vw] ${currentPage == 1 ? 'cursor-default' : 'cursor-pointer'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-left w-[1vw] h-[1vw]" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg> Previous
            </button>

          <nav className="flex items-center gap-[0.5vw]">
            {paginationRange.map((item, idx) => (
              <React.Fragment key={idx}>
                {item === '...' ? <span className="text-gray-400">…</span> : 
                  <button onClick={() => setCurrentPage(item)} className={`rounded-[0.3vw] font-medium w-[2.5vw] h-[2vw] cursor-pointer text-[0.85vw] ${item === currentPage ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>{String(item).padStart(2, '0')}</button>
                }
              </React.Fragment>
            ))}
          </nav>

          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="flex items-center text-gray-700 hover:text-gray-900 disabled:opacity-50 gap-[0.5vw] text-[0.8vw] cursor-pointer"> Next <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right w-[1vw] h-[1vw]" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg></button>
        </div>
        </div>
      </main>
    </div>
  );
}