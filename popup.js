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
    } else {
        selectkeyInput.value = 'Ctrl + `'; // Default value
        chrome.storage.local.set({ selectkey: 'Ctrl + `' });
        console.log('Set default selectkey: Ctrl + `');
    }
    if (result.smartkey) {
        smartkeyInput.value = result.smartkey;
        console.log('Loaded smartkey:', result.smartkey);
    } else {
        smartkeyInput.value = 'Ctrl + Q'; // Default value
        chrome.storage.local.set({ smartkey: 'Ctrl + Q' });
        console.log('Set default smartkey: Ctrl + Q');
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
    if (message.type) {
        console.log("Data received in popup:", message.message);
        // Replace newlines with <br> for HTML display
        const formattedMsg = message.message.replace(/\n/g, '<br>');
        const messagesDiv = document.getElementById("messages");

        // Choose color class based on type
        let colorClass = "";
        switch (message.type) {
            case "success":
                colorClass = "text-success";
                break;
            case "error":
                colorClass = "text-danger";
                break;
            case "warning":
                colorClass = "text-warning";
                break;
            case "info":
                colorClass = "text-info";
                break;
            default:
                colorClass = "text-secondary";
        }

        const msgDiv = document.createElement('div');
        msgDiv.className = `container border-top- border-1- ${colorClass}`;
        msgDiv.innerHTML = formattedMsg;
        messagesDiv.appendChild(msgDiv);
        // if (message.type === "warning") {
        //     const createWarningButtons = () => {
        //         const proceedBtn = document.createElement('button');
        //         proceedBtn.textContent = "Proceed";
        //         proceedBtn.className = "btn btn-sm btn-warning";

        //         const cancelBtn = document.createElement('button');
        //         cancelBtn.textContent = "Cancel";
        //         cancelBtn.className = "btn btn-sm btn-secondary mx-1";

        //         const btnWrapper = document.createElement('div');
        //         btnWrapper.className = "mb-1";
        //         btnWrapper.appendChild(proceedBtn);
        //         btnWrapper.appendChild(cancelBtn);

        //         proceedBtn.onclick = () => {
        //             console.log("Proceeding with options:", message.options);
        //             chrome.runtime.sendMessage({ type: "proceedWarning", options: message.options });
        //             btnWrapper.remove();
        //         };

        //         cancelBtn.onclick = () => {
        //             chrome.runtime.sendMessage({ type: "cancelWarning" });
        //             btnWrapper.remove();
        //         };

        //         return btnWrapper;
        //     };

        //     msgDiv.appendChild(createWarningButtons());
        // }
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
});


document.getElementById('toggleSettingsBtn').addEventListener('click', function () {
    const container = document.getElementById('settingsContainer');
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
});