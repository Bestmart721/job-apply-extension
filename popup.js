let currentHotkey = '';
const input = document.getElementById('hotkey');
const form = document.getElementById('settingsForm');

// Load saved hotkey and server URL on popup open
chrome.storage.local.get(['hotkey', 'serverUrl'], (result) => {
    if (result.hotkey) {
        currentHotkey = result.hotkey;
        input.value = currentHotkey;
        console.log('Loaded hotkey:', currentHotkey);
    }
    if (result.serverUrl) {
        const serverUrlInput = document.getElementById('serverUrl');
        serverUrlInput.value = result.serverUrl;
        console.log('Loaded server URL:', result.serverUrl);
    }
});

// When user sets a hotkey
input.addEventListener('keydown', (e) => {
    e.preventDefault();

    if (e.key === 'Backspace') {
        input.value = '';
        currentHotkey = '';
        return;
    }

    let keys = [];
    if (e.ctrlKey) keys.push('Ctrl');
    if (e.altKey) keys.push('Alt');
    if (e.shiftKey) keys.push('Shift');
    if (e.metaKey) keys.push('Meta');

    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
        keys.push(e.key);
    }

    const combo = keys.join(' + ');
    input.value = combo;
    currentHotkey = combo;
    console.log('Saved hotkey:', currentHotkey);
});

// Handle form submit
form.addEventListener('submit', (e) => {
    e.preventDefault(); // stop page reload

    currentHotkey = input.value;

    chrome.storage.local.set({ hotkey: currentHotkey }, () => {
        console.log('Hotkey saved:', currentHotkey);
    });

    // Optional: you can also save server URL like this
    const serverUrl = document.getElementById('serverUrl').value;
    chrome.storage.local.set({ serverUrl });
});

// Global listener
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
        console.log('comparing');
        if (currentCombo === saved) {
            console.log(`Hotkey "${saved}" triggered!`);
            alert(`Triggered hotkey: ${saved}`);
        }
    });
});