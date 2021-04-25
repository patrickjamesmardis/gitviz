const { app, BrowserWindow, TouchBar, ipcMain } = require('electron');
const { TouchBarButton } = TouchBar;
const path = require('path');
const fs = require('fs');
const gitinfo = require('./gitinfo');
const gitlog = require('gitlog').default;
let config = require('./config.json');

let mainWindow;
let gitWindows = [];
let gits = [];
const root = new gitinfo(process.env.HOME);

function getGits(n) {
    if (n.isGit && config.gits.includes(n.path)) {
        n.name = '~' + n.path.substring(process.env.HOME.length);
        gits.push(n);
    }
    n.dirs.forEach(dir => {
        getGits(dir);
    });
}

getGits(root);

ipcMain.handle('get', (event, arg) => {
    if (arg === 'root') {
        return root;
    } else if (arg === 'gits') {
        return gits;
    } else if (arg === 'emojis') {
        return config.emojis;
    }
});

ipcMain.handle('gitlog', (event, arg) => {
    const cwd = process.env.PWD;
    // console.log(cp.execSync(`cd ${arg} && git log && cd ${cwd}`).toString());
    return;
});

ipcMain.handle('updateEmoji', (event, arg) => {
    config.emojis[config.gits.indexOf(arg[0])] = arg[1];
    fs.writeFile('./config.json', JSON.stringify(config), err => {
        if (err) throw err;
    });
    buttons.forEach(button => {
        if (button.label == arg[2]) button.label = arg[1];
    });
});

ipcMain.handle('gitwindow', (event, arg) => {
    const gitlogOptions = {
        repo: arg,
        number: 10
    }
    console.log(gitlog(gitlogOptions));
    createGitWindow();
});

const buttons = [];
config.emojis.forEach(emoji => {
    buttons.push(new TouchBarButton({
        label: emoji
    }));
})
const touchBar = new TouchBar({
    items: buttons
});

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    mainWindow.loadFile('index.html');
    mainWindow.on('closed', () => {
        mainWindow = null;
        gitWindows.forEach(window => window = null);
    });
    mainWindow.setTouchBar(touchBar);
}

function createGitWindow() {
    let newWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    gitWindows.push(newWindow);
    newWindow.loadFile('index.html');
    newWindow.on('closed', () => {
        newWindow = null;
    });
}

app.on('ready', createMainWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
    if (mainWindow === null) createMainWindow();
});