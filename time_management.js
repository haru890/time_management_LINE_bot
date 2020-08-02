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
  const cmd = userMessage.split(' ')[0];// 残り時間 or 更新 or 確認
  const arg1 = userMessage.split(' ')[1];// 更新内容　→更新（分）
  const arg2 = userMessage.split(' ')[2];// 時間　→備考空白も許容したい
  // 予定はなくす
  //let schedule = UPDATE_INFO_SHEET.getRange(UPDATE_INFO_SHEET.getLastRow(), 6, 1, 1).getValues();
  
  // メイン処理
  let replyMessage;// 返信内容は変わるため、let
  //　残り（分）
  let remainingTime = Number(UPDATE_INFO_SHEET.getRange(UPDATE_INFO_SHEET.getLastRow(), 4, 1, 1).getValues());
  switch (cmd) {
    case '残り時間':
      replyMessage = [`残り時間は${remainingTime}分です`];
      break;
      
    case '更新':
      //const updateDate = getUpdateDate();// 更新日時
      UPDATE_INFO_SHEET.getRange(UPDATE_INFO_SHEET.getLastRow() + 1, 2, 1, 1).setValue(getUpdateDate());// 日付
      UPDATE_INFO_SHEET.getRange(UPDATE_INFO_SHEET.getLastRow(), 3, 1, 1).setValue(arg1);// 更新（分）
      //UPDATE_INFO_SHEET.getRange(UPDATE_INFO_SHEET.getRange(getLastRow(), 1, 1, 1).getLastRow(), 3, 1, 1).setValue(arg1);// 更新（分）
      let updateTime = Number(arg1);
      let lastRemainingTime = remainingTime + updateTime; // constでいいかも？
      if (updateTime > 0) {
        updateTime = `+${updateTime}`;
      }
      UPDATE_INFO_SHEET.getRange(UPDATE_INFO_SHEET.getLastRow(), 4, 1, 1).setValue(lastRemainingTime);// 残り（分）
      UPDATE_INFO_SHEET.getRange(UPDATE_INFO_SHEET.getLastRow(), 5, 1, 1).setValue(arg2);// 備考
      replyMessage = [`更新 ${updateTime}(分) されました\n残り ${lastRemainingTime}(分) です`];
      break;
    
    case 'リンク':
      replyMessage = ['https://docs.google.com/spreadsheets/d/1bnTEdDi9M-hj-WLQaTd7iaQ7OdFgjBWdH09pJ0TvzWQ/edit#gid=0'];
      break;
      
    case '承認':
        // 最終行に「✔」を記入する
      //UPDATE_INFO_SHEET.getRange(UPDATE_INFO_SHEET.getRange(UPDATE_INFO_SHEET.getLastRow(), 1, 1, 1)
      
      const lastRowOfColumnA = UPDATE_INFO_SHEET.getRange(1, 1).getNextDataCell(SpreadsheetApp.Direction.DOWN).getRow();
      UPDATE_INFO_SHEET.getRange(lastRowOfColumnA + 1, 1).setValue('✔');
      
      //UPDATE_INFO_SHEET.getRange(UPDATE_INFO_SHEET.getRange(UPDATE_INFO_SHEET.getLastRow(), 1, 1, 1)
    //                         UPDATE_INFO_SHEET.getLastRow(), 1, 1, 1).setValue('✔');
      replyMessage = ['ご確認いただき、ありがとうございました！'];
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

function getUpdateDate() {
  const youbi = ['日', '月', '火', '水', '木', '金', '土'];
  const UpdateDate = new Date();
  const formattedUpdateDate = ( 
    (UpdateDate.getMonth() + 1)  + '/' + 
	UpdateDate.getDate() + 
    ` ${youbi[UpdateDate.getDay()]} ` 
  );
  return formattedUpdateDate;
}