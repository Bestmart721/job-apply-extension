// List of company names to blacklist
let blacklist = []; // Add your companies here

// Function to check and highlight the company name if it's in the blacklist
function highlightBlacklistedCompanies() {
    console.log('Highlighting blacklisted companies');
    // Get all company names from the job listings
    let companyElements = []
    if (window.location.hostname.includes('indeed.com')) {
        companyElements = document.querySelectorAll('[data-testid="company-name"]');
    }
    if (window.location.hostname.includes('dice.com')) {
        companyElements = document.querySelectorAll('[data-cy="search-result-company-name"]');
    }
    if (window.location.hostname.includes('builtin.com')) {
        companyElements = document.querySelectorAll('[data-id="company-title"]');
    }

    companyElements.forEach(companyElement => {
        const companyName = companyElement.textContent.trim().replace(/\/|\\|:|\*|\?|"|<|>|\||-/g, '_');
        // If the company is in the blacklist, change its color to red
        if (blacklist.some(blacklistedCompany => blacklistedCompany.toLocaleLowerCase().includes(companyName.toLocaleLowerCase()))) {
            // companyElement.append(' ☠️');
            companyElement.setAttribute("style", "color: red !important;");
        }
    });
}

// Call the function on page load
setTimeout(highlightBlacklistedCompanies, 5000);
// highlightBlacklistedCompanies();
console.log('Extension script loaded');
const eventSource = new EventSource('http://localhost:3000/company-names');

eventSource.onmessage = function (event) {
    const companyName = event.data;
    blacklist.push(companyName);
    highlightBlacklistedCompanies();
};

eventSource.onerror = function (error) {
    console.error('Error:', error);
};

console.log('Content script loaded');

const requestResume = function () {
    let jobTitle = '';
    let companyName = '';
    let jobDetails = '';
    let jobDescription = '';

    if (window.location.hostname.includes('indeed.com')) {
        // Add your actions here for Ctrl+Q event
        jobTitle = (document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]') ||
            document.querySelector('[data-testid="simpler-jobTitle"]')).textContent.replace(' - job post', '');
        companyName = (document.querySelector('[data-testid="inlineHeader-companyName"]') ||
            document.querySelector('.jobsearch-JobInfoHeader-companyNameSimple') || document.querySelector('.jobsearch-JobInfoHeader-companyNameLink')).textContent;
        jobDetails = document.querySelector('#jobDetailsSection') && document.querySelector('#jobDetailsSection').textContent;

        jobDescription = document.querySelector('#jobDescriptionText').textContent;
        jobDescription = jobDescription.replace('\n\n', '\n');
    }
    
    if (window.location.hostname.includes('builtin.com')) {
        jobTitle = document.querySelector('.match-background h1').textContent.trim();
        companyName = document.querySelector('.match-background h2').textContent.trim();
        jobDetails = document.querySelector('.d-flex.flex-column.gap-sm.bg-white.rounded-3.p-md.position-relative.h-100').textContent.trim();
        jobDescription = document.querySelector('.fs-md.fw-regular.mb-md.html-parsed-content').textContent.trim();
        jobDescription = jobDescription.replace('\n\n', '\n');
    }

    console.log(jobTitle);
    console.log(companyName);
    console.log(jobDetails);
    console.log(jobDescription);

    const currentUrl = window.location.href;
    console.log('Current URL:', currentUrl);
    const urlParams = new URLSearchParams(window.location.search);
    const vjk = urlParams.get('vjk');
    console.log('vjk:', vjk);

    fetch('http://localhost:3000/indeed-extension', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            jobTitle,
            companyName,
            jobDetails,
            jobDescription,
            vjk
        })
    }).then(response => {
        console.log('Response:', response);
    }).catch(error => {
        console.error('Error:', error);
    });

    const showMoreElement = Array.from(document.querySelectorAll('*')).find(el => el.textContent.trim() === 'Apply now' && el.nodeName === 'BUTTON');
    if (showMoreElement) {
        console.log('Found the element:', showMoreElement);
        const evt = new MouseEvent('click', {
            bubbles: true,    // if you want the event to bubble up through the DOM
            cancelable: true, // if you want the event to be cancellable
            ctrlKey: true     // simulate Ctrl + Click
        });
        showMoreElement.dispatchEvent(evt);
    } else {
        console.log('Show more element not found');
    }
}

document.addEventListener('keydown', (e) => {
    let keys = [];
    if (e.ctrlKey) keys.push('Ctrl');
    if (e.altKey) keys.push('Alt');
    if (e.shiftKey) keys.push('Shift');
    if (e.metaKey) keys.push('Meta');
    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
        keys.push(e.key);
    }

    const currentCombo = keys.join(' + ');

    chrome.storage.local.get('hotkey', (result) => {
        const saved = result.hotkey;
        console.log('Current combo:', currentCombo);
        console.log('Saved combo:', saved);
        if (currentCombo === saved) {
            showNotification('Requesting resume...');
            requestResume();
        }
    });
});

function showNotification(message) {
    const bubble = document.createElement('div');
    bubble.textContent = message;
    Object.assign(bubble.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: '#333',
        color: '#fff',
        padding: '10px 15px',
        borderRadius: '8px',
        zIndex: 9999,
        fontSize: '14px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        transition: 'opacity 0.3s ease',
    });

    document.body.appendChild(bubble);

    setTimeout(() => {
        bubble.style.opacity = '0';
        setTimeout(() => bubble.remove(), 300);
    }, 2000);
}
