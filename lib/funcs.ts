export type EditFunc = "card" | "collage" | "single" | "photos" | "video";

export const FUNCS: { id: EditFunc; zh: string; en: string; descZh: string; descEn: string }[] = [
  {
    id: "card",
    zh: "文宣卡片編輯",
    en: "Promo card",
    descZh: "製作海報、邀請卡與宣傳圖，可加文字與插圖",
    descEn: "Make posters, invitations and promo images with text and artwork",
  },
  {
    id: "collage",
    zh: "1～6 張照片組合",
    en: "Photo collage (1-6)",
    descZh: "把 1 到 6 張相片拼成一張，多種版型可選",
    descEn: "Combine 1 to 6 photos into one picture with several layouts",
  },
  {
    id: "single",
    zh: "單張照片動態化",
    en: "Animate one photo",
    descZh: "一張相片變成有立體感的 3D 動態影片",
    descEn: "Turn a single photo into a lifelike 3D motion clip",
  },
  {
    id: "photos",
        zh: "50 張相片導演化編輯",
    en: "Photo director (50)",
    descZh: "最多 50 張相片，文字全功能、批次調秒數與濾鏡、隨機排序、配合音樂長度",
    descEn: "Up to 50 photos with full text tools, batch timing and filters, shuffle, fit to music",
  },
  {
    id: "video",
    zh: "10 分鐘短視頻導演化編輯",
    en: "Video director (10 min)",
    descZh: "剪輯長達 10 分鐘的影片，分割、批次調速、全部靜音、濾鏡與音樂",
    descEn: "Edit up to 10 minutes: split, batch speed, mute all, filters, music",
  },
];
