// List of company names to blacklist
let blacklist = []; // Add your companies here
// let serverUrl = 'https://localhost:5000'; // Default server URL
let serverUrl = 'https://rfh20urlth.execute-api.us-east-2.amazonaws.com'; // Default server URL

let settings = {
    profileKey: '', // Default profileKey
    selectkey: 'Ctrl + `', // Default selectkey
    smartkey: 'Ctrl + Q', // Default smartkey
    downloadJD: false // Default downloadJD value
};

// highlightBlacklistedCompanies();
console.log('Extension script loaded');
let eventSource;

function requestCompanyList(profileKey) {
    profileKey = profileKey.trim();
    if (!profileKey || profileKey.length !== 36) {
        chrome.storage.local.set({ profileName: 'Unknown Profile' });
        blacklist = [];
        return;
    }

    console.log('Requesting company list with profileKey:', profileKey);
    fetch(`${serverUrl}/company-names`, {
        headers: {
            'profileKey': profileKey,
            'ngrok-skip-browser-warning': true,
            'Content-Type': 'application/json'
        }
    }).then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    }).then(data => {
        const { profileName, companyNames } = data;
        companyNames.forEach(company_name => {
            blacklist.push(company_name);
        });
        chrome.storage.local.set({ profileName });
        highlightBlacklistedCompanies();
    }).catch(error => {
        chrome.storage.local.set({ profileName: 'Failed to load profile' });
        blacklist = [];
        console.error('Error:', error);
    });
}

console.log('Content script loaded');

chrome.storage.local.get((result) => {
    console.log('Loaded settings from storage:', result);
    settings = { ...settings, ...result };
    if (result.profileKey) {
        requestCompanyList(result.profileKey.trim());
    }
});

// Listen for changes to profileKey in chrome.storage.local
chrome.storage.onChanged.addListener((changes, namespace) => {
    console.log('Changes in storage:', changes, namespace);
    if (namespace === 'local') {
        Object.keys(changes).forEach(key => {
            settings[key] = changes[key].newValue;
        });
        if (changes.profileKey) {
            requestCompanyList(changes.profileKey.newValue.trim());
        }
    }
});

document.addEventListener('keydown', (e) => {
    let keys = [];
    if (e.ctrlKey) keys.push('Ctrl');
    if (e.altKey) keys.push('Alt');
    if (e.shiftKey) keys.push('Shift');
    if (e.metaKey) keys.push('Meta');
    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
        let key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
        keys.push(key);
    }

    const currentCombo = keys.join(' + ');
    if (currentCombo === settings.smartkey) {
        selectSmartJD();
    }

    if (currentCombo === settings.selectkey) {
        selectSelectJD();
    }
});

function showNotification(type, message, options) {
    const bubble = document.createElement('div');
    bubble.textContent = message;
    let backgroundColor = '#333';
    if (type === 'success') backgroundColor = '#198754'; // Bootstrap 5 success
    else if (type === 'error') backgroundColor = '#dc3545'; // Bootstrap 5 danger
    else if (type === 'warning' || type === 'warn') backgroundColor = '#ffc107'; // Bootstrap 5 warning
    else if (type === 'info') backgroundColor = '#0dcaf0'; // Bootstrap 5 info

    Object.assign(bubble.style, {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: backgroundColor,
        color: '#fff',
        padding: '10px 15px',
        borderRadius: '8px',
        zIndex: 9999,
        fontSize: '14px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        transition: 'opacity 0.3s ease',
        opacity: '1',
        maxWidth: '80vw',
        textAlign: 'center',
        fontWeight: 'bold',
    });

    document.body.appendChild(bubble);

    chrome.runtime.sendMessage({
        type, message, options
    });

    setTimeout(() => {
        bubble.style.opacity = '0';
        setTimeout(() => bubble.remove(), 300);
    }, 5000);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "proceedWarning") {
        // Handle proceedWarning logic here
        console.log("Background received proceedWarning:", message.options);
        // Optionally send a response
        // sendResponse({ status: "proceeded" });
    }
    if (message.type === "cancelWarning") {
        // Handle cancelWarning logic here
        console.log("Background received cancelWarning");
        // Optionally send a response
        // sendResponse({ status: "cancelled" });
    }
    // Return true if you want to send a response asynchronously
});

// document.addEventListener('keydown', (e) => {
//     if (e.ctrlKey && e.key === '`') {
//         const selectedText = window.getSelection().toString();
//         const showLength = 50;
//         let displayText = selectedText.length > showLength ? selectedText.slice(0, showLength) + '...' : selectedText;
//         console.log('Display text:', displayText);
//         showNotification('Selected text: ' + displayText);
//     }
// });

const selectSelectJD = function () {
    const selectedText = window.getSelection().toString();
    const showLength = 50;
    let displayText = selectedText.length > showLength ? selectedText.slice(0, showLength) + '...' : selectedText;
    console.log('Display text:', displayText);
    if (!selectedText) {
        showNotification('error', 'No text selected. Please select some text.');
        return;
    }
    // showNotification('info', 'Selected text: ' + displayText);

    const currentUrl = window.location.href;
    console.log('Current URL:', currentUrl);

    requestResume(selectedText, currentUrl);
    showNotification('info', 'Requested with select key.');
}

const selectSmartJD = function () {
    let job_title = '';
    let company_name = '';
    let jobDetails = '';
    let jobDescription = '';

    if (window.location.hostname.includes('indeed.com')) {
        // Add your actions here for Ctrl+Q event
        job_title = (document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]') ||
            document.querySelector('[data-testid="simpler-job_title"]')).textContent.replace(' - job post', '');
        company_name = (document.querySelector('[data-testid="inlineHeader-company_name"]') ||
            document.querySelector('.jobsearch-JobInfoHeader-company_nameSimple') || document.querySelector('.jobsearch-JobInfoHeader-company_nameLink')).textContent;
        jobDetails = document.querySelector('#jobDetailsSection') && document.querySelector('#jobDetailsSection').textContent;

        jobDescription = document.querySelector('#jobDescriptionText').textContent;
        jobDescription = jobDescription.replace('\n\n', '\n');
    }

    if (window.location.hostname.includes('builtin.com')) {
        job_title = document.querySelector('.match-background h1').textContent.trim();
        company_name = document.querySelector('.match-background h2').textContent.trim();
        jobDetails = document.querySelector('.d-flex.flex-column.gap-sm.bg-white.rounded-3.p-md.position-relative.h-100').textContent.trim().replace(/\s+/g, ' ')
        jobDescription = document.querySelector('.fs-md.fw-regular.mb-md.html-parsed-content').textContent.trim();
        jobDescription = jobDescription.replace('\n\n', '\n');
    }

    if (window.location.hostname.includes('app.welcometothejungle.com')) {
        job_title = document.querySelector('[data-testid="job-title"]').childNodes[0].textContent.trim();
        company_name = document.querySelector('[data-testid="job-title"]>a').textContent.trim();
        jobDetails = document.querySelector('[data-testid="job-section"]').children[1].textContent.trim().replace(/\s+/g, ' ').replace('\n', ' ');
        jobDescription = document.querySelector('[data-testid="job-card-main"]').textContent.trim();
    }

    console.log(job_title);
    console.log(company_name);

    // return;

    const currentUrl = window.location.href;
    console.log('Current URL:', currentUrl);
    const urlParams = new URLSearchParams(window.location.search);

    requestResume(jobDescription, currentUrl, job_title, company_name, jobDetails);
    showNotification('info', 'Requested with smart key.');

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

function requestResume(jobDescription, url = '', job_title = '', company_name = '', jobDetails = '') {
    fetch(serverUrl + '/request', {
        method: 'POST',
        headers: {
            'profileKey': settings.profileKey || '',
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': true
        },
        body: JSON.stringify({
            job_title,
            company_name,
            jobDetails,
            jobDescription,
            url,
        })
    }).then(async response => {
        const data = await response.json();
        if (response.status === 200) {
            if (data.status === 'success') {
                console.log('Response data:', data);
                // data should have resumeUrl and jdUrl (URLs to download)
                if (data.resumeUrl) {
                    download(data.resumeUrl, data.resumeUrl.split('/').pop() || 'resume.docx');
                }
                if (data.jdUrl && settings.downloadJD) {
                    download(data.jdUrl, data.jdUrl.split('/').pop() || 'job-description.txt');
                }
                showNotification('success', 'Files downloaded.');
            } else if (data.status === 'warning') {
                console.warn('Warning from server:', data.message);
                showNotification('warning', 'Warning: ' + data.message, {
                    job_title,
                    company_name,
                    jobDetails,
                    jobDescription,
                    url,
                });
            }
        } else {
            showNotification('warning', 'Request failed: ' + data.message || response.statusText, {
                job_title,
                company_name,
                jobDetails,
                jobDescription,
                url,
            });
        }
    }).catch((error, a, b) => {
        showNotification('error', 'Request failed: ' + error.message);
    });
}

function download(url, filename) {
    fetch(`${serverUrl}/files?path=${encodeURIComponent(url)}`)
        .then(response => response.blob())
        .then(blob => {
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename || url.split('/').pop() || 'download';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        });
}

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
        const company_name = companyElement.textContent.trim().replace(/\/|\\|:|\*|\?|"|<|>|\||-/g, '_');
        // If the company is in the blacklist, change its color to red
        if (blacklist.some(blacklistedCompany => blacklistedCompany.toLocaleLowerCase().includes(company_name.toLocaleLowerCase()))) {
            // companyElement.append(' ☠️');
            companyElement.setAttribute("style", "color: red !important;");
        }
    });
}

// Call the function on page load
setTimeout(highlightBlacklistedCompanies, 5000);