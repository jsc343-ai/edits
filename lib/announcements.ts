export interface Announcement {
  id: number;
  date: string;
  zhTitle: string;
  zhBody: string;
  enTitle: string;
  enBody: string;
}

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 3,
    date: "2026-10-29",
    zhTitle: "新增轉場、30 首內建音樂與多款字體",
    zhBody: "轉場新增「旋轉」與「圓形展開」，並支援一鍵套用到全部片段。音樂庫內建 30 首曲目，文字也有多種中英文字體可選。",
    enTitle: "New transitions, 30 built-in songs and more fonts",
    enBody: "Spin and Iris transitions were added, with Apply to all clips. The music library now has 30 built-in songs and text offers many Chinese and English fonts.",
  },
  {
    id: 2,
    date: "2026-10-29",
    zhTitle: "點數制度上線",
    zhBody: "1 Pi = 1,000 點。每次製作成果下載：相片編輯扣 30 點，短視頻編輯扣 50 點，不分長度。可在首頁「Pi 支付」儲值。",
    enTitle: "Points are now live",
    enBody: "1 Pi = 1,000 points. Each finished download costs 30 points for photo edits and 50 points for video edits, regardless of length. Top up from Pi Pay on the home page.",
  },
  {
    id: 1,
    date: "2026-10-01",
    zhTitle: "歡迎來到 JSC343 AI EDITS",
    zhBody: "首創相片與短視頻的 AI 3D 動態編輯，編輯成果不保存，可下載輸出。",
    enTitle: "Welcome to JSC343 AI EDITS",
    enBody: "AI 3D motion editing for photos and short videos. Results are not stored, and can be downloaded.",
  },
];

export const LATEST_NOTICE_ID = Math.max(...ANNOUNCEMENTS.map((a) => a.id));
