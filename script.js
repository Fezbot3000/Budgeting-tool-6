// Trigger file input dialog for import
function triggerImportDialog() {
    document.getElementById('importFileInput').click();
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
}// Initialize variables and load data from local storage
let masterBills = [];
let payCycles = [];
let payCycleStart = new Date();
let payCycleFrequency = 'Fortnightly';
let payCycleIncome = 0;
let customFrequencySettings = null;

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

// Helper function to check if a date is the last day of its month
function isLastDayOfMonth(date) {
    const d = new Date(date);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return d.getDate() === lastDay;
}

// Helper function to get the last day of a month
function getLastDayOfMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

// Helper function to advance a date by one month, with special handling for month-end dates
function addOneMonth(date) {
    // Create a new date object to avoid modifying the original
    const d = new Date(date.getTime());
    
    // Check if this is the 31st or the last day of the month
    const originalDay = d.getDate();
    const isLast = isLastDayOfMonth(d);
    const is31st = originalDay === 31;
    
    // Store current year and month
    const currentYear = d.getFullYear();
    const currentMonth = d.getMonth();
    
    // Calculate next month
    let nextMonth = (currentMonth + 1) % 12;
    let nextYear = nextMonth === 0 ? currentYear + 1 : currentYear;
    
    // For 31st or last day of month, always use the last day of the next month
    if (is31st || isLast) {
        // Get the last day of the next month
        const lastDayOfNextMonth = getLastDayOfMonth(nextYear, nextMonth);
        
        // Create a new date on the last day of next month
        // Use noon to avoid timezone issues
        const result = new Date(Date.UTC(nextYear, nextMonth, lastDayOfNextMonth, 12, 0, 0));
        
        return result;
    } else {
        // For normal days, handle month length differences
        const lastDayOfNextMonth = getLastDayOfMonth(nextYear, nextMonth);
        const targetDay = Math.min(originalDay, lastDayOfNextMonth);
        
        // Create a new date on the target day
        // Use noon to avoid timezone issues
        const result = new Date(Date.UTC(nextYear, nextMonth, targetDay, 12, 0, 0));
        
        return result;
    }
}

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
    
    // Create chart
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.slice(0, displayCount),
            datasets: [
                {
                    label: 'Income',
                    data: incomeData.slice(0, displayCount),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Expenses',
                    data: expensesData.slice(0, displayCount),
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Balance',
                    data: balanceData.slice(0, displayCount),
                    type: 'line',
                    fill: false,
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    tension: 0.1,
                    pointBackgroundColor: function(context) {
                        const index = context.dataIndex;
                        const value = context.dataset.data[index];
                        return value >= 0 ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)';
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
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Pay Cycles'
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

// Update the toggle button to match the blue style in the screenshots
function updateToggleButton(button, isHidden) {
    const iconElem = button.querySelector('.material-icons-round');
    const textElem = button.querySelector('.btn-text');
    
    if (isHidden) {
        button.style.backgroundColor = '#e1f1fd'; // Light blue background
        button.style.color = '#0066cc'; // Blue text
        iconElem.textContent = 'visibility';
        textElem.textContent = 'Show List';
    } else {
        button.style.backgroundColor = '#e1f1fd'; // Light blue background 
        button.style.color = '#0066cc'; // Blue text
        iconElem.textContent = 'visibility_off';
        textElem.textContent = 'Hide List';
    }
}

// Update the toggle all cycles button to match the blue style in the screenshots
function updateToggleAllButton(button, isCollapsed) {
    const iconElem = button.querySelector('.material-icons-round');
    const textElem = button.querySelector('.btn-text');
    
    button.style.backgroundColor = '#e1f1fd'; // Light blue background
    button.style.color = '#0066cc'; // Blue text
    
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
    // Fix the balance colors in the financial info sections
    document.querySelectorAll('.financial-info p.positive-balance span').forEach(elem => {
        elem.style.color = 'green';
    });
    
    document.querySelectorAll('.financial-info p.negative-balance span').forEach(elem => {
        elem.style.color = 'red';
    });
}

// Show a temporary snackbar message
function showSnackbar(message) {
    // Create snackbar if it doesn't exist
    let snackbar = document.getElementById('snackbar');
    if (!snackbar) {
        snackbar = document.createElement('div');
        snackbar.id = 'snackbar';
        document.body.appendChild(snackbar);
        
        // Add styles if not in the CSS
        if (!document.querySelector('style#snackbar-styles')) {
            const style = document.createElement('style');
            style.id = 'snackbar-styles';
            style.textContent = `
                #snackbar {
                    visibility: hidden;
                    min-width: 250px;
                    background-color: var(--md-secondary);
                    color: var(--md-on-secondary);
                    text-align: center;
                    border-radius: var(--md-shape-small);
                    padding: 16px;
                    position: fixed;
                    z-index: 1001;
                    left: 50%;
                    bottom: 30px;
                    transform: translateX(-50%);
                    box-shadow: var(--md-elevation-level3);
                }
                
                #snackbar.show {
                    visibility: visible;
                    animation: fadein 0.5s, fadeout 0.5s 2.5s;
                }
                
                @keyframes fadein {
                    from {bottom: 0; opacity: 0;}
                    to {bottom: 30px; opacity: 1;}
                }
                
                @keyframes fadeout {
                    from {bottom: 30px; opacity: 1;}
                    to {bottom: 0; opacity: 0;}
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Set message and show
    snackbar.textContent = message;
    snackbar.className = 'show';
    
    // Hide after 3 seconds
    setTimeout(function() {
        snackbar.className = snackbar.className.replace('show', '');
    }, 3000);
}

window.onload = function() {
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    
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
            document.getElementById('customFrequencyModal').style.display = 'block';
        }
    });
    
    // Style UI elements to match screenshots
    const exportBtn = document.querySelector('.data-btn:not(.import-btn)');
    const importBtn = document.querySelector('.import-btn');
    
    if (exportBtn) {
        exportBtn.style.backgroundColor = '#f7e8ff'; // Light purple
        exportBtn.style.color = '#6200ee'; // Purple
    }
    
    if (importBtn) {
        importBtn.style.backgroundColor = '#e1f1fd'; // Light blue
        importBtn.style.color = '#0066cc'; // Blue
    }
    
    // Style the Add Bill button to match the screenshot
    const addBillBtn = document.querySelector('.add-bill-btn');
    if (addBillBtn) {
        addBillBtn.style.backgroundColor = '#006eb8'; // Blue from screenshot
    }
    
    // Apply initial styles to control buttons
    if (toggleMasterListBtn) {
        toggleMasterListBtn.style.backgroundColor = '#e1f1fd'; // Light blue background
        toggleMasterListBtn.style.color = '#0066cc'; // Blue text
        
        // Set initial icon and text
        const iconElem = toggleMasterListBtn.querySelector('.material-icons-round');
        const textElem = toggleMasterListBtn.querySelector('.btn-text');
        if (iconElem && textElem) {
            iconElem.textContent = 'visibility_off';
            textElem.textContent = 'Hide List';
        }
    }
    
    if (toggleAllCyclesBtn) {
        toggleAllCyclesBtn.style.backgroundColor = '#e1f1fd'; // Light blue background
        toggleAllCyclesBtn.style.color = '#0066cc'; // Blue text
        
        // Set initial icon and text
        const iconElem = toggleAllCyclesBtn.querySelector('.material-icons-round');
        const textElem = toggleAllCyclesBtn.querySelector('.btn-text');
        if (iconElem && textElem) {
            iconElem.textContent = 'expand_less';
            textElem.textContent = 'Collapse All';
        }
    }
    
    updateMasterList();
    generatePayCycles();
    
    // Fix balance colors after a short delay to ensure DOM is updated
    setTimeout(fixBalanceColors, 100);
    
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

// Add a new bill to the master list
function addBill() {
    let name = document.getElementById("billName").value;
    let amount = parseFloat(document.getElementById("billAmount").value);
    let date = document.getElementById("billDate").value;
    let frequency = document.getElementById("billFrequency").value;
    let group = document.getElementById("billGroup").value;
    
    if (name && amount && date && frequency && group) {
        // For custom frequency, save the settings with the bill
        let billData = { name, amount, date, frequency, group };
        
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
        
        const billDate = new Date(bill.date + 'T12:00:00Z');
        
        li.innerHTML = `
            <span class="bill-details">
                <strong>${bill.name}</strong>
                <div class="bill-subtext">${billDate.toLocaleDateString()} (${frequencyDisplay})</div>
            </span>
            <span class="bill-amount">$${bill.amount.toFixed(2)}</span>
        `;
        
        let deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.innerHTML = '<span class="material-icons-round">delete</span>';
        deleteButton.setAttribute('aria-label', 'Delete bill');
        deleteButton.onclick = function() {
            if (confirm(`Are you sure you want to delete "${bill.name}"?`)) {
                masterBills.splice(index, 1);
                localStorage.setItem('billData', JSON.stringify(masterBills));
                updateMasterList();
                generatePayCycles();
                showSnackbar("Bill deleted");
            }
        };
        
        li.appendChild(deleteButton);
        list.appendChild(li);
    });
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

// Generate all upcoming pay cycles
function generatePayCycles() {
    payCycles = [];
    let cycleStart = new Date(payCycleStart);
    
    // Generate pay cycles
    for (let i = 0; i < 26; i++) {
        let cycleEnd = new Date(cycleStart);
        
        // Set cycle end date based on frequency
        if (payCycleFrequency === 'Monthly') {
            cycleEnd.setMonth(cycleEnd.getMonth() + 1);
        } else { // Fortnightly
            cycleEnd.setDate(cycleStart.getDate() + 14);
        }
        
        // Adjust the end date to be one day before the next cycle starts
        cycleEnd.setDate(cycleEnd.getDate() - 1);
        
        let cycleBills = [];
        
        // Process each bill
        masterBills.forEach(bill => {
            // Clone the original bill date
            let currentBillDate = new Date(bill.date);
            
            // Check if this is a 31st day bill
            const is31st = currentBillDate.getDate() === 31;
            
            // Find the first occurrence on or after the first cycle
            if (i === 0) {
                // For first cycle, use the original date
            } else {
                // For subsequent cycles, calculate based on frequency
                let checkDate = new Date(bill.date);
                let cycleCount = 0;
                
                while (checkDate < cycleStart) {
                    if (bill.frequency === 'Monthly') {
                        checkDate = addOneMonth(checkDate);
                        cycleCount++;
                    } else if (bill.frequency === 'Fortnightly') {
                        checkDate.setDate(checkDate.getDate() + 14);
                        cycleCount++;
                    } else if (bill.frequency === 'Yearly') {
                        // Add a year to the date
                        checkDate.setFullYear(checkDate.getFullYear() + 1);
                        cycleCount++;
                    } else if (bill.frequency === '6-Monthly') {
                        // Add 6 months - use addOneMonth 6 times
                        for (let i = 0; i < 6; i++) {
                            checkDate = addOneMonth(checkDate);
                        }
                        cycleCount++;
                    } else if (bill.frequency === 'Custom' && bill.customFrequency) {
                        const cf = bill.customFrequency;
                        
                        if (cf.unit === 'days') {
                            checkDate.setDate(checkDate.getDate() + cf.value);
                        } else if (cf.unit === 'weeks') {
                            // Move forward by the specified number of weeks
                            checkDate.setDate(checkDate.getDate() + (cf.value * 7));
                            
                            // If specific days of week are selected, find the next matching day
                            if (cf.days && cf.days.length > 0) {
                                let dayFound = false;
                                let maxDaysToCheck = 7; // To avoid infinite loop
                                
                                while (!dayFound && maxDaysToCheck > 0) {
                                    if (cf.days.includes(checkDate.getDay())) {
                                        dayFound = true;
                                    } else {
                                        checkDate.setDate(checkDate.getDate() + 1);
                                        maxDaysToCheck--;
                                    }
                                }
                            }
                        } else if (cf.unit === 'months') {
                            // Add the specified number of months
                            for (let i = 0; i < cf.value; i++) {
                                checkDate = addOneMonth(checkDate);
                            }
                        } else if (cf.unit === 'years') {
                            checkDate.setFullYear(checkDate.getFullYear() + cf.value);
                        }
                        
                        cycleCount++;
                    } else {
                        // One-off bill before this cycle - skip it
                        break;
                    }
                }
                
                currentBillDate = new Date(checkDate);
            }
            
            // Check if this bill occurs in this cycle
            if (currentBillDate >= cycleStart && currentBillDate <= cycleEnd) {
                // Make sure we're using UTC dates to avoid timezone issues
                const formattedDate = new Date(currentBillDate.getTime() - (currentBillDate.getTimezoneOffset() * 60000))
                    .toISOString().split('T')[0];
                
                cycleBills.push({
                    ...bill,
                    date: formattedDate
                });
            }
            
            // Add any additional occurrences in this cycle (for frequent bills)
            if (bill.frequency === 'Fortnightly') {
                let nextDate = new Date(currentBillDate);
                nextDate.setDate(nextDate.getDate() + 14);
                
                if (nextDate <= cycleEnd) {
                    cycleBills.push({
                        ...bill,
                        date: nextDate.toISOString().split('T')[0]
                    });
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
        let nextCycleStart = new Date(cycleEnd);
        nextCycleStart.setDate(nextCycleStart.getDate() + 1);
        cycleStart = nextCycleStart;
    }
    
    updatePayCycles();
}

// Update the displayed pay cycles
// Update the displayed pay cycles
function updatePayCycles() {
    let cyclesDiv = document.getElementById("payCycles");
    cyclesDiv.innerHTML = "";
    
    payCycles.forEach((cycle, index) => {
        // Calculate financial details
        let total = cycle.bills.reduce((sum, bill) => sum + bill.amount, 0);
        let balance = cycle.income - total;
        let balanceClass = balance >= 0 ? 'positive-balance' : 'negative-balance';
        
        // Create pay cycle container
        let cycleContainer = document.createElement("div");
        cycleContainer.className = "pay-cycle";
        
        // Create cycle header
        let cycleHeader = document.createElement("div");
        cycleHeader.className = "cycle-header";
        
        // Format dates nicely
        const startDate = new Date(cycle.cycleStart);
        const endDate = new Date(cycle.cycleEnd);
        const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        const formattedStartDate = startDate.toLocaleDateString(undefined, dateOptions);
        const formattedEndDate = endDate.toLocaleDateString(undefined, dateOptions);
        
        // Add content to header
        let headerContent = document.createElement("div");
        headerContent.innerHTML = `
            <h3>${index + 1} (${formattedStartDate} - ${formattedEndDate})</h3>
            <div class="financial-info">
                <p>Income: <span>$${cycle.income.toFixed(2)}</span></p>
                <p>Expenses: <span>$${total.toFixed(2)}</span></p>
                <p class="${balanceClass}">Balance: <span>$${balance.toFixed(2)}</span></p>
            </div>
        `;
        
        // Add toggle button with Material icon
        let toggleButton = document.createElement("button");
        toggleButton.className = "toggle-btn cycle-toggle";
        toggleButton.innerHTML = '<span class="material-icons-round">expand_more</span>';
        
        if (index !== 0) {
            toggleButton.classList.add("collapsed");
        }
        
        // Add elements to header
        cycleHeader.appendChild(headerContent);
        cycleHeader.appendChild(toggleButton);
        
        // Create cycle content
        let cycleContent = document.createElement("div");
        cycleContent.className = "cycle-content";
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
            groupHeader.innerHTML = `${group} <span>$${groupTotal.toFixed(2)}</span>`;
            cycleContent.appendChild(groupHeader);
            
            let ul = document.createElement("ul");
            
            groupedBills[group].forEach(bill => {
                let li = document.createElement("li");
                const billDate = new Date(bill.date + 'T12:00:00Z');
                
                li.innerHTML = `
                    <span class="bill-details">
                        <strong>${bill.name}</strong>
                        <div class="bill-subtext">${billDate.toLocaleDateString()}</div>
                    </span>
                    <span class="bill-amount">$${bill.amount.toFixed(2)}</span>
                `;
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
    
    // Apply fixed colors to balance after cycles are rendered
    fixBalanceColors();
    
    // Update financial chart - FIXED THE ERROR IN THIS SECTION
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

// Export data to a JSON file
function exportData() {
    // Create data object with all stored information
    const exportData = {
        payCycleStart: localStorage.getItem('payCycleStart'),
        payCycleFrequency: localStorage.getItem('payCycleFrequency'),
        payCycleIncome: localStorage.getItem('payCycleIncome'),
        billData: localStorage.getItem('billData')
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