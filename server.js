// 修正 NeDB 與新版 Node.js 的相容性問題
const util = require('util');
if (!util.isDate) {
    util.isDate = (obj) => Object.prototype.toString.call(obj) === '[object Date]';
}
if (!util.isRegExp) {
    util.isRegExp = (obj) => Object.prototype.toString.call(obj) === '[object RegExp]';
}

//引入基礎組件
const express = require('express'); //伺服器核心：Express 是 Node.js 最受歡迎的框架
const Datastore = require('nedb'); // 資料存儲：NeDB 是專為 Node.js 設計的輕量級資料庫。

// 引入 path 模組以處理檔案路徑，環境與路徑管理
const path = require('path');//path 模組能確保你的伺服器不論在哪個系統執行，都能精準地找到你的 HTML 和圖片檔案
const app = express();//正式啟動 Express 應用程式物件，接下來所有的 路由(網址列輸入不同路徑) 和 中間件(「請求進來」到「回應出去」之間，幫忙處理雜事) 都會掛載在這個 app

// 初始化 NeDB 資料庫 (這會產生一個叫 travel.db 的檔案)
const db = new Datastore({ //啟動資料庫引擎，建立一個新的資料庫實例
    filename: path.join(__dirname, 'travel.db'), //指定保險箱位置，Node.js 的全域變數，代表你目前這份 JS 檔案所在的絕對路徑，path.join 和travel.db 黏在一起
    //travel.db 是資料庫檔案的名稱，一個純文字檔案，由 NeDB 這種資料庫引擎所管理。執行 const db = new Datastore(...) 時，path.join指定資料夾「travel.db」這個檔案會自動被建立在你的專案資料夾裡面
    autoload: true//自動開鎖，每次啟動伺服器時，自動載入資料庫檔案
});

const fs = require('fs'); // 確保這行在 server.js 的最上方或這裡都有

function importInitialData() {
    // 檢查 data.json 是否存在，避免程式報錯
    if (fs.existsSync('data.json')) {
        const rawData = fs.readFileSync('data.json', 'utf8');
        const travels = JSON.parse(rawData);

        // 先清空再插入，確保資料庫內容跟你的 data.json 同步
        db.remove({}, { multi: true }, (err) => {
            db.insert(travels, (err, newDocs) => {
                if (err) {
                    console.log("❌ 匯入失敗：", err);
                } else {
                    console.log(`✅ 成功！已將 ${newDocs.length} 筆景點存入 travel.db`);
                }
            });
        });
    } else {
        console.log("⚠️ 找不到 data.json 檔案，請確認檔案位置。");
    }
}

// 執行匯入
importInitialData();

// --- 接下來才是原本的 app.use(...) 等其他代碼 ---
//這兩行代碼為 「中間件 (Middleware)」，負責處理進來的請求和靜態檔案服務
app.use(express.json());//資料解碼員，負責把進來的 JSON 格式資料轉換成 JavaScript 物件，讓你可以在程式碼中輕鬆操作這些資料
app.use(express.static(path.join(__dirname, '.')));//檔案管理員，負責把專案資料夾裡的靜態檔案（HTML、CSS、JavaScript、圖片等）提供給瀏覽器存取
//「express.static」 幫忙把 osaka.html 和 01.jpg 傳給瀏覽器。「express.json」 幫忙把心得轉成物件，讓隨後能用 db.insert 存進 travel.db。

//設定首頁路由，當使用者訪問根目錄時，伺服器會回應 home.html 檔案
app.get('/', (req, res) => {//監聽一個 HTTP GET 請求，(req 瀏覽器傳來的資訊（例如是誰訪問的） , res 「傳送檔案」的指令。它會告訴瀏覽器：「別只看文字，直接把這整個 HTML 檔案下載並顯示出來」) => { ... }  是這個請求的處理函式
    res.sendFile(path.join(__dirname, 'home.html')); //確保伺服器能在資料夾中精準找到 home.html
});
//使用者輸入網址後，伺服器才會知道：「喔！有人來了，快把 home.html 拿給他看！網址應該要對應到哪一個檔案，這段程式碼就像在寫地址。

// 取得所有旅遊資料的 API
app.get('/api/travel', (req, res) => {
    // NeDB 使用 .find({}) 來搜尋所有資料
    db.find({}, (err, docs) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(docs); // 回傳資料庫裡的陣列
    });
});

app.post('/api/travel/add', (req, res) => {
    const newEntry = req.body; // 從網頁傳過來的資料
    db.insert(newEntry, (err, doc) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: "新增成功！", data: doc });
    });
});


//這兩行程式碼是整個後端專案的「啟動開關」
const PORT = process.env.PORT || 3000;//選定頻道，伺服器要在哪個「門牌號碼」接收訊息。process.env.PORT 把網站放到雲端平台，雲端主機隨機分配一個門牌，這行字能自動偵測並採用。3000 「預設值」。
app.listen(PORT, () => {//坐在門口等客人，app.listen 撥出一個空間，隨時注意有沒有人從 PORT（3000 號門牌）傳訊息進來。() => { ... } 當伺服器順利啟動、沒被防火牆擋掉時，就會執行大括號裡的動作。
    console.log(`Server is running on port ${PORT}`);//純粹是寫給 開發者 看的。它會在黑視窗（終端機）顯示一行字：「Server is running on port！」
});
