// スプレッドシートに情報を記載しておき,そこから読み込む。
const UPDATE_INFO_SHEET = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('更新情報');
const SYSTEM_INFO_SHEET = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('システム情報');
const LINE_URL = SYSTEM_INFO_SHEET.getRange(1, 1, 1, 1).getValues();// スプレッドシートから値を取得
const LINE_TOKEN = SYSTEM_INFO_SHEET.getRange(2, 1, 1, 1).getValues();// スプレッドシートから値を取得

function doPost(e) {
  // 入力処理
  const json = JSON.parse(e.postData.contents);// e:イベントオブジェクトのe　json形式を扱えるように変換 .でつないだ書き方ができる
  const replyToken = json.events[0].replyToken;// replyToken メッセージに対する返信に使う
  const userMessage = json.events[0].message.text;
  
  // 半角スペースでスプリット
  const cmd = userMessage.split(' ')[0];// 残り時間 or 更新
  const arg1 = userMessage.split(' ')[1];// 更新内容
  const arg2 = userMessage.split(' ')[2];// 時間
  let schedule = UPDATE_INFO_SHEET.getRange(UPDATE_INFO_SHEET.getLastRow(), 6, 1, 1).getValues();
  
  // メイン処理
  let replyMessage;// 返信内容は変わるため、let
  //let lastDeadTime = Number(SHEET.getRange(SHEET.getLastRow(), 1, 1, 1).getValues());
  let lastDeadTime = Number(UPDATE_INFO_SHEET.getRange(UPDATE_INFO_SHEET.getLastRow(), 3, 1, 1).getValues());
  switch (cmd) {
    case '残り時間':
      replyMessage = [`残り時間は${lastDeadTime}分です`];
      break;
      
    case '更新':
      const spentTime = Number(arg2);// 数字じゃないものだとUndefined
      const now = getNow();// 更新日時
      UPDATE_INFO_SHEET.getRange(UPDATE_INFO_SHEET.getLastRow() + 1, 1, 1, 1).setValue(arg1);// 更新内容
      UPDATE_INFO_SHEET.getRange(UPDATE_INFO_SHEET.getLastRow(), 2, 1, 1).setValue(arg2);// 更新時間 +300, -60など
      UPDATE_INFO_SHEET.getRange(UPDATE_INFO_SHEET.getLastRow(), 4, 1, 1).setValue(getNow());// 更新時刻
      let thisDeadTime = lastDeadTime + spentTime;
      UPDATE_INFO_SHEET.getRange(UPDATE_INFO_SHEET.getLastRow(), 3, 1, 1).setValue(thisDeadTime);// 残り時間をスプレッドシートに記入する
      replyMessage = [`${now}\n『残り時間』が更新されました\n\n${lastDeadTime}分    更新前の残り時間\n${spentTime}分    ${arg1}したので\n${thisDeadTime}分    残り時間\n\n詳細を確認↓\nhttps://docs.google.com/spreadsheets/d/1bnTEdDi9M-hj-WLQaTd7iaQ7OdFgjBWdH09pJ0TvzWQ/edit#gid=0`];
      break;
    
    case '確認':
      replyMessage = ['https://docs.google.com/spreadsheets/d/1bnTEdDi9M-hj-WLQaTd7iaQ7OdFgjBWdH09pJ0TvzWQ/edit#gid=0\n\n更新内容が正しければ\n「確認OK」と入力してください'];
      break;
      
    case '確認OK':
        // 「更新日時」が記入してある最終行と同じ行の列に「✔」を記入する
        if (UPDATE_INFO_SHEET.getRange(UPDATE_INFO_SHEET.getLastRow(), 4, 1, 1).getValues()) {
          UPDATE_INFO_SHEET.getRange(UPDATE_INFO_SHEET.getLastRow(), 5, 1, 1).setValue(getNow())
        }
      replyMessage = ['ご確認いただき、ありがとうございました！'];
      break;
      
    case '予定':
      replyMessage = [`次回の予定は\n${schedule}\n`];
      break;
      
    default:
      break;
  }
  reply(replyMessage, replyToken);// 
  // 自動的にステータス2００とかを返す　
  return ContentService.createTextOutput(JSON.stringify({ 'content': 'post ok' })).setMimeType(ContentService.MimeType.JSON);
}

// 返信を行う
function reply(replyMessage, replyToken) {
  const url = LINE_URL;
  const headers = {
    'Content-Type': 'application/json; charset=UTF-8',// リファレンスに記載。UTF-8：文字化け防止
    'Authorization': 'Bearer ' + LINE_TOKEN// 
  };
  const data = {
    'replyToken': replyToken,
    'messages': replyMessage.map(function (v) { return { 'type': 'text', 'text': v }; })
  };
  const options = {
    'method': 'post',// リファレンスに記載
    'headers': headers,
    'payload': JSON.stringify(data)// 文字列に変換
  };
  UrlFetchApp.fetch(url, options);// URLにリクエストを送る
  return;
}

function getNow() {
  const youbi = ['日', '月', '火', '水', '木', '金', '土'];
  const now = new Date();
  const formattedNow = (
    now.getFullYear() + '年' + 
    (now.getMonth() + 1)  + '月' + 
	now.getDate() + '日' + 
    ` (${youbi[now.getDay()]}) ` +
    ('00' + now.getHours()).slice(-2) + ':' + 
    ('00' + now.getMinutes()).slice(-2) + ':' + 
    ('00' + now.getSeconds()).slice(-2) 
  );
  return formattedNow;
}