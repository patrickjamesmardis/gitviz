const { app, BrowserWindow, TouchBar, ipcMain } = require('electron');
const { TouchBarButton } = TouchBar;
const path = require('path');
const fs = require('fs');
const gitlog = require('gitlog').default;
const gitinfo = require('./gitinfo');
let config = require('./config.json');

let mainWindow;
let gits = [];
const root = new gitinfo(process.env.HOME);

function getGits(n) {
    if (n.isGit) {
        n.name = '~' + n.path.substring(process.env.HOME.length);
        if (config.gits.includes(n.path)) {
            n.emoji = config.emojis[config.gits.indexOf(n.path)];
        }
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
    }
});

ipcMain.handle('gitlog', (event, arg) => {
    const gitlogOptions = {
        repo: arg,
        includeMergeCommitFiles: true,
        number: 200
    }
    return gitlog(gitlogOptions);
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

function touchbarClick(emoji) {
    let dirname = config.gits[config.emojis.indexOf(emoji)];
    mainWindow.webContents.send('touchbar', dirname);
}

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        icon: path.join(__dirname, 'build', 'icon.png'),
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    mainWindow.loadFile('index.html');
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    const buttons = [];
    config.emojis.forEach(emoji => {
        buttons.push(new TouchBarButton({
            label: emoji,
            click: () => touchbarClick(emoji)
        }));
    });
    const touchBar = new TouchBar({
        items: buttons
    });
    mainWindow.setTouchBar(touchBar);
}

app.on('ready', createMainWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
    if (mainWindow === null) createMainWindow();
});