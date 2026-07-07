// 初始化 Dexie 資料庫
const db = new Dexie("WastelandHoundDB");

// 定義資料庫結構 (Schema)
// 這裡的欄位是「索引鍵」，沒寫出來的隨機屬性也可以直接當作 JSON 塞進去
db.version(1).stores({
    player_state: "id",                 // 玩家基礎資源、無人機等級、血量等存檔 (固定 id: 1)
    inventory_items: "++id, slot, rarity, is_equipped", // 刷寶背包：獨立 ID、部位、稀有度、是否穿戴

    // 🚀 【預留未來擴充資料表】
    story_progress: "node_id, is_unlocked",         // 故事進度、主線章節解鎖狀態
    dungeon_progress: "dungeon_id, max_clear_floor", // 副本/地下鐵關卡當前通關最高層數
    hounds_collection: "++hound_id, breed, rarity"   // 抽卡/培育獲得的犬伴倉庫
});
