// 初始化 Dexie 資料庫 (更改名稱，強制 iOS 建立全新乾淨的資料庫！)
const db = new Dexie("WastelandHoundDB");

// 底下的定義完全不用動，保持你原本完美的代碼：
db.version(1).stores({
    player_state: "id",                 
    inventory_items: "++id, slot, rarity, is_equipped", 
    story_progress: "node_id, is_unlocked",         
    dungeon_progress: "dungeon_id, max_clear_floor", 
    hounds_collection: "++hound_id, breed, rarity"   
});
