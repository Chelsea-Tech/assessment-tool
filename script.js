// Updated script.js for Azure Static Web App
// API Configuration for Static Web App
const API_BASE_URL = window.location.origin; // Use same domain as frontend
const API_ENDPOINTS = {
    getAssessment: (clientId) => `${API_BASE_URL}/api/clients/${clientId}/assessment`,
    saveAssessment: (clientId) => `${API_BASE_URL}/api/clients/${clientId}/assessment`,
    updatePolicy: (clientId, policyId) => `${API_BASE_URL}/api/clients/${clientId}/policies/${policyId}`,
    getStats: (clientId) => `${API_BASE_URL}/api/clients/${clientId}/stats`,
    getAllClients: () => `${API_BASE_URL}/api/admin/clients`,
    getClientsList: () => `${API_BASE_URL}/api/clients-list`
};

// Global variables
let assessmentData = {};
let currentClientId = null;
let currentRole = 'engineer';
let isLoading = false;
let saveTimeout = null;

// Get client ID from URL path or query parameter
function getClientId() {
    // Check URL path first: /clients/client-name
    const pathParts = window.location.pathname.split('/');
    if (pathParts[1] === 'clients' && pathParts[2]) {
        return pathParts[2];
    }
    
    // Fallback to query parameter: ?client=client-name
    const urlParams = new URLSearchParams(window.location.search);
    let clientId = urlParams.get('client');
    
    if (!clientId) {
        // Redirect to homepage if no client specified
        window.location.href = '/';
        return null;
    }
    
    return clientId;
}

// API Helper Functions
async function apiRequest(url, options = {}) {
    try {
        showLoadingSpinner();
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        const response = await fetch(url, { ...defaultOptions, ...options });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Network error' }));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Request failed:', error);
        showErrorMessage(`Error: ${error.message}`);
        throw error;
    } finally {
        hideLoadingSpinner();
    }
}

// Load assessment data from backend
async function loadAssessmentData() {
    try {
        const data = await apiRequest(API_ENDPOINTS.getAssessment(currentClientId));
        assessmentData = data.assessmentData || {};
        
        console.log(`Loaded assessment data for client: ${currentClientId}`);
        return data;
    } catch (error) {
        console.error('Failed to load assessment data:', error);
        showErrorMessage('Failed to load assessment data. Please refresh the page.');
        return null;
    }
}

// Save assessment data to backend
async function saveAssessmentData() {
    if (isLoading) return;
    
    try {
        await apiRequest(API_ENDPOINTS.saveAssessment(currentClientId), {
            method: 'POST',
            body: JSON.stringify({ assessmentData })
        });
        
        showSuccessMessage('Assessment saved successfully');
        console.log('Assessment saved to backend');
    } catch (error) {
        console.error('Failed to save assessment:', error);
        showErrorMessage('Failed to save assessment. Your changes may be lost.');
    }
}

// Update specific policy in backend
async function updatePolicyInBackend(policyId, policyData) {
    try {
        await apiRequest(API_ENDPOINTS.updatePolicy(currentClientId, policyId), {
            method: 'PUT',
            body: JSON.stringify(policyData)
        });
    } catch (error) {
        console.error('Failed to update policy:', error);
        showErrorMessage('Failed to save policy changes');
    }
}

// Enhanced date formatting functions
function formatDateForDisplay(dateString) {
    if (!dateString) return 'Not scheduled';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid date';
        
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return 'Invalid date';
    }
}

function formatDateForInput(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        // Return in YYYY-MM-DD format for HTML date input
        return date.toISOString().split('T')[0];
    } catch (error) {
        return '';
    }
}

function validateDate(dateString) {
    if (!dateString) return true; // Empty dates are OK
    
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && date.getFullYear() >= 2024 && date.getFullYear() <= 2030;
}

// Debounced save function
function debouncedSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveAssessmentData, 2000); // Save after 2 seconds of inactivity
}

// UI Helper Functions
function showLoadingSpinner() {
    let spinner = document.getElementById('loadingSpinner');
    if (!spinner) {
        spinner = document.createElement('div');
        spinner.id = 'loadingSpinner';
        spinner.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; padding: 2rem; border-radius: 8px; text-align: center;">
                    <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #1e3c72; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                    <div>Loading...</div>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(spinner);
    }
    spinner.style.display = 'block';
    isLoading = true;
}

function hideLoadingSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = 'none';
    }
    isLoading = false;
}

function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease-out;
    `;
    
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        info: '#007bff',
        warning: '#ffc107'
    };
    
    messageDiv.style.background = colors[type] || colors.info;
    messageDiv.textContent = message;
    
    // Add animation keyframes
    if (!document.getElementById('messageAnimations')) {
        const style = document.createElement('style');
        style.id = 'messageAnimations';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(messageDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    }, 5000);
}

function showSuccessMessage(message) {
    showMessage(message, 'success');
}

function showErrorMessage(message) {
    showMessage(message, 'error');
}

function showWarningMessage(message) {
    showMessage(message, 'warning');
}

// Update page branding with client name
function updateClientBranding() {
    if (!currentClientId) return;
    
    const clientName = currentClientId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    document.title = `Microsoft Best Practices Assessment - ${clientName}`;
    
    const headerElement = document.querySelector('.header p');
    if (headerElement) {
        headerElement.textContent = `${clientName} - Complete Security Policy Management (149 Policies)`;
    }
    
    // Update browser URL to use clean path
    const newPath = `/clients/${currentClientId}`;
    if (window.location.pathname !== newPath) {
        window.history.replaceState({}, '', newPath);
    }
}

// Utility functions
function getImpactLevel(userImpact) {
    if (!userImpact) return 'unknown';
    
    const impact = userImpact.toLowerCase();
    const lowKeywords = ['minimal', 'low', 'little', 'slight', 'minor', 'no direct', 'unlikely to experience'];
    const mediumKeywords = ['medium', 'moderate', 'some', 'intermittent', 'moderately'];
    const highKeywords = ['high', 'significant', 'major', 'frequent', 'disruption', 'inconvenience', 'locked out'];
    
    for (const keyword of highKeywords) {
        if (impact.includes(keyword)) return 'high';
    }
    
    for (const keyword of mediumKeywords) {
        if (impact.includes(keyword)) return 'medium';
    }
    
    for (const keyword of lowKeywords) {
        if (impact.includes(keyword)) return 'low';
    }
    
    return 'unknown';
}

function findPolicyById(policyId) {
    for (const category of Object.keys(assessmentData)) {
        const policy = assessmentData[category].find(p => p.id === policyId);
        if (policy) return policy;
    }
    return null;
}

// Role management
function setRole(role) {
    currentRole = role;
    document.body.className = `role-${role}`;
    
    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Rendering functions
function renderAssessment() {
    const container = document.getElementById('assessmentContent');
    if (!container) return;
    
    container.innerHTML = '';

    Object.keys(assessmentData).forEach(categoryName => {
        const policies = assessmentData[categoryName];
        if (!policies || policies.length === 0) return;

        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category-section';
        categoryDiv.innerHTML = `
            <div class="category-header" onclick="toggleCategory(this)">
                <span>${categoryName} (${policies.length} policies)</span>
                <span class="chevron">▼</span>
            </div>
            <div class="category-items">
                ${policies.map(policy => createPolicyHTML(policy)).join('')}
            </div>
        `;

        container.appendChild(categoryDiv);
    });
}

function createPolicyHTML(policy) {
    const statusClass = policy.status ? 
        (policy.status.includes('Compliant') && !policy.status.includes('Not') ? 'Compliant' : 
         policy.status.includes('Partially') ? 'Partially' : 
         policy.status.includes('Not') ? 'Not' : 'pending') : 'pending';

    const impactLevel = getImpactLevel(policy.userImpact);
    const techOwnerDisplay = policy.tech || 'Not assigned';
    const rolloutDateDisplay = formatDateForDisplay(policy.rolloutDate);
    
    // Calculate days until rollout
    let rolloutInfo = rolloutDateDisplay;
    if (policy.rolloutDate) {
        const rolloutDate = new Date(policy.rolloutDate);
        const today = new Date();
        const diffTime = rolloutDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0) {
            rolloutInfo += ` (${diffDays} days from now)`;
        } else if (diffDays === 0) {
            rolloutInfo += ' (Today!)';
        } else {
            rolloutInfo += ` (${Math.abs(diffDays)} days overdue)`;
        }
    }

    return `
        <div class="policy-item impact-${impactLevel}" data-policy-id="${policy.id}" data-impact="${impactLevel}" data-tech="${policy.tech || ''}" data-rollout="${policy.rolloutDate || ''}">
            <div class="policy-header">
                <div class="policy-title">
                    <span class="impact-indicator impact-${impactLevel}"></span>
                    ${policy.name}
                    ${policy.status ? `<span class="current-status ${statusClass}">${policy.status}</span>` : '<span class="current-status pending">Pending Review</span>'}
                    ${policy.rolloutDate && new Date(policy.rolloutDate) < new Date() ? '<span class="overdue-indicator" style="color: #dc3545; font-weight: bold; margin-left: 0.5rem;">⚠️ OVERDUE</span>' : ''}
                </div>
                <div class="policy-controls">
                    <div class="status-selector engineer-only">
                        <button class="status-btn compliant ${policy.status === 'Compliant' ? 'active' : ''}" 
                                onclick="updateStatus('${policy.id}', 'Compliant')" title="Mark as Compliant">✓</button>
                        <button class="status-btn partial ${policy.status === 'Partially Compliant' ? 'active' : ''}" 
                                onclick="updateStatus('${policy.id}', 'Partially Compliant')" title="Mark as Partially Compliant">~</button>
                        <button class="status-btn non-compliant ${policy.status === 'Not-Compliant' ? 'active' : ''}" 
                                onclick="updateStatus('${policy.id}', 'Not-Compliant')" title="Mark as Not Compliant">✗</button>
                    </div>
                    <div class="enhanced-controls engineer-only">
                        <button class="control-btn ${policy.tech ? 'assigned' : ''}" 
                                onclick="openTechModal('${policy.id}')" title="Assign Technical Owner">
                            👤 ${policy.tech ? policy.tech : 'Assign Tech'}
                        </button>
                        <button class="control-btn ${policy.rolloutDate ? 'scheduled' : ''}" 
                                onclick="openDatePicker('${policy.id}')" title="Set Rollout Date">
                            📅 ${rolloutDateDisplay}
                        </button>
                    </div>
                    <div class="approval-controls client-only">
                        <button class="approval-btn approve ${policy.clientApproval === 'approved' ? 'active' : ''}" 
                                onclick="updateApproval('${policy.id}', 'approved')">Approve</button>
                        <button class="approval-btn deny ${policy.clientApproval === 'denied' ? 'active' : ''}" 
                                onclick="updateApproval('${policy.id}', 'denied')">Deny</button>
                    </div>
                </div>
            </div>
            <div class="policy-details">
                <div class="detail-section">
                    <div class="detail-title">Description</div>
                    <div class="detail-content">${policy.description || 'No description available'}</div>
                </div>
                <div class="detail-section">
                    <div class="detail-title">User Impact (${impactLevel.toUpperCase()})</div>
                    <div class="detail-content">${policy.userImpact || 'No impact assessment available'}</div>
                </div>
                <div class="detail-section">
                    <div class="detail-title">Technical Owner</div>
                    <div class="detail-content">${techOwnerDisplay}</div>
                </div>
                <div class="detail-section">
                    <div class="detail-title">Rollout Schedule</div>
                    <div class="detail-content">${rolloutInfo}</div>
                </div>
                <div class="notes-section">
                    <div class="detail-title">Implementation Notes</div>
                    <textarea class="notes-input" placeholder="Add implementation notes, concerns, or progress updates..." 
                              onchange="updateNotes('${policy.id}', this.value)">${policy.notes || ''}</textarea>
                </div>
            </div>
        </div>
    `;
}

// Category management
function toggleCategory(header) {
    const section = header.parentElement;
    const items = section.querySelector('.category-items');
    
    section.classList.toggle('expanded');
    items.classList.toggle('expanded');
}

// Policy update functions with backend integration
async function updateStatus(policyId, status) {
    const policy = findPolicyById(policyId);
    if (!policy) return;
    
    const oldStatus = policy.status;
    policy.status = status;
    
    try {
        await updatePolicyInBackend(policyId, policy);
        renderAssessment();
        updateStatistics();
        applyFilters();
        showSuccessMessage(`Policy status updated to ${status}`);
    } catch (error) {
        // Revert on error
        policy.status = oldStatus;
        renderAssessment();
        showErrorMessage('Failed to update policy status');
    }
}

async function updateApproval(policyId, approval) {
    const policy = findPolicyById(policyId);
    if (!policy) return;
    
    const oldApproval = policy.clientApproval;
    policy.clientApproval = approval;
    
    try {
        await updatePolicyInBackend(policyId, policy);
        renderAssessment();
        updateStatistics();
        applyFilters();
        showSuccessMessage(`Policy ${approval === 'approved' ? 'approved' : 'denied'}`);
    } catch (error) {
        // Revert on error
        policy.clientApproval = oldApproval;
        renderAssessment();
        showErrorMessage('Failed to update approval status');
    }
}

async function updateNotes(policyId, notes) {
    const policy = findPolicyById(policyId);
    if (!policy) return;
    
    policy.notes = notes;
    debouncedSave(); // Use debounced save for notes
}

// Modal functions with backend integration
let currentPolicyId = null;

function openDatePicker(policyId) {
    currentPolicyId = policyId;
    const policy = findPolicyById(policyId);
    
    const modal = document.getElementById('datePickerModal');
    const dateInput = document.getElementById('rolloutDateInput');
    
    // Set current date or today as minimum
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    
    if (policy && policy.rolloutDate) {
        dateInput.value = formatDateForInput(policy.rolloutDate);
    } else {
        dateInput.value = '';
    }
    
    modal.style.display = 'flex';
    
    // Focus on the date input
    setTimeout(() => dateInput.focus(), 100);
}

function closeDatePicker() {
    document.getElementById('datePickerModal').style.display = 'none';
    currentPolicyId = null;
}

async function saveRolloutDate() {
    if (!currentPolicyId) return;
    
    const dateInput = document.getElementById('rolloutDateInput');
    const policy = findPolicyById(currentPolicyId);
    
    if (!policy) return;
    
    const selectedDate = dateInput.value;
    
    // Validate date
    if (selectedDate && !validateDate(selectedDate)) {
        showErrorMessage('Please select a valid date between 2024 and 2030');
        return;
    }
    
    const oldDate = policy.rolloutDate;
    policy.rolloutDate = selectedDate;
    
    try {
        await updatePolicyInBackend(currentPolicyId, policy);
        renderAssessment();
        applyFilters();
        
        if (selectedDate) {
            const formattedDate = formatDateForDisplay(selectedDate);
            showSuccessMessage(`Rollout date set to ${formattedDate}`);
        } else {
            showSuccessMessage('Rollout date cleared');
        }
    } catch (error) {
        // Revert on error
        policy.rolloutDate = oldDate;
        renderAssessment();
        showErrorMessage('Failed to update rollout date');
    }
    
    closeDatePicker();
}

function openTechModal(policyId) {
    currentPolicyId = policyId;
    const policy = findPolicyById(policyId);
    
    const modal = document.getElementById('techModal');
    const techSelect = document.getElementById('techSelect');
    
    if (policy && policy.tech) {
        techSelect.value = policy.tech;
    } else {
        techSelect.value = '';
    }
    
    modal.style.display = 'flex';
}

function closeTechModal() {
    document.getElementById('techModal').style.display = 'none';
    currentPolicyId = null;
}

async function saveTechOwner() {
    if (!currentPolicyId) return;
    
    const techSelect = document.getElementById('techSelect');
    const policy = findPolicyById(currentPolicyId);
    
    if (!policy) return;
    
    const oldTech = policy.tech;
    policy.tech = techSelect.value;
    
    try {
        await updatePolicyInBackend(currentPolicyId, policy);
        renderAssessment();
        applyFilters();
        showSuccessMessage('Technical owner assigned successfully');
    } catch (error) {
        // Revert on error
        policy.tech = oldTech;
        renderAssessment();
        showErrorMessage('Failed to assign technical owner');
    }
    
    closeTechModal();
}

// Statistics with backend integration
async function updateStatistics() {
    try {
        const stats = await apiRequest(API_ENDPOINTS.getStats(currentClientId));
        
        document.getElementById('compliantCount').textContent = stats.compliant;
        document.getElementById('partialCount').textContent = stats.partial;
        document.getElementById('nonCompliantCount').textContent = stats.nonCompliant;
        document.getElementById('pendingCount').textContent = stats.pending;
        document.getElementById('approvedCount').textContent = stats.approved;
        document.getElementById('totalCount').textContent = stats.total;
    } catch (error) {
        console.error('Failed to update statistics:', error);
        // Fall back to local calculation
        updateStatisticsLocally();
    }
}

function updateStatisticsLocally() {
    let compliant = 0, partial = 0, nonCompliant = 0, pending = 0, approved = 0, total = 0;

    Object.keys(assessmentData).forEach(category => {
        assessmentData[category].forEach(policy => {
            total++;
            if (policy.status === 'Compliant') compliant++;
            else if (policy.status === 'Partially Compliant') partial++;
            else if (policy.status === 'Not-Compliant') nonCompliant++;
            else pending++;

            if (policy.clientApproval === 'approved') approved++;
        });
    });

    document.getElementById('compliantCount').textContent = compliant;
    document.getElementById('partialCount').textContent = partial;
    document.getElementById('nonCompliantCount').textContent = nonCompliant;
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('approvedCount').textContent = approved;
    document.getElementById('totalCount').textContent = total;
}

// Enhanced filtering with date range support
function applyFilters() {
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const impactFilter = document.getElementById('impactFilter')?.value || '';
    const techFilter = document.getElementById('techFilter')?.value || '';
    const searchFilter = document.getElementById('searchInput')?.value.toLowerCase() || '';

    document.querySelectorAll('.policy-item').forEach(item => {
        const policyId = item.dataset.policyId;
        const impactLevel = item.dataset.impact;
        const techOwner = item.dataset.tech;
        const rolloutDate = item.dataset.rollout;
        const policy = findPolicyById(policyId);

        if (!policy) return;

        let showItem = true;

        // Status filter
        if (statusFilter) {
            if (statusFilter === 'pending' && policy.status) {
                showItem = false;
            } else if (statusFilter === 'overdue') {
                // Show overdue items
                if (!rolloutDate || new Date(rolloutDate) >= new Date()) {
                    showItem = false;
                }
            } else if (statusFilter === 'scheduled') {
                // Show items with rollout dates
                if (!rolloutDate) {
                    showItem = false;
                }
            } else if (statusFilter !== 'pending' && policy.status !== statusFilter) {
                showItem = false;
            }
        }

        // Impact filter
        if (impactFilter && impactLevel !== impactFilter) {
            showItem = false;
        }

        // Tech owner filter
        if (techFilter && techOwner !== techFilter) {
            showItem = false;
        }

        // Search filter
        if (searchFilter) {
            const searchText = `${policy.name} ${policy.description} ${policy.userImpact} ${policy.tech || ''} ${policy.notes || ''}`.toLowerCase();
            if (!searchText.includes(searchFilter)) {
                showItem = false;
            }
        }

        item.classList.toggle('filtered-out', !showItem);
    });

    // Hide empty categories
    document.querySelectorAll('.category-section').forEach(section => {
        const visibleItems = section.querySelectorAll('.policy-item:not(.filtered-out)');
        section.style.display = visibleItems.length > 0 ? 'block' : 'none';
    });
}

// Client management functions
async function createNewClient() {
    const clientName = prompt('Enter new organization name:');
    if (!clientName) return;
    
    const clientId = clientName.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-');
    
    window.location.href = `/clients/${clientId}`;
}

function switchClient() {
    window.location.href = '/';
}

async function listClients() {
    try {
        const clients = await apiRequest(API_ENDPOINTS.getAllClients());
        
        if (clients.length === 0) {
            alert('No clients found.');
            return;
        }
        
        let message = 'Existing Clients:\n\n';
        clients.forEach(client => {
            message += `• ${client.clientId}\n  Last modified: ${new Date(client.lastModified).toLocaleDateString()}\n\n`;
        });
        
        alert(message);
    } catch (error) {
        showErrorMessage('Failed to load client list');
    }
}

// Enhanced export functions with better date formatting
async function exportToCSV() {
    try {
        showLoadingSpinner();
        
        let csvContent = "Category,Policy Name,Status,Description,User Impact,User Impact Level,Technical Owner,Client Approval,Notes,Rollout Date,Days Until Rollout\n";

        Object.keys(assessmentData).forEach(category => {
            assessmentData[category].forEach(policy => {
                const impactLevel = getImpactLevel(policy.userImpact);
                const rolloutDate = policy.rolloutDate || '';
                let daysUntilRollout = '';
                
                if (rolloutDate) {
                    const rollout = new Date(rolloutDate);
                    const today = new Date();
                    const diffTime = rollout - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    daysUntilRollout = diffDays.toString();
                }
                
                const row = [
                    `"${category}"`,
                    `"${policy.name.replace(/"/g, '""')}"`,
                    `"${policy.status || 'Pending'}"`,
                    `"${(policy.description || '').replace(/"/g, '""')}"`,
                    `"${(policy.userImpact || '').replace(/"/g, '""')}"`,
                    `"${impactLevel}"`,
                    `"${policy.tech || ''}"`,
                    `"${policy.clientApproval || 'Pending'}"`,
                    `"${(policy.notes || '').replace(/"/g, '""')}"`,
                    `"${rolloutDate}"`,
                    `"${daysUntilRollout}"`
                ].join(',');
                csvContent += row + "\n";
            });
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Microsoft_Assessment_${currentClientId}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showSuccessMessage('CSV export completed with rollout dates');
    } catch (error) {
        showErrorMessage('Export failed');
    } finally {
        hideLoadingSpinner();
    }
}

async function exportToJSON() {
    try {
        const assessment = await apiRequest(API_ENDPOINTS.getAssessment(currentClientId));
        const dataStr = JSON.stringify(assessment, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Microsoft_Assessment_${currentClientId}_${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showSuccessMessage('JSON export completed');
    } catch (error) {
        showErrorMessage('Export failed');
    }
}

async function generateReport() {
    try {
        showLoadingSpinner();
        
        const stats = await apiRequest(API_ENDPOINTS.getStats(currentClientId));
        
        let reportContent = `# Microsoft Best Practices Assessment Report
## Client: ${currentClientId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
## Generated: ${new Date().toLocaleDateString()}

### Executive Summary

- **Total Policies Assessed:** ${stats.total}
- **Compliant:** ${stats.compliant} (${stats.percentages.compliant}%)
- **Partially Compliant:** ${stats.partial} (${stats.percentages.partial}%)
- **Not Compliant:** ${stats.nonCompliant} (${stats.percentages.nonCompliant}%)
- **Pending Review:** ${stats.pending} (${stats.percentages.pending}%)
- **Client Approved:** ${stats.approved} (${stats.percentages.approved}%)

### Detailed Assessment by Category

`;

        Object.keys(assessmentData).forEach(category => {
            reportContent += `\n#### ${category}\n\n`;
            assessmentData[category].forEach(policy => {
                const impact = getImpactLevel(policy.userImpact);
                reportContent += `**${policy.name}**
- Status: ${policy.status || 'Pending Review'}
- User Impact Level: ${impact.toUpperCase()}
- Client Approval: ${policy.clientApproval || 'Pending'}
- Technical Owner: ${policy.tech || 'Not assigned'}
- Rollout Date: ${policy.rolloutDate || 'Not scheduled'}
${policy.notes ? `- Notes: ${policy.notes}` : ''}

`;
            });
        });

        const blob = new Blob([reportContent], { type: 'text/markdown' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Microsoft_Assessment_Report_${currentClientId}_${new Date().toISOString().split('T')[0]}.md`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showSuccessMessage('Report generated successfully');
    } catch (error) {
        showErrorMessage('Report generation failed');
    } finally {
        hideLoadingSpinner();
    }
}

// Add client management UI
function addClientManagementUI() {
    const header = document.querySelector('.header');
    if (!header) return;
    
    const clientInfo = document.createElement('div');
    clientInfo.style.cssText = `
        background: rgba(255,255,255,0.1);
        padding: 1rem;
        margin-top: 1rem;
        border-radius: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
    `;
    
    const clientDisplayName = currentClientId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    clientInfo.innerHTML = `
        <div style="color: white;">
            <strong>Current Client:</strong> ${clientDisplayName}
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button onclick="window.location.href='/'" style="padding: 0.25rem 0.75rem; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">🏠 All Clients</button>
            <button onclick="createNewClient()" style="padding: 0.25rem 0.75rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">+ New Client</button>
            <button onclick="listClients()" style="padding: 0.25rem 0.75rem; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">📊 View All</button>
        </div>
    `;
    
    header.appendChild(clientInfo);
}

// Initialize application
async function initializeApp() {
    try {
        console.log('Initializing Multi-Client Assessment Tool...');
        
        // Get client ID from URL
        currentClientId = getClientId();
        if (!currentClientId) return; // Will redirect to homepage
        
        // Update branding and URL
        updateClientBranding();
        
        // Add client management UI
        addClientManagementUI();
        
        // Load assessment data from backend
        await loadAssessmentData();
        
        // Render the assessment
        renderAssessment();
        await updateStatistics();
        
        // Auto-expand first few categories
        setTimeout(() => {
            const headers = document.querySelectorAll('.category-header');
            headers.forEach((header, index) => {
                if (index < 2) {
                    if (!header.parentElement.classList.contains('expanded')) {
                        toggleCategory(header);
                    }
                }
            });
        }, 100);
        
        console.log(`Assessment tool initialized for client: ${currentClientId}`);
        showSuccessMessage('Assessment loaded successfully');
        
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showErrorMessage('Failed to initialize assessment tool');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', initializeApp);

// Auto-save every 30 seconds
setInterval(() => {
    if (!isLoading) {
        saveAssessmentData();
    }
}, 30000);

// Save when leaving page
window.addEventListener('beforeunload', () => {
    if (!isLoading) {
        saveAssessmentData();
    }
});

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const dateModal = document.getElementById('datePickerModal');
    const techModal = document.getElementById('techModal');
    
    if (event.target === dateModal) {
        closeDatePicker();
    }
    
    if (event.target === techModal) {
        closeTechModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeDatePicker();
        closeTechModal();
    }
    
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        saveAssessmentData();
    }
});

// Make functions globally available
window.setRole = setRole;
window.toggleCategory = toggleCategory;
window.updateStatus = updateStatus;
window.updateApproval = updateApproval;
window.updateNotes = updateNotes;
window.openDatePicker = openDatePicker;
window.closeDatePicker = closeDatePicker;
window.saveRolloutDate = saveRolloutDate;
window.openTechModal = openTechModal;
window.closeTechModal = closeTechModal;
window.saveTechOwner = saveTechOwner;
window.applyFilters = applyFilters;
window.createNewClient = createNewClient;
window.switchClient = switchClient;
window.listClients = listClients;
window.exportToCSV = exportToCSV;
window.exportToJSON = exportToJSON;
window.generateReport = generateReport;