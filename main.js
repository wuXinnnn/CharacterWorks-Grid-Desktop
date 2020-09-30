const { app, BrowserWindow, globalShortcut } = require("electron");
let ipc = require("electron").ipcMain;
// 保持对window对象的全局引用，如果不这么做的话，当JavaScript对象被
// 垃圾回收的时候，window对象将会自动的关闭
let win;

// require("electron-reload")(__dirname, {
//   // Note that the path to electron may vary according to the main file
//   electron: require(`${__dirname}/node_modules/electron`),
// });

function createWindow() {
  // 创建浏览器窗口。
  win = new BrowserWindow({
    width: 850,
    height: 1000,
    minWidth: 850,
    minHeight: 1000,
    frame: true,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    },
  });

  // 加载index.html文件
  win.loadFile("grid.html");

  // 打开开发者工具
  win.webContents.openDevTools({ mode: "detach" });
  // 当 window 被关闭，这个事件会被触发。
  win.on("closed", () => {
    // 取消引用 window 对象，如果你的应用支持多窗口的话，
    // 通常会把多个 window 对象存放在一个数组里面，
    // 与此同时，你应该删除相应的元素。
    win = null;
  });
}
app.allowRendererProcessReuse = false;
// Electron 会在初始化后并准备
// 创建浏览器窗口时，调用这个函数。
// 部分 API 在 ready 事件触发后才能使用。
app.on("ready", createWindow);
app.on("ready", function () {
  ipc.on("CWShortCutUnRegister", function () {
    globalShortcut.unregisterAll();
  });
  ipc.on("CWShortCutRegister", function (
    event,
    grid_key,
    grid_names,
    grid_value
  ) {
    let keys = grid_key.split(",");
    keys.forEach(function (key, i) {
      let lastKey = key.split("+")[key.split("+").length - 1];
      if (parseInt(lastKey) > 0 && parseInt(lastKey) < 10) {
        let fixKey = "";
        for (let index = 0; index < key.split("+").length - 1; index++) {
          fixKey = fixKey + key.split("+")[index] + "+";
        }
        keys[i] = fixKey + "num" + lastKey;
      }
    });
    keys.forEach(function (key) {
      globalShortcut.register(key, function () {
        win.webContents.send("cwBtnActivate", grid_names, grid_value);
      });
    });
  });
});

app.on("before-quit", function () {
  // win.webContents.send('record');
});
// 当全部窗口关闭时退出。
app.on("window-all-closed", () => {
  // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
  // 否则绝大部分应用及其菜单栏会保持激活。
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // 在macOS上，当单击dock图标并且没有其他窗口打开时，
  // 通常在应用程序中重新创建一个窗口。
  if (win === null) {
    createWindow();
  }
});
