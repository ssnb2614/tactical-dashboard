import Papa from 'papaparse';

// 把你剛剛複製的 CSV 網址貼在這邊
const WEAPONS_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ96XIbgswXM0klVTlTNXtGsVZaGrOwrIT-0ebcc3UD1maVcnYD-Sidjdn4zFztpWf3F8bneoxlhfj8/pub?gid=300864802&single=true&output=csv";

export const fetchWeapons = () => {
  return new Promise((resolve, reject) => {
    Papa.parse(WEAPONS_SHEET_URL, {
      download: true,
      header: true, // 自動把第一列當作 JSON 的 Key (例如 WPN_ID, Faction)
      dynamicTyping: true, // 自動把數字字串轉成真正的數字
      complete: (results) => {
        console.log("從 Google 偷來的軍火資料：", results.data);
        resolve(results.data);
      },
      error: (error) => {
        console.error("抓取失敗，你的網路或網址有問題", error);
        reject(error);
      }
    });
  });
};