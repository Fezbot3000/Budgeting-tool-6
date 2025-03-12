// PART 1: Initialization and Data Management

// Global variables and state management
let masterBills = [];
let payCycles = [];
let payCycleStart = new Date();
let payCycleFrequency = 'Fortnightly';
let payCycleIncome = 0;
let customFrequencySettings = null;
let groups = [
    "Group 1 - 2Up",
    "Group 2 - Shared Savings",
    "Group 3 - Latitude",
    "Group 4 - Cash Bills"
];

// Trigger file input dialog for import
function triggerImportDialog() {
    document.getElementById('importFileInput').click();
}

// Save data to localStorage
function saveData() {
  localStorage.setItem('billData', JSON.stringify(masterBills));
  localStorage.setItem('payCycleData', JSON.stringify(payCycles));
}

// Load data from localStorage
function loadData() {
  const billData = localStorage.getItem('billData');
  if (billData) {
    masterBills = JSON.parse(billData);
    
    // Ensure each bill has an id
    masterBills.forEach(bill => {
      if (!bill.id) {
        bill.id = `bill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      // Initialize paid status if not present
      if (bill.paid === undefined) {
        bill.paid = false;
      }
    });
    const cycleData = localStorage.getItem('payCycleData');
    if (cycleData) {
        payCycles = JSON.parse(cycleData);
        
        // Ensure all bill objects have a paid property
        payCycles.forEach(cycle => {
            if (cycle.bills) {
                cycle.bills.forEach(bill => {
                    // Initialize paid status if not present
                    if (bill.paid === undefined) {
                        bill.paid = false;
                    }
                });
            }
        });
    }
  }
  
  const cycleData = localStorage.getItem('payCycleData');
  if (cycleData) {
    payCycles = JSON.parse(cycleData);
  }
}

// Function to save groups to localStorage
function saveGroups() {
    localStorage.setItem('groupData', JSON.stringify(groups));
}

// Function to load groups from localStorage
function loadGroups() {
    const groupData = localStorage.getItem('groupData');
    if (groupData) {
        groups = JSON.parse(groupData);
    }
}

// Function to update the group select dropdown
function updateGroupDropdown() {
    const groupSelect = document.getElementById('billGroup');
    groupSelect.innerHTML = '';
    
    groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group;
        option.textContent = group;
        groupSelect.appendChild(option);
    });
}

// Function to display the list of groups
function updateGroupList() {
    const groupList = document.getElementById('groupList');
    if (!groupList) return; // Exit if element doesn't exist
    
    groupList.innerHTML = '';
    
    groups.forEach((group, index) => {
        const li = document.createElement('li');
        li.className = 'flex items-center justify-between py-3 px-4 rounded-lg bg-light-surface dark:bg-dark-surface hover:bg-ui-input dark:hover:bg-dark-card transition-colors';
        
        li.innerHTML = `
            <span class="flex-grow text-left">
                <strong class="font-medium">${group}</strong>
            </span>
        `;
        
        // Edit button
        const editButton = document.createElement('button');
        editButton.className = 'ml-3 w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary hover:bg-primary/20 transition-colors';
        editButton.innerHTML = '<span class="material-icons-round">edit</span>';
        editButton.setAttribute('aria-label', 'Edit group');
        editButton.onclick = function() {
            openGroupEditModal(group);
        };
        
        // Delete button - only show if there are no bills using this group
        const hasNoAssociatedBills = !masterBills.some(bill => bill.group === group);
        
        if (hasNoAssociatedBills && groups.length > 1) {
            const deleteButton = document.createElement('button');
            deleteButton.className = 'ml-3 w-10 h-10 flex items-center justify-center rounded-full bg-accent-red/10 text-accent-red dark:bg-accent-red/20 dark:text-accent-red hover:bg-accent-red/20 transition-colors';
            deleteButton.innerHTML = '<span class="material-icons-round">delete</span>';
            deleteButton.setAttribute('aria-label', 'Delete group');
            deleteButton.onclick = function() {
                if (confirm(`Are you sure you want to delete "${group}"?`)) {
                    groups.splice(index, 1);
                    saveGroups();
                    updateGroupList();
                    updateGroupDropdown();
                    showSnackbar("Group deleted");
                }
            };
            li.appendChild(deleteButton);
        }
        
        li.appendChild(editButton);
        groupList.appendChild(li);
    });
}

// Function to open the group edit modal
function openGroupEditModal(groupName = '') {
    const modal = document.getElementById('groupEditModal');
    if (!modal) return; // Exit if element doesn't exist
    
    const groupNameInput = document.getElementById('groupName');
    const groupOldNameInput = document.getElementById('groupOldName');
    const modalTitle = document.getElementById('groupModalTitle');
    
    if (groupName) {
        // Edit existing group
        modalTitle.textContent = 'Edit Group';
        groupNameInput.value = groupName;
        groupOldNameInput.value = groupName;
    } else {
        // Add new group
        modalTitle.textContent = 'Add New Group';
        groupNameInput.value = '';
        groupOldNameInput.value = '';
    }
    
    modal.style.display = 'flex';
}

// Function to save the group edit
function saveGroupEdit() {
    const groupName = document.getElementById('groupName').value.trim();
    const oldGroupName = document.getElementById('groupOldName').value;
    
    if (!groupName) {
        alert('Please enter a group name');
        return;
    }
    
    // Check if adding a new group or editing existing one
    if (oldGroupName === '') {
        // Adding new group
        if (groups.includes(groupName)) {
            alert('A group with this name already exists');
            return;
        }
        
        groups.push(groupName);
        showSnackbar('New group added');
    } else {
        // Editing existing group
        if (groupName === oldGroupName) {
            // No changes
            closeGroupEditModal();
            return;
        }
        
        if (groups.includes(groupName)) {
            alert('A group with this name already exists');
            return;
        }
        
        // Update group name in the array
        const index = groups.indexOf(oldGroupName);
        if (index !== -1) {
            groups[index] = groupName;
            
            // Update group name in all bills
            masterBills.forEach(bill => {
                if (bill.group === oldGroupName) {
                    bill.group = groupName;
                }
            });
            
            // Save bills with updated group names
            localStorage.setItem('billData', JSON.stringify(masterBills));
            showSnackbar('Group name updated');
        }
    }
    
    // Save and update UI
    saveGroups();
    updateGroupList();
    updateGroupDropdown();
    updateMasterList();
    generatePayCycles();
    
    // Close the modal
    closeGroupEditModal();
}

// Function to close the group edit modal
function closeGroupEditModal() {
    const modal = document.getElementById('groupEditModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Import data from a JSON file
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            // Parse the JSON data
            const importedData = JSON.parse(e.target.result);
            
            // Validate the data structure
            if (!importedData.billData) {
                throw new Error('Invalid data format: Missing bill data');
            }
            
            // Confirm import
            if (confirm('This will replace your current data. Are you sure you want to proceed?')) {
                // Store the imported data in localStorage
                if (importedData.payCycleStart) {
                    localStorage.setItem('payCycleStart', importedData.payCycleStart);
                }
                
                if (importedData.payCycleFrequency) {
                    localStorage.setItem('payCycleFrequency', importedData.payCycleFrequency);
                }
                
                if (importedData.payCycleIncome) {
                    localStorage.setItem('payCycleIncome', importedData.payCycleIncome);
                }
                
                if (importedData.billData) {
                    localStorage.setItem('billData', importedData.billData);
                }
                
                if (importedData.groupData) {
                    localStorage.setItem('groupData', importedData.groupData);
                }
                
                // Reload the page to apply changes
                showSnackbar('Data imported successfully! Reloading...');
                setTimeout(() => {
                    location.reload();
                }, 1500);
            }
        } catch (error) {
            alert('Error importing data: ' + error.message);
            console.error('Import error:', error);
        }
    };
    
    reader.readAsText(file);
    
    // Clear the file input so the same file can be selected again
    event.target.value = '';
}

// Export data to a JSON file
function exportData() {
    // Create data object with all stored information
    const exportData = {
        payCycleStart: localStorage.getItem('payCycleStart'),
        payCycleFrequency: localStorage.getItem('payCycleFrequency'),
        payCycleIncome: localStorage.getItem('payCycleIncome'),
        billData: localStorage.getItem('billData'),
        groupData: localStorage.getItem('groupData')
    };

    // Convert to JSON string
    const dataStr = JSON.stringify(exportData, null, 2);
    
    // Create a Blob with the data
    const blob = new Blob([dataStr], { type: 'application/json' });
    
    // Create a temporary link element
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    
    // Generate filename with current date
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    a.download = `bill_management_export_${dateStr}.json`;
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    
    showSnackbar('Data exported successfully!');
}

// Theme handling
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Update toggle button text and icon
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    
    if (theme === 'dark') {
        themeIcon.textContent = 'light_mode';
        themeText.textContent = 'Light Mode';
    } else {
        themeIcon.textContent = 'dark_mode';
        themeText.textContent = 'Dark Mode';
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

// Show a temporary snackbar message
function showSnackbar(message) {
    // Get snackbar element
    let snackbar = document.getElementById('snackbar');
    
    // Set message and show
    snackbar.textContent = message;
    snackbar.classList.remove('hidden');
    snackbar.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(function() {
        snackbar.classList.remove('show');
        setTimeout(() => {
            snackbar.classList.add('hidden');
        }, 500);
    }, 3000);
}

// PART 2 

/**
 * Normalizes a date by removing time components
 * @param {Date} date - The date to normalize
 * @returns {Date} - Normalized date set to 12:00:00
 */
function normalizeDate(date) {
    const normalized = new Date(date);
    normalized.setHours(12, 0, 0, 0);
    return normalized;
}

/**
 * Creates a date object with consistent formatting from a string
 * @param {string} dateStr - Date string in format DD/MM/YYYY or YYYY-MM-DD
 * @returns {Date} - JavaScript Date object
 */
function parseFormattedDate(dateStr) {
    if (dateStr.includes('/')) {
        // Handle dates in the format DD/MM/YYYY
        const [day, month, year] = dateStr.split('/').map(Number);
        return normalizeDate(new Date(year, month - 1, day));
    } else {
        // Handle ISO format YYYY-MM-DD
        return normalizeDate(new Date(dateStr));
    }
}

/**
 * Gets the last day of a specific month
 * @param {number} year - The year
 * @param {number} month - The month (0-11)
 * @returns {number} - The last day of the month
 */
function getLastDayOfMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

/**
 * Finds the next occurrence of a specific day of the week
 * @param {Date} date - Starting date
 * @param {number} dayOfWeek - Day of week (0-6, where 0 is Sunday)
 * @returns {Date} - Date of the next occurrence
 */
function getNextDayOfWeek(date, dayOfWeek) {
    const result = new Date(date);
    result.setDate(result.getDate() + (7 + dayOfWeek - result.getDay()) % 7);
    return normalizeDate(result);
}

/**
 * Advances a date by a specific number of days
 * @param {Date} date - The original date
 * @param {number} days - Number of days to add
 * @returns {Date} - The new date
 */
function advanceDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return normalizeDate(result);
}

/**
 * Advances a date by a specific number of weeks
 * @param {Date} date - The original date
 * @param {number} weeks - Number of weeks to add
 * @returns {Date} - The new date
 */
function advanceWeeks(date, weeks) {
    return advanceDays(date, weeks * 7);
}

/**
 * Advances a date by a specific number of years
 * @param {Date} date - The original date
 * @param {number} years - Number of years to add
 * @returns {Date} - The new date
 */
function advanceYears(date, years) {
    const result = new Date(date);
    
    // Store original values
    const originalDay = result.getDate();
    const originalMonth = result.getMonth();
    
    // Set the new year
    result.setFullYear(result.getFullYear() + years);
    
    // Handle Feb 29 in non-leap years
    if (originalMonth === 1 && originalDay === 29 && result.getMonth() !== 1) {
        result.setDate(28);
    }
    
    return normalizeDate(result);
}

/**
 * Formats a date as YYYY-MM-DD for consistent storage
 * @param {Date} date - The date to format
 * @returns {string} - Formatted date string
 */
function formatDateForStorage(date) {
    return date.toISOString().split('T')[0];
}

/**
 * Determines if a date is within an inclusive date range
 * @param {Date} date - The date to check
 * @param {Date} startDate - Range start (inclusive)
 * @param {Date} endDate - Range end (inclusive)
 * @returns {boolean} - True if date is within range
 */
function isDateInRange(date, startDate, endDate) {
    const normalizedDate = normalizeDate(date);
    const normalizedStart = normalizeDate(startDate);
    const normalizedEnd = normalizeDate(endDate);
    
    return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
}

/**
 * Determines the date category for a bill based on its original date
 * @param {Date|string} originalDate - The original date of the bill
 * @returns {string} - The date category ('day28', 'day29', 'day30', 'day31', or 'normal')
 */
function determineDateCategory(originalDate) {
    // Ensure we have a Date object
    const date = (typeof originalDate === 'string') 
        ? new Date(originalDate) 
        : new Date(originalDate);
    
    const day = date.getDate();
    
    // Categorize based on day of month
    if (day === 31) {
        return 'day31';
    } else if (day === 30) {
        return 'day30';
    } else if (day === 29) {
        return 'day29';
    } else if (day === 28) {
        return 'day28';
    } else {
        return 'normal';
    }
}

/**
 * Advances a date by a specific number of months with dedicated handling for each date category
 * @param {Date} date - The date to advance
 * @param {number} months - Number of months to add
 * @param {string} category - The date category ('day28', 'day29', 'day30', 'day31', or 'normal')
 * @returns {Date} - The new date after advancing
 */
function advanceMonthsByCategory(date, months, category) {
    const originalDate = new Date(date);
    let targetYear = originalDate.getFullYear();
    let targetMonth = originalDate.getMonth() + months;
    
    // Adjust year based on target month
    targetYear += Math.floor(targetMonth / 12);
    targetMonth = targetMonth % 12;
    
    // Get the last day of the target month
    const targetLastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
    
    let targetDay;
    
    // Apply category-specific rules
    switch (category) {
        case 'day31':
            // Day 31 bills always go to the last day of the month
            targetDay = targetLastDay;
            break;
            
        case 'day30':
            // Day 30 bills stay on 30th if possible, otherwise last day
            targetDay = (targetLastDay >= 30) ? 30 : targetLastDay;
            break;
            
        case 'day29':
            // Day 29 bills stay on 29th if possible, otherwise last day
            targetDay = (targetLastDay >= 29) ? 29 : targetLastDay;
            break;
            
        case 'day28':
            // Day 28 bills always stay on 28th
            targetDay = 28;
            break;
            
        case 'normal':
        default:
            // Normal bills keep their day unless it exceeds the month's length
            targetDay = Math.min(originalDate.getDate(), targetLastDay);
            break;
    }
    
    // Create new date with normalized time
    return normalizeDate(new Date(targetYear, targetMonth, targetDay));
}

/**
 * Assigns a date category to a bill and stores it
 * @param {Object} bill - The bill object
 */
function categorizeBill(bill) {
    // Only add category if it doesn't exist
    if (!bill.dateCategory) {
        const date = (typeof bill.date === 'string') 
            ? new Date(bill.date) 
            : new Date(bill.date);
        
        bill.dateCategory = determineDateCategory(date);
    }
    
    return bill;
}

/**
 * Calculates the next occurrence of a bill based on its frequency and date category
 * @param {Object} bill - The bill object (with dateCategory property)
 * @param {Date} currentDate - Current date to calculate from
 * @returns {Date} - Next occurrence date
 */
function calculateNextBillDate(bill, currentDate) {
    // Ensure the bill has a date category
    const categorizedBill = categorizeBill(bill);
    const current = new Date(currentDate);
    
    switch (categorizedBill.frequency) {
        case 'Monthly':
            return advanceMonthsByCategory(current, 1, categorizedBill.dateCategory);
            
        case 'Fortnightly':
            return advanceDays(current, 14);
            
        case 'Yearly':
            return advanceMonthsByCategory(current, 12, categorizedBill.dateCategory);
            
        case '6-Monthly':
            return advanceMonthsByCategory(current, 6, categorizedBill.dateCategory);
            
        case 'Custom':
            if (!categorizedBill.customFrequency) return null;
            
            const cf = categorizedBill.customFrequency;
            
            if (cf.unit === 'days') {
                return advanceDays(current, cf.value);
            } else if (cf.unit === 'weeks') {
                const nextDate = advanceWeeks(current, cf.value);
                
                // Handle specific days of week if specified
                if (cf.days && cf.days.length > 0) {
                    // Find the next matching day of week
                    for (let i = 0; i < 7; i++) {
                        const checkDate = advanceDays(nextDate, i);
                        if (cf.days.includes(checkDate.getDay())) {
                            return checkDate;
                        }
                    }
                }
                
                return nextDate;
            } else if (cf.unit === 'months') {
                return advanceMonthsByCategory(current, cf.value, categorizedBill.dateCategory);
            } else if (cf.unit === 'years') {
                return advanceMonthsByCategory(current, cf.value * 12, categorizedBill.dateCategory);
            }
            
            return null;
            
        case 'Every 1 weeks on Mo':
            return getNextDayOfWeek(advanceDays(current, 1), 1); // 1 = Monday
            
        case 'One-Off':
            return null;
            
        default:
            console.warn(`Unknown frequency: ${categorizedBill.frequency}`);
            return null;
    }
}

// PART 3: UI Interaction and Rendering

/**
 * Format date to match the specific design requirements
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatPeriodDate(date) {
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

/**
 * Toggle the paid status of a bill
 * @param {string} billId - The ID of the bill to toggle
 */
function toggleBillPaid(billId) {
    // Find the bill in the pay cycles
    for (let i = 0; i < payCycles.length; i++) {
        const cycle = payCycles[i];
        for (let j = 0; j < cycle.bills.length; j++) {
            const bill = cycle.bills[j];
            const currentBillId = bill.id || `cycle-${i}-bill-${bill.name}-${bill.date}`;
            
            if (currentBillId === billId) {
                // Toggle the paid status
                bill.paid = !bill.paid;
                
                // Update the UI
                const billElement = document.querySelector(`[data-bill-id="${billId}"]`);
                if (billElement) {
                    billElement.classList.toggle('bill-paid');
                }
                
                // Save the updated payCycles to localStorage
                localStorage.setItem('payCycleData', JSON.stringify(payCycles));
                return;
            }
        }
    }
}

/**
 * Render transactions for a specific billing period
 * @param {Array} transactions - List of transactions
 * @returns {string} HTML string of transactions
 */
function renderTransactions(transactions) {
    if (!transactions || transactions.length === 0) {
        return `
            <tr>
                <td colspan="4" class="text-center text-light-textSecondary dark:text-dark-textSecondary py-4">
                    No transactions
                </td>
            </tr>
        `;
    }

    return transactions.map(transaction => {
        const transactionDate = new Date(transaction.date);
        const formattedDate = transactionDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        // Determine color and sign based on transaction type
        const isRepayment = transaction.type === 'repayment';
        const amountClass = isRepayment ? 'text-accent-green' : 'text-accent-red';
        const amountSign = isRepayment ? '-' : '';

        return `
            <tr>
                <td>${formattedDate}</td>
                <td>${transaction.description}</td>
                <td class="${amountClass} text-right">
                    ${amountSign}$${Math.abs(transaction.amount).toFixed(2)}
                </td>
                <td class="text-right">
                    <button class="delete-transaction text-accent-red hover:bg-accent-red/10 rounded-full w-6 h-6 flex items-center justify-center">
                        <span class="material-icons-round text-base">close</span>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Render billing periods to the UI
 */
function renderBillingPeriods() {
    const container = document.getElementById('billingPeriodsList');
    container.innerHTML = ''; // Clear existing content
    
    // Load the latest billing periods
    billingPeriods = loadBillingPeriods();
    
    // Sort periods by start date (newest first)
    const sortedPeriods = billingPeriods.sort((a, b) => 
        new Date(b.startDate) - new Date(a.startDate)
    );
    
    sortedPeriods.forEach((period, index) => {
        // Calculate financial details
        const startDate = new Date(period.startDate);
        const endDate = new Date(period.endDate);
        const interestFreeEndDate = new Date(period.interestFreeEndDate);
        const remainingDays = calculateRemainingDays(period);
        const totalOwing = calculateTotalTransactions(period);
        
        const periodElement = document.createElement('div');
        periodElement.classList.add(
            'bg-light-surface', 
            'dark:bg-dark-surface', 
            'rounded-xl', 
            'p-6', 
            'shadow-md',
            'dark:shadow-lg',
            'mb-6'
        );
        
        periodElement.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-semibold">
                    Billing Period ${index + 1}: 
                    ${formatPeriodDate(startDate)} - ${formatPeriodDate(endDate)}
                    <button class="ml-2 edit-period hover:bg-ui-input dark:hover:bg-dark-card rounded-full p-1">
                        <span class="material-icons-round text-base">edit</span>
                    </button>
                </h2>
                <span class="text-sm ${remainingDays > 0 ? 'text-accent-green' : 'text-accent-red'}">
                    ${remainingDays > 0 ? 'Active' : 'Expired'}
                </span>
            </div>
            
            <div class="bg-light-surface/50 dark:bg-dark-surface/50 rounded-lg p-4 mb-4">
                <p class="text-light-textSecondary dark:text-dark-textSecondary">
                    Interest-free until: ${formatPeriodDate(interestFreeEndDate)} 
                    (${period.interestFreeDays || 'undefined'} days)
                </p>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                    <p class="text-sm text-light-textSecondary dark:text-dark-textSecondary">Days Remaining</p>
                    <p class="font-semibold">${remainingDays}</p>
                </div>
                <div>
                    <p class="text-sm text-light-textSecondary dark:text-dark-textSecondary">Interest-Free Period</p>
                    <p class="font-semibold">${period.interestFreeDays || 'undefined'} days</p>
                </div>
                <div>
                    <p class="text-sm text-light-textSecondary dark:text-dark-textSecondary">Total Owing</p>
                    <p class="font-semibold ${totalOwing >= 0 ? 'text-accent-green' : 'text-accent-red'}">
                        $${Math.abs(totalOwing).toFixed(2)}
                    </p>
                </div>
                <div>
                    <p class="text-sm text-light-textSecondary dark:text-dark-textSecondary">Status</p>
                    <p class="font-semibold ${remainingDays > 0 ? 'text-accent-green' : 'text-accent-red'}">
                        ${remainingDays > 0 ? 'Active' : 'Expired'}
                    </p>
                </div>
            </div>
            
            <div class="flex space-x-4 mb-4">
                <button onclick="openTransactionModal('${period.id}', 'expense')" class="h-10 px-4 rounded-xl bg-primary text-white font-medium flex items-center justify-center transition-all hover:scale-105 ease-in-out">
                    Add Transaction
                </button>
                <button onclick="openTransactionModal('${period.id}', 'repayment')" class="h-10 px-4 rounded-xl bg-ui-input dark:bg-dark-card text-light-text dark:text-dark-text font-medium flex items-center justify-center transition-all hover:bg-gray-100 dark:hover:bg-dark-surface ease-in-out">
                    Add Repayment
                </button>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="bg-light-surface/50 dark:bg-dark-surface/50">
                            <th class="p-2 text-left">DATE</th>
                            <th class="p-2 text-left">DESCRIPTION</th>
                            <th class="p-2 text-right">AMOUNT</th>
                            <th class="p-2 text-right">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${renderTransactions(period.transactions)}
                    </tbody>
                </table>
            </div>
        `;
        
        container.appendChild(periodElement);
    });
}

// Add a new bill to the master list
function addBill() {
    let name = document.getElementById("billName").value;
    let amount = parseFloat(document.getElementById("billAmount").value);
    let date = document.getElementById("billDate").value;
    let frequency = document.getElementById("billFrequency").value;
    let group = document.getElementById("billGroup").value;
    
    if (name && amount && date && frequency && group) {
        // For custom frequency, save the settings with the bill
        let billData = { 
            name, 
            amount, 
            date, 
            frequency, 
            group,
            id: `bill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Add unique ID
            paid: false // Initialize as unpaid
        };
        
        if (frequency === 'Custom' && customFrequencySettings) {
            billData.customFrequency = customFrequencySettings;
        }
        
        masterBills.push(billData);
        localStorage.setItem('billData', JSON.stringify(masterBills));
        
        // Clear form fields
        document.getElementById("billName").value = "";
        document.getElementById("billAmount").value = "";
        customFrequencySettings = null;
        
        updateMasterList();
        generatePayCycles();
        
        // Show success feedback
        showSnackbar("Bill added successfully!");
    } else {
        alert("Please fill in all fields");
    }
}

// Update the displayed master bill list
function updateMasterList() {
    let list = document.getElementById("masterList");
    list.innerHTML = "";
    
    masterBills.forEach((bill, index) => {
        let li = document.createElement("li");
        li.className = "flex items-center justify-between py-3 px-4 rounded-lg bg-light-surface dark:bg-dark-surface hover:bg-ui-input dark:hover:bg-dark-card transition-colors";
        
        // Create frequency description for display
        let frequencyDisplay = bill.frequency;
        if (bill.frequency === 'Custom' && bill.customFrequency) {
            const cf = bill.customFrequency;
            frequencyDisplay = `Every ${cf.value} ${cf.unit}`;
            if (cf.unit === 'weeks' && cf.days && cf.days.length > 0) {
                const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
                frequencyDisplay += ` on ${cf.days.map(d => dayNames[d]).join(', ')}`;
            }
        }
        
        // Parse date safely regardless of format
        let billDate;
        if (typeof bill.date === 'string' && bill.date.includes('/')) {
            // Handle DD/MM/YYYY format
            const [day, month, year] = bill.date.split('/').map(Number);
            billDate = new Date(year, month - 1, day);
        } else {
            // Handle ISO format YYYY-MM-DD
            billDate = new Date(bill.date + 'T12:00:00Z');
        }
        
        li.innerHTML = `
            <span class="flex-grow text-left">
                <strong class="font-medium">${bill.name}</strong>
                <div class="text-sm text-light-textSecondary dark:text-dark-textSecondary mt-1">${billDate.toLocaleDateString()} (${frequencyDisplay})</div>
            </span>
            <span class="text-right font-semibold font-mono whitespace-nowrap pl-4 min-w-[120px]">${bill.amount.toFixed(2)}</span>
        `;
        
        // Create buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'flex items-center ml-3';
        
        // Add edit button
        let editButton = document.createElement('button');
        editButton.className = 'w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary hover:bg-primary/20 transition-colors mr-2';
        editButton.innerHTML = '<span class="material-icons-round">edit</span>';
        editButton.setAttribute('aria-label', 'Edit bill');
        editButton.onclick = function(e) {
            e.stopPropagation();
            editBill(index);
        };
        
        // Add delete button
        let deleteButton = document.createElement('button');
        deleteButton.className = 'w-10 h-10 flex items-center justify-center rounded-full bg-accent-red/10 text-accent-red dark:bg-accent-red/20 dark:text-accent-red hover:bg-accent-red/20 transition-colors';
        deleteButton.innerHTML = '<span class="material-icons-round">delete</span>';
        deleteButton.setAttribute('aria-label', 'Delete bill');
        deleteButton.onclick = function(e) {
            e.stopPropagation();
            if (confirm(`Are you sure you want to delete "${bill.name}"?`)) {
                masterBills.splice(index, 1);
                localStorage.setItem('billData', JSON.stringify(masterBills));
                updateMasterList();
                generatePayCycles();
                showSnackbar("Bill deleted");
            }
        };
        
        // Add buttons to container
        buttonsContainer.appendChild(editButton);
        buttonsContainer.appendChild(deleteButton);
        
        // Add buttons container to list item
        li.appendChild(buttonsContainer);
        list.appendChild(li);
    });
}

// Function to open the edit bill modal
function editBill(index) {
    const bill = masterBills[index];
    const modal = document.getElementById('editBillModal');
    
    if (!modal) return; // Exit if element doesn't exist
    
    // Update the edit group dropdown
    updateEditGroupDropdown();
    
    // Fill in the form fields with current bill data
    document.getElementById('editBillName').value = bill.name;
    document.getElementById('editBillAmount').value = bill.amount;
    
    // Format date for the date input (YYYY-MM-DD)
    let billDate;
    if (typeof bill.date === 'string' && bill.date.includes('/')) {
        // Handle DD/MM/YYYY format
        const [day, month, year] = bill.date.split('/').map(Number);
        billDate = new Date(year, month - 1, day);
    } else {
        // Handle ISO format YYYY-MM-DD
        billDate = new Date(bill.date + 'T12:00:00Z');
    }
    document.getElementById('editBillDate').value = billDate.toISOString().slice(0, 10);
    
    document.getElementById('editBillFrequency').value = bill.frequency;
    document.getElementById('editBillGroup').value = bill.group;
    document.getElementById('editBillIndex').value = index;
    
    // Show the modal
    modal.style.display = 'flex';
}

// Function to update the group dropdown in the edit bill modal
function updateEditGroupDropdown() {
    const groupSelect = document.getElementById('editBillGroup');
    groupSelect.innerHTML = '';
    
    groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group;
        option.textContent = group;
        groupSelect.appendChild(option);
    });
}

// Function to save the edited bill
function saveEditBill() {
    const name = document.getElementById('editBillName').value.trim();
    const amount = parseFloat(document.getElementById('editBillAmount').value);
    const date = document.getElementById('editBillDate').value;
    const frequency = document.getElementById('editBillFrequency').value;
    const group = document.getElementById('editBillGroup').value;
    const index = parseInt(document.getElementById('editBillIndex').value);
    
    if (!name || isNaN(amount) || !date || !frequency || !group || isNaN(index)) {
        alert('Please fill in all fields');
        return;
    }
    
    // Keep any custom frequency settings if frequency is still Custom
    let customFrequency = null;
    if (frequency === 'Custom' && masterBills[index].customFrequency) {
        customFrequency = masterBills[index].customFrequency;
    }
    
    // Keep the original ID and paid status
    const originalId = masterBills[index].id;
    const isPaid = masterBills[index].paid || false;
    
    // Update the bill
    masterBills[index] = {
        name,
        amount,
        date,
        frequency,
        group,
        id: originalId,
        paid: isPaid,
        dateCategory: determineDateCategory(date)
    };
    
    // Add custom frequency if applicable
    if (customFrequency) {
        masterBills[index].customFrequency = customFrequency;
    }
    
    // Save to localStorage
    localStorage.setItem('billData', JSON.stringify(masterBills));
    
    // Update UI
    updateMasterList();
    generatePayCycles();
    
    // Close the modal
    closeEditBillModal();
    
    showSnackbar('Bill updated successfully');
}

// Function to close the edit bill modal
function closeEditBillModal() {
    const modal = document.getElementById('editBillModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Set the pay cycle parameters
function setPayCycle() {
    let start = document.getElementById('payCycleStart').value;
    let frequency = document.getElementById('payCycleFrequency').value;
    let income = parseFloat(document.getElementById('payCycleIncome').value);
    
    if (start && !isNaN(income)) {
        payCycleStart = new Date(start);
        payCycleFrequency = frequency;
        payCycleIncome = income;
        localStorage.setItem('payCycleStart', payCycleStart.toISOString());
        localStorage.setItem('payCycleFrequency', payCycleFrequency);
        localStorage.setItem('payCycleIncome', payCycleIncome.toString());
        generatePayCycles();
        showSnackbar("Pay cycle updated!");
    } else {
        alert("Please select a start date and enter valid income");
    }
}

/**
 * Generate pay cycles with bills assigned to their correct dates
 */
function generatePayCycles() {
    payCycles = [];
    let cycleStart = normalizeDate(new Date(payCycleStart));
    
    // Initialize master bills with categories
    masterBills.forEach(categorizeBill);
    
    // Generate pay cycles
    for (let i = 0; i < 29; i++) {
        let cycleEnd;
        
        // Set cycle end date based on frequency
        if (payCycleFrequency === 'Monthly') {
            // For monthly cycles, need to use the categorical approach
            const category = 'normal'; // Normal day handling for cycle dates
            cycleEnd = advanceMonthsByCategory(cycleStart, 1, category);
            // Adjust back by 1 day to not overlap with next cycle
            cycleEnd.setDate(cycleEnd.getDate() - 1);
        } else { // Fortnightly
            cycleEnd = new Date(cycleStart);
            cycleEnd.setDate(cycleStart.getDate() + 14 - 1); // -1 to avoid overlap
        }
        
        // Normalize the end date (remove time component)
        cycleEnd = normalizeDate(cycleEnd);
        
        let cycleBills = [];
        
        // Process each bill
        masterBills.forEach((bill, billIndex) => {
            // Ensure the bill has a category
            const categorizedBill = categorizeBill(bill);
            
            // Parse the original bill date with our consistent formatter
            let originalBillDate;
            
            // Check if the date is already in the right format (for bills from master list)
            if (typeof categorizedBill.date === 'string' && categorizedBill.date.includes('/')) {
                originalBillDate = parseFormattedDate(categorizedBill.date);
            } else {
                originalBillDate = normalizeDate(new Date(categorizedBill.date));
            }
            
            // For first cycle, start with the original date
            let currentBillDate = new Date(originalBillDate);
            
            // For subsequent cycles, find the right occurrence within this cycle
            if (i > 0) {
                // Start with the original date
                currentBillDate = new Date(originalBillDate);
                
                // Keep advancing the date until we reach or pass the cycle start
                while (currentBillDate < cycleStart) {
                    // Use the categorical approach for calculating next date
                    const nextDate = calculateNextBillDate(categorizedBill, currentBillDate);
                    
                    if (!nextDate) {
                        // Handle one-off bills
                        if (categorizedBill.frequency === 'One-Off') {
                            // One-off bill should only appear in its specific cycle
                            break;
                        } else {
                            // Unknown frequency or calculation error
                            console.warn(`Could not calculate next date for bill: ${categorizedBill.name}`);
                            break;
                        }
                    }
                    
                    currentBillDate = nextDate;
                }
            }
            
            // After finding the right occurrence for this cycle, check if it falls within the cycle
            // Use inclusive comparison for both start and end dates
            if (isDateInRange(currentBillDate, cycleStart, cycleEnd)) {
                // Create a unique ID for this bill in this cycle if it doesn't already have one
                const billId = categorizedBill.id || `bill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                
                // Convert to a format safe for storage with consistent timezone handling
                const formattedDate = formatDateForStorage(currentBillDate);
                
                cycleBills.push({
                    ...categorizedBill,
                    date: formattedDate,
                    id: billId,
                    paid: categorizedBill.paid || false,
                    // Store original day for debugging
                    _originalDay: originalBillDate.getDate()
                });
            }
            
            // For weekly or fortnightly bills, check for additional occurrences within this cycle
            if (categorizedBill.frequency === 'Fortnightly' || 
                categorizedBill.frequency === 'Every 1 weeks on Mo' || 
                (categorizedBill.frequency === 'Custom' && categorizedBill.customFrequency && categorizedBill.customFrequency.unit === 'weeks')) {
                
                // Use the categorical approach for calculating next date
                let nextDate = calculateNextBillDate(categorizedBill, currentBillDate);
                
                // Keep adding occurrences as long as they fall within this cycle
                while (nextDate && isDateInRange(nextDate, cycleStart, cycleEnd)) {
                    const formattedNextDate = formatDateForStorage(nextDate);
                    
                    // Create a unique ID for this recurring bill instance
                    const recurrenceBillId = `${categorizedBill.id || 'bill'}-recurrence-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                    
                    // Add this occurrence to the cycle
                    cycleBills.push({
                        ...categorizedBill,
                        date: formattedNextDate,
                        id: recurrenceBillId,
                        paid: false, // New recurrences start as unpaid
                        _originalDay: originalBillDate.getDate()
                    });
                    
                    // Calculate the next occurrence using the categorical approach
                    nextDate = calculateNextBillDate(categorizedBill, nextDate);
                }
            }
        });
        
        // Add this cycle to our pay cycles
        payCycles.push({
            cycleStart: cycleStart.toDateString(),
            cycleEnd: cycleEnd.toDateString(),
            bills: cycleBills,
            income: payCycleIncome
        });
        
        // Next cycle starts where this one ended plus one day
        cycleStart = advanceDays(cycleEnd, 1);
    }
    
    updatePayCycles();
}

/**
 * Toggle visibility of past pay cycles
 * @param {boolean} show - Whether to show or hide past pay cycles
 */
function togglePastPayCycles(show) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const payCyclesDiv = document.getElementById("payCycles");
    const payCycleElements = payCyclesDiv.querySelectorAll('.pay-cycle');
    
    // Track if we have past cycles
    let hasPastCycles = false;
    
    payCycleElements.forEach((cycleElement, index) => {
        // Get the cycle end date from the data attribute we'll add
        const cycleEndDateStr = cycleElement.dataset.cycleEnd;
        if (!cycleEndDateStr) return;
        
        const cycleEndDate = new Date(cycleEndDateStr);
        
        // If this cycle has ended (end date is before today)
        if (cycleEndDate < today) {
            hasPastCycles = true;
            cycleElement.style.display = show ? 'block' : 'none';
            // Add a visual indicator for past cycles when shown
            if (show) {
                cycleElement.classList.add('past-cycle');
                // Add animation class if needed
                cycleElement.classList.add('showing');
                // Remove animation class after animation completes
                setTimeout(() => {
                    cycleElement.classList.remove('showing');
                }, 300);
            } else {
                cycleElement.classList.remove('past-cycle');
            }
        }
    });
    
    // Update button text based on current state
    const toggleBtn = document.getElementById('togglePastCycles');
    if (toggleBtn) {
        const iconElem = toggleBtn.querySelector('.material-icons-round');
        const textElem = toggleBtn.querySelector('.btn-text');
        
        if (show) {
            iconElem.textContent = 'visibility_off';
            textElem.textContent = 'Hide Past Cycles';
        } else {
            iconElem.textContent = 'visibility';
            textElem.textContent = 'Show Past Cycles';
        }
    }
    
    // Show/hide the button based on whether past cycles exist
    if (toggleBtn) {
        toggleBtn.style.display = hasPastCycles ? 'flex' : 'none';
    }
    
    // Save the current state
    localStorage.setItem('showPastCycles', show ? 'true' : 'false');
}

// PART 4
// Function to create the financial chart
function createFinancialChart() {
    // If the financialChart element doesn't exist, return
    const chartElement = document.getElementById('financialChart');
    if (!chartElement) return null;
    
    const ctx = chartElement.getContext('2d');
    
    // Check if payCycles is empty
    if (!payCycles || payCycles.length === 0) {
        return null;
    }
    
    // Extract data from pay cycles
    const labels = payCycles.map((cycle, index) => `Cycle ${index + 1}`);
    const incomeData = payCycles.map(cycle => cycle.income);
    const expensesData = payCycles.map(cycle => cycle.bills.reduce((sum, bill) => sum + bill.amount, 0));
    const balanceData = payCycles.map((cycle, index) => 
        incomeData[index] - expensesData[index]
    );
    
    // Only show the first 12 cycles for better visibility
    const displayCount = Math.min(12, labels.length);
    
    // Create chart with new color palette
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.slice(0, displayCount),
            datasets: [
                {
                    label: 'Income',
                    data: incomeData.slice(0, displayCount),
                    backgroundColor: 'rgba(107, 76, 230, 0.7)', // Primary purple
                    borderColor: 'rgb(107, 76, 230)',
                    borderWidth: 1
                },
                {
                    label: 'Expenses',
                    data: expensesData.slice(0, displayCount),
                    backgroundColor: 'rgba(255, 59, 48, 0.7)', // Accent red
                    borderColor: 'rgb(255, 59, 48)',
                    borderWidth: 1
                },
                {
                    label: 'Balance',
                    data: balanceData.slice(0, displayCount),
                    type: 'line',
                    fill: false,
                    backgroundColor: 'rgba(52, 199, 89, 0.7)', // Accent green
                    borderColor: 'rgb(52, 199, 89)',
                    borderWidth: 2,
                    tension: 0.1,
                    pointBackgroundColor: function(context) {
                        const index = context.dataIndex;
                        const value = context.dataset.data[index];
                        return value >= 0 ? 'rgb(52, 199, 89)' : 'rgb(255, 59, 48)';
                    }
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Amount ($)'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Pay Cycles'
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Financial Overview Across Pay Cycles',
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('en-US', { 
                                    style: 'currency', 
                                    currency: 'USD' 
                                }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
    
    return chart;
}

// Update the toggle button
function updateToggleButton(button, isHidden) {
    const iconElem = button.querySelector('.material-icons-round');
    const textElem = button.querySelector('.btn-text');
    
    if (isHidden) {
        iconElem.textContent = 'visibility';
        textElem.textContent = 'Show List';
    } else {
        iconElem.textContent = 'visibility_off';
        textElem.textContent = 'Hide List';
    }
}

// Update the toggle all cycles button
function updateToggleAllButton(button, isCollapsed) {
    const iconElem = button.querySelector('.material-icons-round');
    const textElem = button.querySelector('.btn-text');
    
    if (isCollapsed) {
        iconElem.textContent = 'expand_more';
        textElem.textContent = 'Expand All';
    } else {
        iconElem.textContent = 'expand_less';
        textElem.textContent = 'Collapse All';
    }
}

// Fix balance colors to ensure they're green/red
function fixBalanceColors() {
    // Classes already handle this in CSS with positive-balance and negative-balance
    // No need for inline styles
}

// Set up the custom frequency modal
function setupCustomFrequencyModal() {
    const modal = document.getElementById('customFrequencyModal');
    const closeBtn = modal.querySelector('.close');
    const cancelBtn = document.getElementById('cancelCustomFrequency');
    const saveBtn = document.getElementById('saveCustomFrequency');
    const frequencyUnit = document.getElementById('customFrequencyUnit');
    const weekdaySelector = document.getElementById('weekdaySelector');
    const weekdayButtons = document.querySelectorAll('.weekday-btn');
    
    // Show weekday selector when 'Week(s)' is selected
    frequencyUnit.addEventListener('change', function() {
        if (this.value === 'weeks') {
            weekdaySelector.style.display = 'block';
        } else {
            weekdaySelector.style.display = 'none';
        }
    });
    
    // Toggle weekday button selection
    weekdayButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('selected');
        });
    });
    
    // Close the modal
    function closeModal() {
        modal.style.display = 'none';
    }
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Window click to close modal
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // Save custom frequency
    saveBtn.addEventListener('click', function() {
        const value = parseInt(document.getElementById('customFrequencyValue').value) || 1;
        const unit = document.getElementById('customFrequencyUnit').value;
        let selectedDays = [];
        
        if (unit === 'weeks') {
            document.querySelectorAll('.weekday-btn.selected').forEach(btn => {
                selectedDays.push(parseInt(btn.dataset.day));
            });
            if (selectedDays.length === 0) {
                // If no days selected, use the current day of the week
                selectedDays.push(new Date().getDay());
            }
        }
        
        customFrequencySettings = {
            value: value,
            unit: unit,
            days: selectedDays
        };
        
        // Set a descriptive text in the frequency dropdown
        const frequencyDropdown = document.getElementById('billFrequency');
        let customText = `Custom: Every ${value} ${unit}`;
        if (unit === 'weeks' && selectedDays.length > 0) {
            const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
            customText += ` on ${selectedDays.map(d => dayNames[d]).join(', ')}`;
        }
        
        // Create or update the custom option
        let customOption = frequencyDropdown.querySelector('option[value="Custom"]');
        customOption.textContent = customText;
        
        closeModal();
    });
}

// Update the displayed pay cycles
function updatePayCycles() {
    let cyclesDiv = document.getElementById("payCycles");
    cyclesDiv.innerHTML = "";
    
    // Add controls for past cycles
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'flex justify-end mb-4';
    
    const togglePastBtn = document.createElement('button');
    togglePastBtn.id = 'togglePastCycles';
    togglePastBtn.className = 'h-10 px-4 rounded-xl bg-ui-input dark:bg-dark-card text-light-text dark:text-dark-text font-medium flex items-center justify-center transition-all hover:bg-gray-100 dark:hover:bg-dark-surface ease-in-out control-btn';
    togglePastBtn.innerHTML = `
        <span class="material-icons-round mr-2">visibility</span>
        <span class="btn-text">Show Past Cycles</span>
    `;
    togglePastBtn.addEventListener('click', function() {
        const currentState = localStorage.getItem('showPastCycles') === 'true';
        togglePastPayCycles(!currentState);
    });
    
    controlsDiv.appendChild(togglePastBtn);
    cyclesDiv.appendChild(controlsDiv);
    
    payCycles.forEach((cycle, index) => {
        // Calculate financial details
        let total = cycle.bills.reduce((sum, bill) => sum + bill.amount, 0);
        let balance = cycle.income - total;
        let balanceClass = balance >= 0 ? 'positive-balance' : 'negative-balance';
        
        // Create pay cycle container
        let cycleContainer = document.createElement("div");
        cycleContainer.className = "pay-cycle bg-light-surface dark:bg-dark-surface rounded-xl shadow-sm dark:shadow-md mb-4 overflow-hidden";
        
        // Store cycle dates as data attributes for easy access
        cycleContainer.dataset.cycleStart = cycle.cycleStart;
        cycleContainer.dataset.cycleEnd = cycle.cycleEnd;
        
        // Create cycle header
        let cycleHeader = document.createElement("div");
        cycleHeader.className = "cycle-header flex justify-between items-center p-5 cursor-pointer hover:bg-ui-input dark:hover:bg-dark-card transition-colors border-b border-ui-divider dark:border-dark-card";
        
        // Format dates nicely
        const startDate = new Date(cycle.cycleStart);
        const endDate = new Date(cycle.cycleEnd);
        const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        const formattedStartDate = startDate.toLocaleDateString(undefined, dateOptions);
        const formattedEndDate = endDate.toLocaleDateString(undefined, dateOptions);
        
        // Add content to header
        let headerContent = document.createElement("div");
        headerContent.innerHTML = `
            <h3 class="text-xl font-semibold">${index + 1} (${formattedStartDate} - ${formattedEndDate})</h3>
            <div class="mt-3 mb-3">
                <p class="text-light-textSecondary dark:text-dark-textSecondary text-sm leading-relaxed">Income: <span class="font-semibold text-light-text dark:text-dark-text">${cycle.income.toFixed(2)}</span></p>
                <p class="text-light-textSecondary dark:text-dark-textSecondary text-sm leading-relaxed">Expenses: <span class="font-semibold text-light-text dark:text-dark-text">${total.toFixed(2)}</span></p>
                <p class="text-light-textSecondary dark:text-dark-textSecondary text-sm leading-relaxed ${balanceClass}">Balance: <span>${balance.toFixed(2)}</span></p>
            </div>
        `;
        
        // Add toggle button with Material icon
        let toggleButton = document.createElement("button");
        toggleButton.className = "toggle-btn cycle-toggle w-10 h-10 flex items-center justify-center rounded-full bg-ui-input dark:bg-dark-card text-light-text dark:text-dark-text";
        toggleButton.innerHTML = '<span class="material-icons-round">expand_more</span>';
        
        if (index !== 0) {
            toggleButton.classList.add("collapsed");
        }
        
        // Add elements to header
        cycleHeader.appendChild(headerContent);
        cycleHeader.appendChild(toggleButton);
        
        // Create cycle content
        let cycleContent = document.createElement("div");
        cycleContent.className = "cycle-content p-5";
        if (index !== 0) {
            cycleContent.classList.add("hidden"); // Only first cycle open by default
        }
        
        // Group bills by their group
        let groupedBills = {};
        cycle.bills.forEach(bill => {
            if (!groupedBills[bill.group]) {
                groupedBills[bill.group] = [];
            }
            groupedBills[bill.group].push(bill);
        });
        
        // Create a list for each group
        for (let group in groupedBills) {
            let groupTotal = groupedBills[group].reduce((sum, bill) => sum + bill.amount, 0);
            
            let groupHeader = document.createElement("h4");
            groupHeader.className = "text-lg font-semibold text-accent-red dark:text-accent-red flex justify-between mb-2 mt-4";
            groupHeader.innerHTML = `${group} <span>${groupTotal.toFixed(2)}</span>`;
            cycleContent.appendChild(groupHeader);
            
            let ul = document.createElement("ul");
            ul.className = "space-y-2";
            
            groupedBills[group].forEach(bill => {
                let li = document.createElement("li");
                li.className = "flex justify-between items-center py-3 px-4 rounded-lg bg-light-surface dark:bg-dark-surface hover:bg-ui-input dark:hover:bg-dark-card transition-colors cursor-pointer bill-item";
                
                // Add data attribute for bill ID and mark as paid if needed
                li.dataset.billId = bill.id || `cycle-${index}-bill-${bill.name}-${bill.date}`;
                if (bill.paid) {
                    li.classList.add('bill-paid');
                }
                
                const billDate = new Date(bill.date + 'T12:00:00Z');
                
                li.innerHTML = `
                    <span class="flex-grow text-left">
                        <strong class="font-medium">${bill.name}</strong>
                        <div class="text-sm text-light-textSecondary dark:text-dark-textSecondary mt-1">${billDate.toLocaleDateString()}</div>
                    </span>
                    <span class="text-right font-semibold font-mono whitespace-nowrap pl-4 min-w-[120px]">${bill.amount.toFixed(2)}</span>
                `;
                
                // Add click handler to toggle paid status
                li.addEventListener('click', function(e) {
                    // Only toggle if not clicking on a button
                    if (!e.target.closest('button')) {
                        toggleBillPaid(this.dataset.billId);
                    }
                });
                
                ul.appendChild(li);
            });
            
            cycleContent.appendChild(ul);
        }
        
        // Add click handler to toggle button
        toggleButton.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent header click from triggering
            
            const isHidden = !cycleContent.classList.contains('hidden');
            cycleContent.classList.toggle('hidden');
            
            // Update toggle icon
            const iconElem = this.querySelector('.material-icons-round');
            iconElem.textContent = isHidden ? 'expand_more' : 'expand_less';
            
            this.classList.toggle('collapsed');
        });
        
        // Add click handler to header
        cycleHeader.addEventListener('click', function() {
            const isHidden = !cycleContent.classList.contains('hidden');
            cycleContent.classList.toggle('hidden');
            
            // Update toggle icon
            const iconElem = toggleButton.querySelector('.material-icons-round');
            iconElem.textContent = isHidden ? 'expand_more' : 'expand_less';
            
            toggleButton.classList.toggle('collapsed');
        });
        
        // Add elements to pay cycle container
        cycleContainer.appendChild(cycleHeader);
        cycleContainer.appendChild(cycleContent);
        
        // Add pay cycle to container
        cyclesDiv.appendChild(cycleContainer);
    });
    
    // Apply past cycle visibility based on saved preference
    const showPastCycles = localStorage.getItem('showPastCycles') === 'true';
    togglePastPayCycles(showPastCycles);
    
    // Update financial chart
    if (window.financialChart) {
        try {
            window.financialChart.destroy();
        } catch (error) {
            console.log("Chart couldn't be destroyed, creating a new one");
        }
    }
    
    // Wrap chart creation in a try-catch block
    try {
        window.financialChart = createFinancialChart();
    } catch (error) {
        console.error("Error creating chart:", error);
    }
}

// Default to hiding past cycles on first load
document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('showPastCycles') === null) {
        localStorage.setItem('showPastCycles', 'false');
    }
});

// Main initialization
window.onload = function() {
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    // Load group data
    loadGroups();
    updateGroupDropdown();
    updateGroupList();
    
    // Set up the edit bill modal event listeners
    document.getElementById('saveEditBill').addEventListener('click', saveEditBill);
    document.getElementById('cancelEditBill').addEventListener('click', closeEditBillModal);
    document.querySelector('#editBillModal .close').addEventListener('click', closeEditBillModal);
    document.getElementById('editBillModal').addEventListener('click', function(event) {
        if (event.target === this) {
            closeEditBillModal();
        }
    });

    // In your initialization function
    const savedCycles = localStorage.getItem('payCycleData');
    if (savedCycles) {
        payCycles = JSON.parse(savedCycles);
        updatePayCycles(); // Just update the UI, don't regenerate
    } else {
        generatePayCycles(); // Generate new cycles if none are saved
    }

    // Set up edit bill frequency change
    document.getElementById('editBillFrequency').addEventListener('change', function() {
        if (this.value === 'Custom') {
            document.getElementById('customFrequencyModal').style.display = 'flex';
        }
    });

    // Set up group management event listeners
    document.getElementById('addGroupBtn').addEventListener('click', function() {
        openGroupEditModal();
    });
    
    // Group modal events
    document.getElementById('saveGroupEdit').addEventListener('click', saveGroupEdit);
    
    document.getElementById('cancelGroupEdit').addEventListener('click', function() {
        closeGroupEditModal();
    });
    
    // Group modal close button
    document.querySelector('#groupEditModal .close').addEventListener('click', function() {
        closeGroupEditModal();
    });
    
    // Click outside to close
    document.getElementById('groupEditModal').addEventListener('click', function(event) {
        if (event.target === this) {
            closeGroupEditModal();
        }
    });
    
    // Set up theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Load saved data
    if (localStorage.getItem('payCycleStart')) {
        payCycleStart = new Date(localStorage.getItem('payCycleStart'));
        document.getElementById('payCycleStart').value = payCycleStart.toISOString().split('T')[0];
    }
    
    if (localStorage.getItem('payCycleFrequency')) {
        payCycleFrequency = localStorage.getItem('payCycleFrequency');
        document.getElementById('payCycleFrequency').value = payCycleFrequency;
    }
    
    if (localStorage.getItem('payCycleIncome')) {
        payCycleIncome = parseFloat(localStorage.getItem('payCycleIncome'));
        document.getElementById('payCycleIncome').value = payCycleIncome;
    }
    
    let storedData = localStorage.getItem('billData');
    if (storedData) {
        masterBills = JSON.parse(storedData);
    }
    
    // Set up toggle buttons
    const toggleMasterListBtn = document.getElementById('toggleMasterList');
    toggleMasterListBtn.addEventListener('click', function() {
        const container = document.getElementById('masterListContainer');
        const isHidden = container.style.display === 'none';
        container.style.display = isHidden ? 'block' : 'none';
        updateToggleButton(this, !isHidden);
    });
    
    const toggleAllCyclesBtn = document.getElementById('toggleAllCycles');
    toggleAllCyclesBtn.addEventListener('click', function() {
        const allContents = document.querySelectorAll('.cycle-content');
        const allButtons = document.querySelectorAll('.cycle-toggle');
        const allExpanded = this.querySelector('.btn-text').textContent === 'Collapse All';
        
        allContents.forEach(content => {
            content.classList.toggle('hidden', allExpanded);
        });
        
        allButtons.forEach(button => {
            const iconElem = button.querySelector('.material-icons-round');
            iconElem.textContent = allExpanded ? 'expand_more' : 'expand_less';
            button.classList.toggle('collapsed', !allExpanded);
        });
        
        updateToggleAllButton(this, allExpanded);
    });
    
    // Set up file input listener
    document.getElementById('importFileInput').addEventListener('change', importData);
    
    // Set up custom frequency modal
    setupCustomFrequencyModal();
    
    // Add event listener for frequency dropdown
    document.getElementById('billFrequency').addEventListener('change', function() {
        if (this.value === 'Custom') {
            document.getElementById('customFrequencyModal').style.display = 'flex';
        }
    });
    
    updateMasterList();
    generatePayCycles();
    
    // Create financial chart after everything is loaded
    setTimeout(() => {
        window.financialChart = createFinancialChart();
    }, 500);

    // Update chart when theme changes
    document.getElementById('themeToggle').addEventListener('click', function() {
        setTimeout(() => {
            if (window.financialChart) {
                window.financialChart.destroy();
            }
            window.financialChart = createFinancialChart();
        }, 200);
    });
};