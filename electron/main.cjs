const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const path = require('path');

let mainWindow;
const smokeTest = process.argv.includes('--smoke-test');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function sendUpdateStatus(type, message, extra = {}) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-status', { type, message, ...extra });
  }
}

function registerUpdaterEvents() {
  autoUpdater.on('checking-for-update', () => sendUpdateStatus('checking', '正在检查更新…'));
  autoUpdater.on('update-available', info => sendUpdateStatus('available', `发现新版本 v${info.version}，正在下载…`, { version: info.version }));
  autoUpdater.on('update-not-available', () => sendUpdateStatus('current', '已是最新版本'));
  autoUpdater.on('download-progress', progress => sendUpdateStatus('downloading', `正在更新 ${Math.round(progress.percent)}%`, { percent: progress.percent }));
  autoUpdater.on('error', error => {
    log.error('Updater error', error);
    sendUpdateStatus('error', '更新检查失败，稍后将自动重试');
  });
  autoUpdater.on('update-downloaded', async info => {
    sendUpdateStatus('ready', `v${info.version} 已下载，重启后安装`, { version: info.version });
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: '更新已准备好',
      message: `风月志 v${info.version} 已下载完成`,
      detail: '现在重启即可自动安装更新；选择“稍后”会在退出软件时安装。',
      buttons: ['立即重启安装', '稍后'],
      defaultId: 0,
      cancelId: 1
    });
    if (result.response === 0) autoUpdater.quitAndInstall(false, true);
  });
}

async function checkForUpdates() {
  if (!app.isPackaged) {
    sendUpdateStatus('development', `开发模式 · v${app.getVersion()}`);
    return;
  }
  try {
    await autoUpdater.checkForUpdates();
  } catch (error) {
    log.error('Unable to check for updates', error);
    sendUpdateStatus('error', '暂时无法检查更新');
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 900,
    minWidth: 880,
    minHeight: 640,
    show: false,
    backgroundColor: '#f4f2ec',
    icon: path.join(__dirname, '..', 'build', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));
  mainWindow.once('ready-to-show', () => { if (!smokeTest) mainWindow.show(); });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== mainWindow.webContents.getURL()) event.preventDefault();
  });
  mainWindow.webContents.once('did-finish-load', () => {
    if (smokeTest) setTimeout(() => app.exit(0), 250);
    else setTimeout(checkForUpdates, 1200);
  });
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.tzt302.peopleatlas');
  registerUpdaterEvents();
  ipcMain.handle('get-app-version', () => app.getVersion());
  ipcMain.handle('check-for-updates', () => checkForUpdates());
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
