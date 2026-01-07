const express = require('express');
const Datastore = require('nedb'); // 改用 nedb
const path = require('path');
const app = express();

// 初始化 NeDB 資料庫 (這會產生一個叫 travel.db 的檔案)
const db = new Datastore({ 
    filename: path.join(__dirname, 'travel.db'), 
    autoload: true
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'client')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
// ... 之後的資料庫操作都要改成 db.insert 或 db.find ...