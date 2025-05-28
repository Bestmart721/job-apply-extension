const profileKeyInput = document.getElementById('profileKey')
const selectkeyInput = document.getElementById('selectkey');
const smartkeyInput = document.getElementById('smartkey');
const jdCheckbox = document.getElementById('downloadJD');
const form = document.getElementById('settingsForm');
const profileNameElement = document.getElementById('profileName');

// Load saved smartkey and profile Key on popup open
chrome.storage.local.get((result) => {
    if (result.profileName) {
        profileNameElement.textContent = result.profileName;
    }
    if (result.selectkey) {
        selectkeyInput.value = result.selectkey;
        console.log('Loaded selectkey:', result.selectkey);
    }
    if (result.smartkey) {
        smartkeyInput.value = result.smartkey;
        console.log('Loaded smartkey:', result.smartkey);
    }
    if (result.profileKey) {
        profileKeyInput.value = result.profileKey;
        console.log('Loaded profile Key:', result.profileKey);
    }
    if (result.downloadJD) {
        jdCheckbox.checked = result.downloadJD;
        console.log('Loaded downloadJD:', result.downloadJD);
    }
});

// When user sets a selectkey
selectkeyInput.addEventListener('keydown', (e) => {
    e.preventDefault();

    if (e.key === 'Backspace') {
        selectkeyInput.value = '';
        chrome.storage.local.set({ selectkey: '' });
        return;
    }

    let keys = [];
    if (e.ctrlKey) keys.push('Ctrl');
    if (e.altKey) keys.push('Alt');
    if (e.shiftKey) keys.push('Shift');
    if (e.metaKey) keys.push('Meta');

    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
        let key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
        keys.push(key);
    }

    const combo = keys.join(' + ');
    selectkeyInput.value = combo;

    // Check for conflict with smartkey
    if (smartkeyInput.value === combo) {
        smartkeyInput.value = '';
        chrome.storage.local.set({ smartkey: '' });
    }

    chrome.storage.local.set({ selectkey: combo });
    console.log('Saved select key:', combo);
});

// When user sets a smartkey
smartkeyInput.addEventListener('keydown', (e) => {
    e.preventDefault();

    if (e.key === 'Backspace') {
        smartkeyInput.value = '';
        chrome.storage.local.set({ smartkey: '' });
        return;
    }

    let keys = [];
    if (e.ctrlKey) keys.push('Ctrl');
    if (e.altKey) keys.push('Alt');
    if (e.shiftKey) keys.push('Shift');
    if (e.metaKey) keys.push('Meta');

    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
        let key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
        keys.push(key);
    }

    const combo = keys.join(' + ');
    smartkeyInput.value = combo;

    // Check for conflict with selectkey
    if (selectkeyInput.value === combo) {
        selectkeyInput.value = '';
        chrome.storage.local.set({ selectkey: '' });
    }

    chrome.storage.local.set({ smartkey: combo });
    console.log('Saved smartkey:', combo);
});

profileKeyInput.addEventListener('input', (e) => {
    chrome.storage.local.set({ profileKey: e.target.value });
});

jdCheckbox.addEventListener('change', (e) => {
    chrome.storage.local.set({ downloadJD: e.target.checked });
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.profileName) {
            console.log('Profile name changed:', changes.profileName.newValue);
            profileNameElement.textContent = changes.profileName.newValue;
        }
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message)
    if (message.type === "notification") {
        console.log("Data received in popup:", message.message);
        // update DOM or do whatever
        message.message = message.message.replace(/\n/g, '<br>'); // Replace newlines with <br> for HTML display
        const messagesDiv = document.getElementById("messages");
        messagesDiv.innerHTML += `<div class="container border-top border-1">${message.message}</div>`;
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
});


document.getElementById('toggleSettingsBtn').addEventListener('click', function () {
    const container = document.getElementById('settingsContainer');
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
});