// Initialize variables and load data from local storage
let masterBills = [];
let payCycles = [];
let payCycleStart = new Date();
let payCycleFrequency = 'Fortnightly';
let payCycleIncome = 0;

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

window.onload = function() {
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
    document.getElementById('toggleMasterList').addEventListener('click', function() {
        const container = document.getElementById('masterListContainer');
        container.style.display = container.style.display === 'none' ? 'block' : 'none';
        this.textContent = container.style.display === 'none' ? 'Show List' : 'Hide List';
    });
    
    document.getElementById('toggleAllCycles').addEventListener('click', function() {
        const allContents = document.querySelectorAll('.cycle-content');
        const allButtons = document.querySelectorAll('.cycle-toggle');
        const allExpanded = this.textContent === 'Collapse All';
        
        allContents.forEach(content => {
            content.classList.toggle('hidden', allExpanded);
        });
        
        allButtons.forEach(button => {
            button.classList.toggle('collapsed', !allExpanded);
        });
        
        this.textContent = allExpanded ? 'Expand All' : 'Collapse All';
    });
    
    // Set up file input listener
    document.getElementById('importFileInput').addEventListener('change', importData);
    
    updateMasterList();
    generatePayCycles();
};

// Add a new bill to the master list
function addBill() {
    let name = document.getElementById("billName").value;
    let amount = parseFloat(document.getElementById("billAmount").value);
    let date = document.getElementById("billDate").value;
    let frequency = document.getElementById("billFrequency").value;
    let group = document.getElementById("billGroup").value;
    
    if (name && amount && date && frequency && group) {
        masterBills.push({ name, amount, date, frequency, group });
        localStorage.setItem('billData', JSON.stringify(masterBills));
        
        // Clear form fields
        document.getElementById("billName").value = "";
        document.getElementById("billAmount").value = "";
        
        updateMasterList();
        generatePayCycles();
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
        li.innerHTML = `
            <span class="bill-details">${bill.name} - ${new Date(bill.date + 'T12:00:00Z').toLocaleDateString()}</span>
            <span class="bill-amount">$${bill.amount.toFixed(2)}</span>
        `;
        
        let deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = function() {
            masterBills.splice(index, 1);
            localStorage.setItem('billData', JSON.stringify(masterBills));
            updateMasterList();
            generatePayCycles();
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
        
        // Next cycle starts where this one ended
        cycleStart = new Date(cycleEnd);
    }
    
    updatePayCycles();
}

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
        
        // Add content to header
        let headerContent = document.createElement("div");
        headerContent.innerHTML = `
            <h3>Pay Cycle ${index + 1} (${cycle.cycleStart} - ${cycle.cycleEnd})</h3>
            <div class="financial-info">
                <p>Income: <span>${cycle.income.toFixed(2)}</span></p>
                <p>Expenses: <span>${total.toFixed(2)}</span></p>
                <p class="${balanceClass}">Balance: <span>${balance.toFixed(2)}</span></p>
            </div>
        `;
        
        // Add toggle button
        let toggleButton = document.createElement("button");
        toggleButton.className = "toggle-btn cycle-toggle";
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
            toggleButton.textContent = "+";
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
            groupHeader.innerHTML = `${group} <span style="float: right;">${groupTotal.toFixed(2)}</span>`;
            cycleContent.appendChild(groupHeader);
            
            let ul = document.createElement("ul");
            
            groupedBills[group].forEach(bill => {
                let li = document.createElement("li");
                li.innerHTML = `
                    <span class="bill-details">${bill.name} - ${new Date(bill.date + 'T12:00:00Z').toLocaleDateString()}</span>
                    <span class="bill-amount">$${bill.amount.toFixed(2)}</span>
                `;
                ul.appendChild(li);
            });
            
            cycleContent.appendChild(ul);
        }
        
        // Add click handler to toggle button
        toggleButton.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent header click from triggering
            cycleContent.classList.toggle('hidden');
            this.classList.toggle('collapsed');
        });
        
        // Add click handler to header
        cycleHeader.addEventListener('click', function() {
            cycleContent.classList.toggle('hidden');
            toggleButton.classList.toggle('collapsed');
        });
        
        // Add elements to pay cycle container
        cycleContainer.appendChild(cycleHeader);
        cycleContainer.appendChild(cycleContent);
        
        // Add pay cycle to container
        cyclesDiv.appendChild(cycleContainer);
    });
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
    
    alert('Data exported successfully!');
}

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
                alert('Data imported successfully! The page will now reload.');
                location.reload();
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