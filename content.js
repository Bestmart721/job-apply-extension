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
    if (window.location.hostname.includes('welcometothejungle.com')) {
        companyElements = document.querySelectorAll('[data-testid="job-title"]>a');
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

let serverUrl = 'http://localhost:3000'; // Default server URL
let hotkey = 'Ctrl + Q'; // Default hotkey
let isHost = false; // Default isHost value

// highlightBlacklistedCompanies();
console.log('Extension script loaded');
let eventSource;

function setEventSource(url) {
    fetch(url, {
        headers: {
            'ngrok-skip-browser-warning': 'true'
        }
    })
    .then(response => response.json())
    .then(data => {
        data.forEach(companyName => {
            blacklist.push(companyName);
        });
        highlightBlacklistedCompanies();
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

console.log('Content script loaded');

chrome.storage.local.get(['hotkey', 'serverUrl', 'isHost'], (result) => {
    if (result.hotkey) {
        hotkey = result.hotkey;
        console.log('Loaded hotkey:', hotkey);
    }
    if (result.serverUrl) {
        serverUrl = result.serverUrl.endsWith('/') ? result.serverUrl.slice(0, -1) : result.serverUrl;
        console.log('Loaded server URL:', serverUrl);
        setEventSource(serverUrl + '/company-names');
    }
    if (result.isHost) {
        isHost = result.isHost;
        console.log('Loaded isHost:', isHost);
    }
});

// Listen for changes to serverUrl in chrome.storage.local
chrome.storage.onChanged.addListener((changes, namespace) => {
    console.log('Changes in storage:', changes, namespace);
    if (namespace === 'local' && changes.serverUrl) {
        serverUrl = changes.serverUrl.newValue.endsWith('/') ? changes.serverUrl.newValue.slice(0, -1) : changes.serverUrl.newValue;
        console.log('Updated server URL:', serverUrl);
        setEventSource(serverUrl + '/company-names');
    }
    if (namespace === 'local' && changes.hotkey) {
        hotkey = changes.hotkey.newValue;
        console.log('Updated hotkey:', hotkey);
    }
    if (namespace === 'local' && changes.isHost) {
        isHost = changes.isHost.newValue;
        console.log('Updated isHost:', isHost);
    }
});

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

    if (currentCombo === hotkey) {
        requestResume();
        if (isHost) {
            showNotification('Resume requested! (Host)');
        }
    }
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
        jobDetails = document.querySelector('.d-flex.flex-column.gap-sm.bg-white.rounded-3.p-md.position-relative.h-100').textContent.trim().replace(/\s+/g, ' ')
        jobDescription = document.querySelector('.fs-md.fw-regular.mb-md.html-parsed-content').textContent.trim();
        jobDescription = jobDescription.replace('\n\n', '\n');
    }

    if (window.location.hostname.includes('app.welcometothejungle.com')) {
        jobTitle = document.querySelector('[data-testid="job-title"]').childNodes[0].textContent.trim();
        companyName = document.querySelector('[data-testid="job-title"]>a').textContent.trim();
        jobDetails = document.querySelector('[data-testid="job-section"]').children[1].textContent.trim().replace(/\s+/g, ' ').replace('\n', ' ');
        jobDescription = document.querySelector('[data-testid="job-card-main"]').textContent.trim();
    }

    console.log(jobTitle);
    console.log(companyName);
    console.log(jobDetails);
    console.log(jobDescription);

    // return;

    const currentUrl = window.location.href;
    console.log('Current URL:', currentUrl);
    const urlParams = new URLSearchParams(window.location.search);

    console.log(isHost)
    fetch((isHost ? serverUrl : 'http://localhost:4321') + '/job-apply-extension', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': true
        },
        body: JSON.stringify({
            jobTitle,
            companyName,
            jobDetails,
            jobDescription,
            url: currentUrl,
        })
    }).then(response => {
        console.log('Response:', response);
        if (isHost) {
            showNotification('Resume generated! (Local)');
        } else {
            showNotification('Resume requested!');
        }
    }).catch(error => {
        console.error('Error:', error);
        if (isHost) {
            showNotification('Resume generation warning! (Local)');
        } else {
            showNotification('Resume request failed!');
        }
    });

    // const showMoreElement = Array.from(document.querySelectorAll('*')).find(el => el.textContent.trim() === 'Apply now' && el.nodeName === 'BUTTON');
    // if (showMoreElement) {
    //     console.log('Found the element:', showMoreElement);
    //     const evt = new MouseEvent('click', {
    //         bubbles: true,    // if you want the event to bubble up through the DOM
    //         cancelable: true, // if you want the event to be cancellable
    //         ctrlKey: true     // simulate Ctrl + Click
    //     });
    //     showMoreElement.dispatchEvent(evt);
    // } else {
    //     console.log('Show more element not found');
    // }
}