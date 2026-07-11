// 全域記憶體快照
let gameConfig = null;
let gameState = {
    resources: { scrap: 0, food: 10, zaco: 0 },
    upgrades: { drones: 0 }, costs: { drone: 10 }, autoRates: { scrap: 0 },
    isExploring: false, currentArea: "wasteland",
    hound: { 
        hp: 100, maxHp: 100, baseAtk: 12, totalAtk: 12, 
        baseDef: 0, totalDef: 0, 
        baseDodge: 5, totalDodge: 5, 
        baseCrit: 10, totalCrit: 10, 
        ohko: 0, activeSets: [] 
    },
    equipped: { helmet: null, collar: null, harness: null },
    currentEnemy: null,
    autoSell: { common: false, rare: false },
    // --- 📜 副本文件與派遣電台系統狀態 ---
    unlockedLore: [], 
    dispatch: {
        status: "idle",
        houndName: "未招募", 
        endTime: 0,
        houndGear: { head: null, collar: null, harness: null }
    }
};
// === 家園與離線系統變數 ===
let baseData = {
    ccLevel: 0,               // 中央控制室等級
    towerLevel: 0,            // ⚠️ 新增：誘餌廣播塔等級 (0代表未解鎖/建立)
    towerZombies: 0,          // ⚠️ 新增：當前廣播塔吸引的殭屍數量
    radioState: false,        // 確保收音機狀態也在內
    lastLoginTime: Date.now() // 最後登入/存檔時間戳記
};

// 系統預設參數
const BASE_SCRAP_CAP = 1000; // 初始廢料儲存上限
const MAX_FOOD_CAP = 400;    // ⚠️ 新增：初始肉乾儲存上限

// --- 新增：動態計算當前廢料上限 ---
function getMaxScrap() {
    if (!window.baseData) return BASE_SCRAP_CAP;
    return BASE_SCRAP_CAP + (baseData.ccLevel * 1000);
}
// 啟動初始化
window.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch('./config.json');
        gameConfig = await response.json();
        await loadGameData();
        initGameLoops();
		renderDungeonList();
    } catch (e) { console.error("系統初始化失敗:", e); }
});

// 資料庫載入
async function loadGameData() {
    let savedState = await db.player_state.get(1);
    if (!savedState) {
        savedState = { 
            id: 1, resources: { scrap: 0, food: 10, zaco: 0 }, 
            upgrades: { drones: 0 }, costs: { drone: 10 }, 
            autoRates: { scrap: 0 }, hound_hp: 100, 
            autoSell: { common: false, rare: false },
            baseData: { ccLevel: 0, lastLoginTime: Date.now() },
            isExploring: false,
            currentArea: "wasteland"
        };
        await db.player_state.add(savedState);
    }
    
    // 載入基礎資料
    gameState.resources = savedState.resources;
    gameState.upgrades = savedState.upgrades;
    gameState.costs = savedState.costs;
    gameState.autoRates = savedState.autoRates;
    gameState.hound.hp = savedState.hound_hp;
    gameState.autoSell = savedState.autoSell || { common: false, rare: false };
	// --- ⚠️ 新增：讀取舊存檔時的防呆初始化 ---
    gameState.unlockedLore = savedState.unlockedLore || [];
    gameState.dispatch = savedState.dispatch || {
        status: "idle",
        houndName: "未招募",
        endTime: 0,
        houndGear: { head: null, collar: null, harness: null }
    };

    // --- 關鍵修復：恢復探索狀態與所在區域的記憶 ---
    gameState.isExploring = savedState.isExploring || false;
    gameState.currentArea = savedState.currentArea || "wasteland";

    // 載入家園資料 (防止舊存檔報錯)
    if (savedState.baseData) {
        baseData = savedState.baseData || { ccLevel: 0, lastLoginTime: Date.now() };
	}
    if (baseData.ccLevel === undefined) baseData.ccLevel = 0;
    if (baseData.towerLevel === undefined) baseData.towerLevel = 0;
    if (baseData.dispatchLevel === undefined) baseData.dispatchLevel = 0;
    if (baseData.towerZombies === undefined) baseData.towerZombies = 0;
    if (baseData.radioState === undefined) baseData.radioState = false;

    if(document.getElementById('auto-common')) document.getElementById('auto-common').checked = gameState.autoSell.common;
    if(document.getElementById('auto-rare')) document.getElementById('auto-rare').checked = gameState.autoSell.rare;

    const equippedItems = await db.inventory_items.where("is_equipped").equals(1).toArray();
    gameState.equipped = { helmet: null, collar: null, harness: null };
    equippedItems.forEach(item => { gameState.equipped[item.slot] = item; });

    calculateHoundStats(); 
    
    // --- 關鍵修復：同步 UI 按鈕，確保重整網頁時探索按鈕維持在「執行中」 ---
    if (gameState.isExploring) {
        const btn = document.getElementById('btn-explore'); 
        const stateEl = document.getElementById('hound-state');
        if (btn) { 
            btn.innerText = "HALT_EXPLORATION [停止探索]"; 
            btn.style.borderColor = "#ff3333"; 
            btn.style.color = "#ff3333"; 
        }
        if (stateEl) { 
            stateEl.innerText = "[探索中]"; 
            stateEl.style.color = "var(--primary-color)"; 
        }
    }

    updateUI();
    logMessage(">> 模組化資料庫鏈結成功。", "system");
    
    // 成功讀取存檔後，啟動離線結算 (加上 await 確保模擬完才繼續)
    await calculateOfflineProgress(); 
}

async function savePlayerState() {
    // 存檔時，刷新最後登入時間
    if (window.baseData) baseData.lastLoginTime = Date.now();
    
    await db.player_state.put({
        id: 1, 
        resources: gameState.resources, 
        upgrades: gameState.upgrades,
        costs: gameState.costs, 
        autoRates: gameState.autoRates, 
        hound_hp: gameState.hound.hp, 
        autoSell: gameState.autoSell,
        baseData: baseData,
        // --- 關鍵修復：把探索狀態與區域寫進資料庫 ---
        isExploring: gameState.isExploring, 
        currentArea: gameState.currentArea,
        // --- ⚠️ 新增：將文件與派遣狀態寫入資料庫快照 ---
        unlockedLore: gameState.unlockedLore,
        dispatch: gameState.dispatch    
    });
}
// 計算能力值 (包含套裝遞減效應與文字說明)
function calculateHoundStats() {
    let bAtk = 0, bHp = 0, bDef = 0, bDodge = 0, bCrit = 0, ohko = 0;
    let setCounts = {};

    Object.values(gameState.equipped).forEach(item => {
        if (!item) return;
        if (item.atk) bAtk += item.atk;
        if (item.maxHp) bHp += item.maxHp;
        if (item.def) bDef += item.def;
        if (item.dodge) bDodge += item.dodge;
        if (item.crit) bCrit += item.crit;
        if (item.setId) setCounts[item.setId] = (setCounts[item.setId] || 0) + 1;
    });

    let activeText = []; 
    gameState.hound.activeSets = []; 
    let atkMultiplier = 1; 

    // 判斷套裝發動與遞減效應 (Diminishing Returns)
    for (const [setId, count] of Object.entries(setCounts)) {
        // 抓取套裝中文名稱 (若無則顯示代碼)
        let setName = gameConfig.loot_pool.sets[setId] ? gameConfig.loot_pool.sets[setId].name : setId;

        if (count >= 2) {
            gameState.hound.activeSets.push(`${setId}_2pc`);
            
            // 2件套：提供強力基礎數值
            if (setId === 'scavenger') { bAtk += 20; activeText.push(`[${setName}] 2件套: 基礎攻擊力 +20`); }
            if (setId === 'ninja') { bDodge += 20; activeText.push(`[${setName}] 2件套: 閃避率 +20%`); }
            if (setId === 'thug') { bCrit += 40; activeText.push(`[${setName}] 2件套: 暴擊率 +40%`); }
            if (setId === 'zombie') { ohko += 10; activeText.push(`[${setName}] 2件套: 秒殺機率 +10%`); }
            if (setId === 'abyss') { bDef += 20; activeText.push(`[${setName}] 2件套: 防禦力 +20`); }
        }
        
        if (count >= 3) {
            gameState.hound.activeSets.push(`${setId}_3pc`);
            
            // 3件套：遞減效應，僅追加少量數值
            if (setId === 'scavenger') { bAtk += 10; activeText.push(`[${setName}] 3件套: 攻擊力再 +10 (總和+30)`); }
            if (setId === 'ninja') { bDodge += 10; activeText.push(`[${setName}] 3件套: 閃避率再 +10% (總和+30%)`); }
            if (setId === 'thug') { bCrit += 10; activeText.push(`[${setName}] 3件套: 暴擊率再 +10% (總和+50%)`); }
            if (setId === 'zombie') { ohko += 5; activeText.push(`[${setName}] 3件套: 秒殺機率再 +5% (總和+15%)`); }
            if (setId === 'abyss') { bDef += 10; activeText.push(`[${setName}] 3件套: 防禦力再 +10 (總和+30)`); }
        }
    }

    // 結算總能力值
    gameState.hound.totalAtk = Math.floor((gameState.hound.baseAtk + bAtk) * atkMultiplier);
    gameState.hound.maxHp = 100 + bHp; 
    gameState.hound.totalDef = gameState.hound.baseDef + bDef;
    gameState.hound.totalDodge = gameState.hound.baseDodge + bDodge; 
    gameState.hound.totalCrit = gameState.hound.baseCrit + bCrit;
    gameState.hound.ohko = ohko;
    
    if (gameState.hound.hp > gameState.hound.maxHp) gameState.hound.hp = gameState.hound.maxHp;
    
    // 更新 UI 上的套裝文字說明
    const setText = document.getElementById('set-bonus-text');
    if (setText) setText.innerHTML = activeText.length > 0 ? activeText.join("<br>") : "<span style='color:#777;'>[未啟動任何套裝效果]</span>";
}

function initGameLoops() {
    setInterval(() => {
        // 線上無人機採集：強制受限於最大容量
        if (gameState.autoRates.scrap > 0) { 
            let maxCap = getMaxScrap();
            if (gameState.resources.scrap < maxCap) {
                gameState.resources.scrap = Math.min(gameState.resources.scrap + gameState.autoRates.scrap, maxCap);
                updateUI(); 
            }
        }
        if (gameState.isExploring) handleExplorationTick();
    }, 1000);
    setInterval(() => { savePlayerState(); }, 10000);
}

function switchTab(tabId) {
    try {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
        
        const targetTab = document.getElementById(`tab-${tabId}`);
        const targetBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        
        if (targetTab) targetTab.classList.add('active');
        if (targetBtn) targetBtn.classList.add('active');
        
        if (tabId === 'inv' && typeof renderInventory === "function") renderInventory();
        if (tabId === 'shop' && typeof renderShop === "function") renderShop();
        if (tabId === 'base' && typeof updateBaseUI === "function") updateBaseUI();
    } catch (e) {
        console.error("切換分頁失敗:", e);
    }
}

function gatherResource(type) { 
    if (type === 'scrap') {
        let maxCap = getMaxScrap();
        if (gameState.resources.scrap >= maxCap) {
            logMessage(`[系統警告] 廢料儲存槽已滿 (${maxCap})。請至 [06_BASE] 升級中央控制室。`, 'warning');
            return;
        }
    }
    
    // --- 新增：肉乾上限攔截邏輯 ---
    if (type === 'food') {
        if (gameState.resources.food >= MAX_FOOD_CAP) {
            logMessage(`[系統警告] 肉乾儲存槽已滿 (${MAX_FOOD_CAP})。無法儲存更多乾糧。`, 'warning');
            return; // 達到 400 份就不給採集
        }
    }
    
    gameState.resources[type]++; 
    updateUI(); 
    savePlayerState(); 
    logMessage(`回收 1 ${type.toUpperCase()}`); 
}

function buyDrone() {
    if (gameState.resources.scrap >= gameState.costs.drone) {
        gameState.resources.scrap -= gameState.costs.drone; gameState.upgrades.drones++;
        gameState.autoRates.scrap = gameState.upgrades.drones * 1;
        gameState.costs.drone = Math.floor(10 * Math.pow(1.5, gameState.upgrades.drones));
        updateUI(); savePlayerState();
    } else { logMessage(`[SCRAP] 資源不足。`, 'system'); }
}

// --- [06_BASE] 家園設施邏輯 ---

// 更新家園分頁的所有 UI 數值
function updateBaseUI() {
    // 1. 中央控制室
    let ccCost = 500 * Math.pow(2, baseData.ccLevel || 0);
    if(document.getElementById('base-cc-level')) document.getElementById('base-cc-level').innerText = baseData.ccLevel || 0;
    if(document.getElementById('base-cc-cost')) document.getElementById('base-cc-cost').innerText = ccCost;
    
    // 2. 收音機狀態
    const radioBtn = document.getElementById('btn-radio-state');
    if (radioBtn) {
        if (baseData.radioState) {
            radioBtn.innerText = "[目前狀態: 啟動] TURN_OFF";
            radioBtn.style.borderColor = "#55aaff"; radioBtn.style.color = "#55aaff";
        } else {
            radioBtn.innerText = "[目前狀態: 關閉] TURN_ON";
            radioBtn.style.borderColor = "#888"; radioBtn.style.color = "#888";
        }
    }

    // 3. 誘餌廣播塔
    let towerLv = baseData.towerLevel || 0;
    let maxZombies = (2 + (towerLv * 2)) * 60 * towerLv;
    let chargePct = maxZombies > 0 ? Math.min(100, Math.floor(((baseData.towerZombies || 0) / maxZombies) * 100)) : 0;
    if(document.getElementById('base-tower-charge')) document.getElementById('base-tower-charge').innerText = `${chargePct}% (${baseData.towerZombies || 0}隻)`;

    // 4. 派遣電台
    let dispatchCost = Math.floor(6000 * Math.pow(1.8, baseData.dispatchLevel || 0));
    if(document.getElementById('base-dispatch-level')) document.getElementById('base-dispatch-level').innerText = baseData.dispatchLevel || 0;
    if(document.getElementById('base-dispatch-cost')) document.getElementById('base-dispatch-cost').innerText = dispatchCost;

    if (typeof updateDispatchUI === "function") updateDispatchUI();
}

// ⚠️ 新增：一鍵引爆廣播塔收割殭屍
function detonateTower() {
    if (!baseData.towerLevel || baseData.towerLevel === 0) {
        logMessage("⚠️ 尚未建立誘餌廣播塔，請先升級建立！", "warning"); return;
    }
    if (!baseData.towerZombies || baseData.towerZombies <= 0) {
        logMessage("⚠️ 廣播塔附近目前沒有徘徊的屍群，請等待離線蓄力。", "warning"); return;
    }
    let killed = baseData.towerZombies;
    let scrapGain = killed * (Math.floor(Math.random() * 3) + 2);
    let maxCap = getMaxScrap();
    gameState.resources.scrap = Math.min(gameState.resources.scrap + scrapGain, maxCap);
    baseData.towerZombies = 0;
    
    updateBaseUI(); updateUI(); savePlayerState();
    logMessage(`💥 [EMP引爆] 成功清剿廣播塔周圍 ${killed} 隻殭屍，回收 +${scrapGain} 廢料！`, "success");
}

// 收音機開關切換邏輯
function toggleRadio() {
    if (baseData.radioState === undefined) baseData.radioState = false;
    baseData.radioState = !baseData.radioState;
    
    updateBaseUI();
    savePlayerState();
    
    if (baseData.radioState) {
        logMessage(`📻 [雜訊] 收音機已開啟。虛空中的低語開始在營地迴盪...`, 'system');
    } else {
        logMessage(`📻 [靜音] 切斷收音機電源。空間恢復了令人安心的死寂。`, 'system');
    }
}

// 升級設施共用函數
function upgradeFacility(facility) {
    if (facility === 'controlCenter') {
        let cost = 500 * Math.pow(2, baseData.ccLevel || 0);
        if (gameState.resources.scrap >= cost) {
            gameState.resources.scrap -= cost;
            baseData.ccLevel = (baseData.ccLevel || 0) + 1;
            logMessage(`[系統] 系統擴容成功。中央控制室升級至 Lv.${baseData.ccLevel}`, 'system');
            updateBaseUI(); updateUI(); savePlayerState();
        } else {
            logMessage(`[警告] 廢料不足，擴容需要 ${cost} 廢料`, 'zaco');
        }
    } else if (facility === 'tower') {
        let cost = Math.floor(4500 * Math.pow(1.7, baseData.towerLevel || 0));
        if (gameState.resources.scrap >= cost) {
            gameState.resources.scrap -= cost;
            baseData.towerLevel = (baseData.towerLevel || 0) + 1;
            logMessage(`[系統] 廣播塔增幅成功！升級至 Lv.${baseData.towerLevel}`, 'system');
            updateBaseUI(); updateUI(); savePlayerState();
        } else {
            logMessage(`[警告] 廢料不足，升級廣播塔需要 ${cost} 廢料`, 'zaco');
        }
    } else if (facility === 'dispatch') {
        let cost = Math.floor(6000 * Math.pow(1.8, baseData.dispatchLevel || 0));
        if (gameState.resources.scrap >= cost) {
            gameState.resources.scrap -= cost;
            baseData.dispatchLevel = (baseData.dispatchLevel || 0) + 1;
            logMessage(`[系統] 派遣電台功率提升！升級至 Lv.${baseData.dispatchLevel}`, 'system');
            updateBaseUI(); updateUI(); savePlayerState();
        } else {
            logMessage(`[警告] 廢料不足，升級電台需要 ${cost} 廢料`, 'zaco');
        }
    }
}

function healHound() {
    if (gameState.hound.hp >= gameState.hound.maxHp) return;
    if (gameState.resources.food >= 1) {
        gameState.resources.food--; gameState.hound.hp = Math.min(gameState.hound.hp + 25, gameState.hound.maxHp);
        updateUI(); savePlayerState(); logMessage(`餵食肉乾，恢復 25 HP。[${gameState.hound.hp}/${gameState.hound.maxHp}]`);
    }
}



function toggleExplore() {
    if (gameState.hound.hp <= 0 && !gameState.isExploring) { logMessage("獵犬處於重傷休克狀態，請餵食肉乾。", "system"); return; }
    gameState.isExploring = !gameState.isExploring;
    const btn = document.getElementById('btn-explore'); const stateEl = document.getElementById('hound-state'); const reportEl = document.getElementById('combat-report');
    if (gameState.isExploring) {
        btn.innerText = "HALT_EXPLORATION [停止探索]"; btn.style.borderColor = "#ff3333"; btn.style.color = "#ff3333";
        stateEl.innerText = "[探索中]"; stateEl.style.color = "var(--primary-color)"; reportEl.innerHTML = "波段掃描中...搜尋目標中...";
    } else {
        btn.innerText = "EXECUTE_AUTO_EXPLORE [啟動自動探索]"; btn.style.borderColor = "var(--primary-color)"; btn.style.color = "var(--primary-color)";
        stateEl.innerText = "[待命中]"; stateEl.style.color = "var(--text-color)"; reportEl.innerHTML = "探索中斷，返回營地。";
        gameState.currentEnemy = null;
    }
}

function handleExplorationTick() {
    if (!gameState.isExploring) return;
    const reportEl = document.getElementById('combat-report');
    if (!reportEl) return;

    // 1. 遇敵與區域過濾邏輯
    if (!gameState.currentEnemy) {
        let possibleEnemies = gameConfig.enemy_database;
        
        if (gameState.currentArea === "wasteland") {
            possibleEnemies = possibleEnemies.filter(e => e.atk <= 10);
        } else {
            const dungeon = gameConfig.dungeon_database.find(d => d.id === gameState.currentArea);
            if (dungeon) possibleEnemies = possibleEnemies.filter(e => dungeon.enemies.includes(e.name));
        }
        
        if (possibleEnemies.length === 0) possibleEnemies = [{ name: "系統錯誤代碼: 404_ENEMY", hp: 10, atk: 1 }];
        
        gameState.currentEnemy = { ...possibleEnemies[Math.floor(Math.random() * possibleEnemies.length)] };
        reportEl.innerHTML = `>> 遇敵：<span class='warning-text'>${gameState.currentEnemy.name}</span> (HP: ${gameState.currentEnemy.hp})`;
        return;
    }

    // 2. 戰鬥傷害邏輯
    let currentAtk = gameState.hound.totalAtk;
    let currentDef = gameState.hound.totalDef;
    let currentDodge = gameState.hound.totalDodge;
    let currentCrit = gameState.hound.totalCrit;
    
    let isCrit = Math.random() * 100 < currentCrit;
    let dmgDealt = isCrit ? currentAtk * 2 : currentAtk;

    if (isCrit && gameState.hound.activeSets.includes('thug_3pc')) dmgDealt = currentAtk * 3;

    let ohkoChance = gameState.hound.ohko || 0;
    if (Math.random() * 100 < ohkoChance) {
        dmgDealt = 999999;
        reportEl.innerHTML = `<span style="color:#ff2222;">>> [致命一擊] 觸發殭屍骰效果，直接秒殺！</span>`;
    } else {
        reportEl.innerHTML = `>> 獵犬發動攻擊，造成 ${dmgDealt} 點傷害${isCrit ? " <span style='color:var(--zaco-color);'>(暴擊)</span>" : ""}。`;
    }
    
    gameState.currentEnemy.hp -= dmgDealt;

    // 3. 敵方反擊與秒殺檢定
    if (gameState.currentEnemy.hp > 0) {
        if (Math.random() * 100 < currentDodge) { 
            reportEl.innerHTML += `<br>💨 [幻影] 獵犬靈巧地閃避了敵人的攻擊！`; 
        } else {
            let dmgTaken = Math.max(1, gameState.currentEnemy.atk - currentDef);
            gameState.hound.hp = Math.max(0, gameState.hound.hp - dmgTaken);
            reportEl.innerHTML += `<br>💥 遭受攻擊，裝甲抵禦後受傷 ${dmgTaken} 點。`;
            if (gameState.hound.activeSets.includes('abyss_3pc')) {
                let reflectDmg = Math.floor(dmgTaken * 0.5); 
                gameState.currentEnemy.hp -= reflectDmg;
                reportEl.innerHTML += ` <span style="color: #ff3333;">(反彈 ${reflectDmg} 傷害)</span>`;
            }
        }

        // 裝備檢定：秒殺警告
        if (gameState.hound.hp <= 0) {
            reportEl.innerHTML += `<br><b style="color:#ff3333; font-size:1.1rem;">💀 [SYSTEM_WARNING] 承受傷害超過極限，獵犬遭到秒殺！</b><br><span style="color:#ffaa00;">>> 系統提示：請提升【胸背帶】生命值與【頭盔】防禦力，或農出【滅世】級別武裝再進行挑戰。</span>`;
            if (gameState.isExploring) toggleExplore(); 
            return;
        }
    }

    // 4. 擊殺結算
    if (gameState.currentEnemy.hp <= 0) {
        reportEl.innerHTML += `<br>>> <span class='warning-text'>${gameState.currentEnemy.name}</span> 已被擊敗！`;
        
        let isBoss = gameState.currentEnemy.isBoss; // 紀錄剛才死掉的是不是霸主
        gameState.currentEnemy = null;
        
        let scrapGain = Math.floor(Math.random() * 5) + 1;
        let maxCap = getMaxScrap();
        let oldScrap = gameState.resources.scrap;
        
        // 加上戰鬥產出，但不超過上限
        gameState.resources.scrap = Math.min(gameState.resources.scrap + scrapGain, maxCap);
        
        let actualGain = gameState.resources.scrap - oldScrap;
        if (actualGain > 0) {
            reportEl.innerHTML += `<br>獲得 ${actualGain} 廢料。`;
        } else {
            reportEl.innerHTML += `<br><span style="color:#ff3333;">(廢料儲存已滿，無法回收更多)</span>`;
        }
        
        // 誘餌掉落機制 (15% 機率掉落)
        if (Math.random() * 100 < 15) {
            gameState.resources.baits = (gameState.resources.baits || 0) + 1;
            reportEl.innerHTML += `<br><span style="color:#ff5555; font-weight:bold;">>> 發現特殊物資：[Alpha 誘餌] x1！</span>`;
        }
        
        // ⚠️ 修正：使用非同步閉包依序 await，避免手機 IndexedDB 交易死鎖與 UI 凍結！
        (async () => {
            await generateLoot(false);
            if (isBoss) {
                reportEl.innerHTML += `<br><span style="color:#ffcc00;">>> 霸主倒下，噴出了大量的戰利品！</span>`;
                await generateLoot(true);
                await generateLoot(true); 
            // ⚠️ 新增：擊殺霸主時，有 35% 高機率解密尋獲【副本機密文件】！
                if (Math.random() < 0.35) {
                    const newLore = rollForLore("dungeon"); // 觸發副本文件抽獎
                    if (newLore) {
                        gameState.unlockedLore.push(newLore.id);
                        reportEl.innerHTML += `<br><b style="color:#d69e2e; font-size:1.05em;">📜 [機密解密] 尋獲副本檔案：《${newLore.title}》！</b>`;
                    }
                }
            } else if (Math.random() < 0.05) {
                // ⚠️ 新增：普通怪物也有 5% 微小機率掉落文件
                const newLore = rollForLore("dungeon");
                if (newLore) {
                    gameState.unlockedLore.push(newLore.id);
                    reportEl.innerHTML += `<br><span style="color:#d69e2e;">📜 尋獲殘破文件：《${newLore.title}》！</span>`;
                }
            }
        })();
    } // 閉合 if (gameState.currentEnemy.hp <= 0)

    // 5. 補血機制 (血量低於 75% 觸發)
    if (gameState.hound.hp < gameState.hound.maxHp * 0.75) {
        if (gameState.resources.food > 0) {
            gameState.resources.food--;
            let heal = Math.floor(gameState.hound.maxHp * 0.5);
            gameState.hound.hp = Math.min(gameState.hound.maxHp, gameState.hound.hp + heal);
            reportEl.innerHTML += `<br><span style="color:#55ff55;">>> 自動餵食肉乾，恢復 ${heal} HP。</span>`;
        } else {
            reportEl.innerHTML += `<br><span style="color:#ff3333;">>> 警告：物資耗盡，獵犬必須撤退！</span>`;
            if (gameState.isExploring) toggleExplore();
        }
    }
    
    updateUI();
    savePlayerState();
}

async function generateLoot(isBossDrop = false) {
    const r = Math.floor(Math.random() * 1000000);
    let rarity = "common", rarityText = "普通", rarityClass = "loot-common", statMult = 1; let isSet = false;
    
    if (isBossDrop) {
        // 霸主保底機制：95% 傳奇(金)，5% 滅世(紅)
        if (Math.random() * 100 < 5) { rarity = "apocalyptic"; rarityText = "滅世"; rarityClass = "loot-apocalyptic"; statMult = 5; }
        else { rarity = "legendary"; rarityText = "傳奇"; rarityClass = "loot-legendary"; statMult = 3; }
    } else {
        // 長線掉落率 (假設 1 小時約 720 次擊殺): 
        // 紅裝~4小時 (機率約 340/1M)
        if (gameState.currentArea !== "wasteland" && r > 999660) { 
            rarity = "apocalyptic"; rarityText = "滅世"; rarityClass = "loot-apocalyptic"; statMult = 5;
        } 
        // 金裝~0.5小時 (機率約 2700/1M)
        else if (r > 997300) { rarity = "legendary"; rarityText = "傳奇"; rarityClass = "loot-legendary"; statMult = 3; } 
        // 🚀 強化 1：綠裝(套裝)倍率由 2 提升至 2.4，完美界於稀有(1.8)與傳奇(3)正中間！
        else if (r > 988500) { rarity = "set"; rarityText = "套裝"; rarityClass = "loot-set"; statMult = 2.4; isSet = true; } 
        else if (r > 838500) { rarity = "rare"; rarityText = "稀有"; rarityClass = "loot-rare"; statMult = 1.8; }
    }

    // 裝備品質浮動機制 (同階級中的素質高低，模擬 2~6 小時的極品獲取)
    let qualityRoll = Math.random();
    let qualityMult = 1.0;
    if (qualityRoll > 0.95) qualityMult = 1.5; // 5% 極品素質 (大約掛幾小時才會出現一次頂值)
    else if (qualityRoll > 0.80) qualityMult = 1.25; // 15% 優良素質

    // 讀取副本專屬的屬性加成倍率 (loot_multiplier)
    let areaMultiplier = 1;
    if (gameState.currentArea !== "wasteland") {
        const dungeon = gameConfig.dungeon_database.find(d => d.id === gameState.currentArea);
        if (dungeon && dungeon.loot_multiplier) areaMultiplier = dungeon.loot_multiplier;
    }
    
    // 將基礎稀有度倍率 * 副本環境倍率 * 品質浮動倍率
    statMult = statMult * areaMultiplier * qualityMult;

    const pool = gameConfig.loot_pool;
    const slotKeys = ["helmet", "collar", "harness"];
    const slot = slotKeys[Math.floor(Math.random() * slotKeys.length)];
    const slotData = pool.slots[slot];
    const baseName = slotData.names[Math.floor(Math.random() * slotData.names.length)];

    let item = { slot: slot, slotText: slotData.typeName, rarity: rarity, class: rarityClass, atk: 0, maxHp: 0, def: 0, dodge: 0, crit: 0, setId: null, is_equipped: 0, is_locked: 0 };

    if (isSet) {
        const setKeys = Object.keys(pool.sets); const setId = setKeys[Math.floor(Math.random() * setKeys.length)];
        item.name = `[套裝] ${pool.sets[setId].name}・${baseName}`; item.setId = setId;
        // 🚀 強化 2：綠裝基礎數值大幅調高，並強制附加 1.5 倍補正，彌補無隨機詞條的劣勢！
        if (slot === 'collar') item.atk = Math.floor(6 * statMult * 1.5); 
        else if (slot === 'harness') item.maxHp = Math.floor(30 * statMult * 1.5); 
        else if (slot === 'helmet') item.def = Math.floor(5 * statMult * 1.5);
    } else {
        const affix = pool.affixes[Math.floor(Math.random() * pool.affixes.length)];
        item.name = `[${rarityText}] ${affix.name}${baseName}`;
        if (slot === 'collar') item.atk = Math.floor((Math.random() * 4 + 3) * statMult); else if (slot === 'harness') item.maxHp = Math.floor((Math.random() * 15 + 20) * statMult); else if (slot === 'helmet') item.def = Math.floor((Math.random() * 3 + 2) * statMult);
        if (affix.type === 'atk') item.atk += Math.floor(3 * statMult); if (affix.type === 'hp') item.maxHp += Math.floor(15 * statMult); if (affix.type === 'def') item.def += Math.floor(3 * statMult); if (affix.type === 'crit') item.crit += Math.floor(3 * statMult); if (affix.type === 'dodge') item.dodge += Math.floor(3 * statMult);
    }

    if (gameState.autoSell && gameState.autoSell[rarity]) {
        let val = rarity === 'rare' ? 5 : 1;
        gameState.resources.zaco += val;
        logMessage(`>> [自動拆解] 將 <span class="${item.class}">${item.name}</span> 轉換為 +${val} ZaCo`);
        return; 
    }

    await db.inventory_items.add(item);
    if (document.getElementById('tab-inv').classList.contains('active')) renderInventory();
    logMessage(`獲得戰利品: <span class="${item.class}">${item.name}</span>`);
}

function toggleAutoSell(type) { gameState.autoSell[type] = document.getElementById(`auto-${type}`).checked; savePlayerState(); }

async function equipItem(id) {
    const item = await db.inventory_items.get(id); if (!item) return;
    await db.inventory_items.where("slot").equals(item.slot).modify({ is_equipped: 0 });
    await db.inventory_items.update(id, { is_equipped: 1 });
    const equippedItems = await db.inventory_items.where("is_equipped").equals(1).toArray();
    gameState.equipped = { helmet: null, collar: null, harness: null };
    equippedItems.forEach(i => { gameState.equipped[i.slot] = i; });
    calculateHoundStats(); updateUI(); renderInventory();
    logMessage(`裝備成功：獵犬已配備 <span class="${item.class}">${item.name}</span>`);
}

async function unequipSlot(slot) {
    const item = gameState.equipped[slot]; if(!item) return;
    await db.inventory_items.update(item.id, { is_equipped: 0 });
    gameState.equipped[slot] = null;
    calculateHoundStats(); updateUI();
    if(document.getElementById('tab-inv').classList.contains('active')) renderInventory();
    logMessage(`>> 已卸下裝備：${item.name}`);
}

async function sellItem(event, id) {
    event.stopPropagation(); const item = await db.inventory_items.get(id); if (!item || item.is_locked) return;
    let val = 1; if(item.rarity==='rare') val=5; if(item.rarity==='set') val=80; if(item.rarity==='legendary') val=25; if(item.rarity==='apocalyptic') val=150;
    gameState.resources.zaco += val; await db.inventory_items.delete(id);
    logMessage(`出售 ${item.name}，獲得 <span style="color:var(--zaco-color)">+${val} ZaCo</span>`, 'zaco');
    updateUI(); renderInventory();
}

async function toggleLock(event, id) {
    event.stopPropagation(); const item = await db.inventory_items.get(id); if (!item) return;
    await db.inventory_items.update(id, { is_locked: item.is_locked ? 0 : 1 }); renderInventory();
}

let pendingEquipId = null;
async function showCompare(id) {
    const item = await db.inventory_items.get(id); if (!item) return;
    const currentEquip = gameState.equipped[item.slot];
    
    const buildStatsHTML = (eqItem, title) => {
        if(!eqItem) return `<div style="border:1px dashed #555; padding:8px;"><div style="color:#888; margin-bottom:5px;">[${title}]</div><span style="color:#555;">(無裝備)</span></div>`;
        return `<div style="border:1px dashed ${eqItem.is_equipped ? 'var(--text-color)' : 'var(--primary-color)'}; padding:8px;">
            <div style="color:#888; margin-bottom:5px;">[${title}]</div>
            <div class="${eqItem.class}" style="margin-bottom:5px; font-weight:bold;">${eqItem.name}</div>
            ${eqItem.atk ? `<div>ATK: ${eqItem.atk}</div>` : ''} ${eqItem.maxHp ? `<div>HP: ${eqItem.maxHp}</div>` : ''}
            ${eqItem.def ? `<div>DEF: ${eqItem.def}</div>` : ''} ${eqItem.crit ? `<div>CRIT: ${eqItem.crit}%</div>` : ''}
            ${eqItem.dodge ? `<div>DODGE: ${eqItem.dodge}%</div>` : ''}
        </div>`;
    };
    document.getElementById('compare-content').innerHTML = buildStatsHTML(currentEquip, "當前著裝") + buildStatsHTML(item, "準備換上");
    pendingEquipId = id; document.getElementById('compare-backdrop').style.display = 'block'; document.getElementById('compare-modal').style.display = 'block';
}

function closeCompare() { pendingEquipId = null; document.getElementById('compare-backdrop').style.display = 'none'; document.getElementById('compare-modal').style.display = 'none'; }
async function confirmEquip() { if(pendingEquipId) await equipItem(pendingEquipId); closeCompare(); }

async function renderInventory() {
    const list = document.getElementById('inventory-list');
    let items = await db.inventory_items.where("is_equipped").equals(0).toArray();
    
    const searchEl = document.getElementById('inv-search');
    if(searchEl && searchEl.value) {
        const searchQ = searchEl.value.toLowerCase();
        items = items.filter(i => i.name.toLowerCase().includes(searchQ));
    }
    
    const sortEl = document.getElementById('inv-sort');
    if(sortEl) {
        const sortQ = sortEl.value;
        const rWeights = { common: 1, rare: 2, set: 3, legendary: 4, apocalyptic: 5 };
        items.sort((a, b) => {
            if(sortQ === 'rarity-desc') return rWeights[b.rarity] - rWeights[a.rarity];
            if(sortQ === 'rarity-asc') return rWeights[a.rarity] - rWeights[b.rarity];
            if(sortQ === 'atk-desc') return (b.atk||0) - (a.atk||0);
            if(sortQ === 'hp-desc') return (b.maxHp||0) - (a.maxHp||0);
            return 0;
        });
    }

    if (items.length === 0) { list.innerHTML = "<span style='color:#777;'>[數據空載 / 無符合條件的裝備]</span>"; return; }
    list.innerHTML = "";
    items.forEach((item) => {
        const el = document.createElement('div'); el.className = 'inv-item';
        let price = 1; if(item.rarity==='rare') price=5; if(item.rarity==='set') price=80; if(item.rarity==='legendary') price=25; if(item.rarity==='apocalyptic') price=150;
        
        let descArr = []; 
        if (item.atk) descArr.push(`ATK +${item.atk}`); 
        if (item.maxHp) descArr.push(`HP +${item.maxHp}`); 
        if (item.def) descArr.push(`DEF +${item.def}`); 
        if (item.crit) descArr.push(`暴擊 +${item.crit}%`); 
        if (item.dodge) descArr.push(`閃避 +${item.dodge}%`); 
        
        // 🚀 新增：攔截套裝屬性並生成共鳴說明 UI (背包版)
        let setBonusHtml = "";
        if (item.rarity === 'set' && item.setId && gameConfig.loot_pool.sets[item.setId]) {
            const setInfo = gameConfig.loot_pool.sets[item.setId];
            descArr.push(`套裝: ${setInfo.name}`);
            setBonusHtml = `
            <div style="font-size:0.75rem; color:#00ff66; margin-top:5px; padding-top:5px; border-top:1px dashed #333;">
                <span style="display:block;">[2件套] ${setInfo['2pc']}</span>
                <span style="display:block;">[3件套] ${setInfo['3pc']}</span>
            </div>`;
        } else if (item.setId && gameConfig.loot_pool.sets[item.setId]) {
             descArr.push(`套裝: ${gameConfig.loot_pool.sets[item.setId].name}`);
        }
        
        const lockIcon = item.is_locked ? "🔒" : "🔓"; const lockColor = item.is_locked ? "var(--primary-color)" : "#555";
        el.innerHTML = `
            <div class="inv-info" onclick="showCompare(${item.id})">
                <span class="${item.class}">${item.name}</span><br>
                <span style="color:#888; font-size:0.75rem;">[${item.slotText}] ${descArr.length > 0 ? descArr.join(" | ") : "無附加"}</span>
                ${setBonusHtml}
            </div>
            <div style="display:flex; gap:5px; align-items: flex-start;">
                <button class="btn" style="width: auto; padding: 5px; margin: 0; border-color: ${lockColor}; color: ${lockColor};" onclick="toggleLock(event, ${item.id})">${lockIcon}</button>
                <button class="btn" style="width: auto; padding: 5px 10px; margin: 0; border-color: var(--zaco-color); color: var(--zaco-color);" onclick="sellItem(event, ${item.id})" ${item.is_locked ? 'disabled' : ''}>出售 ($${price})</button>
            </div>`;
        list.appendChild(el);
    });
}

async function buyShopItem(index) {
    const item = gameConfig.shop_database[index];
    if (gameState.resources.zaco >= item.price) {
        gameState.resources.zaco -= item.price;
        if (item.slot === 'usable' && item.id === 'shop_jerky_bulk') {
            // 防呆：如果原本就已經滿了，拒絕交易
            if (gameState.resources.food >= MAX_FOOD_CAP) {
                logMessage(`[交易失敗] 肉乾儲存槽已滿，黑市商人拒絕將補給包塞進你的背包。`, 'system');
                gameState.resources.zaco += item.price; // 退回剛剛扣除的 ZaCo
                updateUI();
                return;
            }
            
            // 加上 200 份，但最高鎖死在 400
            gameState.resources.food = Math.min(gameState.resources.food + 200, MAX_FOOD_CAP);
            logMessage(`地下交易完成: 拆開 <span class="${item.class}">${item.name}</span>，物資入庫。(當前: ${gameState.resources.food}/${MAX_FOOD_CAP})`, 'zaco');
        } else {
            const dbItem = { name: item.name, slot: item.slot, slotText: item.slot === 'collar' ? '項圈' : (item.slot === 'helmet' ? '頭盔' : '胸背帶'), rarity: item.rarity, class: item.class, atk: item.atk, maxHp: item.maxHp, def: item.def||0, is_equipped: 0, is_locked: 0, setId: item.setId||null };
            await db.inventory_items.add(dbItem);
            logMessage(`地下交易完成: 獲得 <span class="${item.class}">${item.name}</span>`, 'zaco');
        }
        updateUI(); savePlayerState();
    } else { logMessage(`[ZACO_ERROR] 帳戶餘額不足以支付黑市交易。`, 'system'); }
}

function renderShop() {
    const list = document.getElementById('shop-list'); list.innerHTML = "";
    gameConfig.shop_database.forEach((item, index) => {
        const el = document.createElement('div'); el.className = 'inv-item';
        let desc = item.desc ? item.desc : (item.atk > 0 ? `加成: ATK +${item.atk}` : `加成: HP +${item.maxHp}`);
        el.innerHTML = `<div class="inv-info"><span class="${item.class}">${item.name}</span><br><span style="color:#888; font-size:0.75rem;">${desc}</span></div><button class="btn" style="width: auto; padding: 6px 12px; margin: 0; border-color: var(--zaco-color); color: var(--zaco-color); font-weight:bold;" onclick="buyShopItem(${index})">購入 ($${item.price})</button>`;
        list.appendChild(el);
    });
}

function logMessage(text, type = 'normal') {
    const container = document.getElementById('log-container'); const entry = document.createElement('div');
    entry.className = `log-entry ${type}`; entry.innerHTML = `[${new Date().toLocaleTimeString()}] ${text}`;
    container.appendChild(entry); if (container.children.length > 4) container.removeChild(container.firstChild);
}

function updateUI() {
    // 強制 UI 顯示當前廢料與最大上限
    document.getElementById('res-scrap').innerText = `${gameState.resources.scrap} / ${getMaxScrap()}`;
    // 強制 UI 顯示當前肉乾與最大上限
    document.getElementById('res-food').innerText = `${gameState.resources.food} / ${MAX_FOOD_CAP}`;
    document.getElementById('res-zaco').innerText = gameState.resources.zaco;
    document.getElementById('rate-scrap').innerText = gameState.autoRates.scrap;
    document.getElementById('camp-drones').innerText = gameState.upgrades.drones;
    document.getElementById('hound-hp').innerText = gameState.hound.hp;
    if(document.getElementById('hound-max-hp')) document.getElementById('hound-max-hp').innerText = gameState.hound.maxHp;
    document.getElementById('btn-upgrade-drone').innerText = `DEPLOY_SCRAP_DRONE [成本: ${gameState.costs.drone} 廢料]`;
    
    document.getElementById('hound-total-atk').innerText = `${gameState.hound.totalAtk} (HP上限: ${gameState.hound.maxHp})`;
    document.getElementById('hound-def').innerText = gameState.hound.totalDef;
    document.getElementById('hound-crit').innerText = `${gameState.hound.totalCrit}%`;
    document.getElementById('hound-dodge').innerText = `${gameState.hound.totalDodge}%`;
    document.getElementById('hound-ohko').innerText = `${gameState.hound.ohko}%`;

    const equipDiv = document.getElementById('camp-equipped'); 
    let eqText = [];
    const buildEqLine = (slot, item) => {
        if(!item) return "";
        
        // 🚀 新增：攔截套裝屬性並生成共鳴說明 UI
        let setBonusHtml = "";
        if (item.rarity === 'set' && item.setId && gameConfig.loot_pool.sets[item.setId]) {
            const setInfo = gameConfig.loot_pool.sets[item.setId];
            setBonusHtml = `
            <div style="font-size:0.75rem; color:#00ff66; margin-top:3px; padding-left:5px; border-left:2px solid #00ff66;">
                <span style="display:block;">[2件套] ${setInfo['2pc']}</span>
                <span style="display:block;">[3件套] ${setInfo['3pc']}</span>
            </div>`;
        }

        return `<div style="display:flex; flex-direction:column; margin-bottom:5px; border-bottom:1px dashed #333; padding-bottom:5px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="${item.class}">[${item.slotText}] ${item.name}</span>
                <button class="btn" style="width:auto; padding:3px 8px; margin:0; font-size:0.75rem; border-color:#ff3333; color:#ff3333;" onclick="unequipSlot('${slot}')">卸下</button>
            </div>
            ${setBonusHtml}
        </div>`;
    };

    if (gameState.equipped.helmet) eqText.push(buildEqLine('helmet', gameState.equipped.helmet));
    if (gameState.equipped.collar) eqText.push(buildEqLine('collar', gameState.equipped.collar));
    if (gameState.equipped.harness) eqText.push(buildEqLine('harness', gameState.equipped.harness));
    equipDiv.innerHTML = eqText.length > 0 ? eqText.join("") : `<span style="color:#777;">[無裝備]</span>`;
}

function saveGame() { savePlayerState(); logMessage(">> 資料庫快照備份完成。", "system"); }
function resetGame() { if (confirm("確定格式化系統？這會永久抹除所有資料庫紀錄！")) { db.delete().then(() => { location.reload(); }); } }

function renderDungeonList() {
    const selectEl = document.getElementById('area-select');
    if (!selectEl) return;
    
    gameConfig.dungeon_database.forEach(dungeon => {
        const option = document.createElement('option');
        option.value = dungeon.id;
        option.innerText = `>> ${dungeon.name} [推薦 ATK: ${dungeon.req_atk}]`;
        selectEl.appendChild(option);
    });
    selectEl.value = gameState.currentArea;
}

function changeArea() {
    if (gameState.isExploring) {
        logMessage(">> 探索進行中，無法切換區域！請先停止探索。", "system");
        document.getElementById('area-select').value = gameState.currentArea;
        return;
    }
    gameState.currentArea = document.getElementById('area-select').value;
    
    // 切換影像觀測區圖片
    const imgEl = document.getElementById('area-image');
    const textEl = document.getElementById('area-image-text');
    if (gameState.currentArea !== 'wasteland') {
        const dungeon = gameConfig.dungeon_database.find(d => d.id === gameState.currentArea);
        if (dungeon && dungeon.img_url) {
            imgEl.src = dungeon.img_url; imgEl.style.display = 'block'; textEl.style.display = 'none';
        } else {
            imgEl.style.display = 'none'; textEl.style.display = 'block'; textEl.innerText = "[NO_SIGNAL_IMAGE_NOT_FOUND]";
        }
        logMessage(`>> 目標區域重新定位：${dungeon.name}`, "system");
    } else {
        imgEl.style.display = 'none'; textEl.style.display = 'block'; textEl.innerText = "[NO_SIGNAL_IMAGE_NOT_FOUND]";
        logMessage(`>> 目標區域重新定位：荒野外圍`, "system");
    }
}

// ====== 霸主召喚系統 ======
function summonBoss() {
    if (gameState.isExploring) {
        logMessage(">> 必須先停止自動探索，才能佈置誘餌！", "system");
        return;
    }
    if ((gameState.resources.baits || 0) < 5) {
        logMessage(">> [Alpha 誘餌] 數量不足！(需要 5 個)", "system");
        return;
    }
    
    // 依照當前區域決定霸主種類 (強度從資料庫借用高階怪物)
    let bossName = "狂暴野熊"; // 荒野預設霸主
    if (gameState.currentArea === "dungeon_1") bossName = "廢料聚合怪"; 
    else if (gameState.currentArea === "dungeon_2") bossName = "毒液噴射巨蛾";
    else if (gameState.currentArea === "dungeon_3") bossName = "舊時代軍用突擊犬";
    
    const bossTemplate = gameConfig.enemy_database.find(e => e.name === bossName);
    if (!bossTemplate) return;

    // 扣除誘餌並設定當前敵人 (血量兩倍、攻擊力 1.5 倍)
    gameState.resources.baits -= 5;
    gameState.currentEnemy = { 
        name: `[霸主] ${bossTemplate.name}`, 
        hp: bossTemplate.hp * 2, 
        atk: Math.floor(bossTemplate.atk * 1.5),
        isBoss: true  // 標記為霸主，死掉時才會爆寶
    };
    
    updateUI();
    logMessage(`>> ⚠️ 警告：探測到巨大生化反應！【${gameState.currentEnemy.name}】已被誘出！`, "system");
    
    // 自動開啟戰鬥
    toggleExplore();
	// 確保霸主出現時的日誌不被探索初始化刷掉
    const reportEl = document.getElementById('combat-report');
    if (reportEl) reportEl.innerHTML = `>> ⚠️ 探測到巨大生化反應！<br><span class='warning-text'>${gameState.currentEnemy.name}</span> (HP: ${gameState.currentEnemy.hp}) 已被誘出！`;
}

// 覆寫 updateUI 加入誘餌數量更新 (使用攔截器方式確保安全)
const originalUpdateUI = updateUI;
updateUI = function() {
    originalUpdateUI();
    const baitsEl = document.getElementById('res-baits');
    if (baitsEl) baitsEl.innerText = gameState.resources.baits || 0;
};

// ====== 一鍵批量拆解 ======
async function bulkSellItems() {
    const rarity = document.getElementById('bulk-sell-rarity').value;
    // 撈出背包裡所有的裝備
    const allItems = await db.inventory_items.toArray();
    
    // 核心過濾器：只挑選「品質相符」且「未裝備」且「未鎖定」的裝備
    const itemsToSell = allItems.filter(item => 
        item.rarity === rarity && 
        !item.is_equipped && 
        !item.is_locked
    );

    if (itemsToSell.length === 0) {
        logMessage(`>> [系統提示] 找不到可拆解的未鎖定 ${rarity} 級裝備！`, "system");
        return;
    }

    const idsToDelete = [];
    let totalZaco = 0; // 改為計算 ZaCo
    
    itemsToSell.forEach(item => {
        idsToDelete.push(item.id);
        // 依照品質給予不同數量的 ZaCo (對齊單件出售價格)
        if (item.rarity === 'common') totalZaco += 1;
        else if (item.rarity === 'rare') totalZaco += 5;
        else if (item.rarity === 'set') totalZaco += 80;
        else if (item.rarity === 'legendary') totalZaco += 25;
        else if (item.rarity === 'apocalyptic') totalZaco += 150;
        else totalZaco += 1;
    });

    // 透過 Dexie.js 的 bulkDelete 一次性刪除，效能最高
    await db.inventory_items.bulkDelete(idsToDelete);
    
    // 發放 ZaCo 並更新介面
    gameState.resources.zaco += totalZaco;
    savePlayerState();
    updateUI();
    renderInventory();
    
    logMessage(`>> [批量拆解] 成功銷毀 ${itemsToSell.length} 件武裝，黑市帳戶進帳 ${totalZaco} 枚 ZaCo。`, "zaco");
}



// ==========================================
// [06_BASE] 離線進度結算引擎 (Offline Sandbox)
// ==========================================
async function calculateOfflineProgress() {
    let now = Date.now();
    let timeDiffSeconds = Math.floor((now - baseData.lastLoginTime) / 1000); 
    
    // 離線超過 60 秒才進行結算，避免頻繁刷新誤判
    if (timeDiffSeconds > 60) {
        let offlineMinutes = (timeDiffSeconds / 60).toFixed(1);
        let offlineReport = `[系統重連] 離線時間：${offlineMinutes} 分鐘。<br>`;

        // --- 1. 中央控制室：廢料探測器收益 ---
        let maxCap = BASE_SCRAP_CAP + (baseData.ccLevel * 1000); 
        let scrapPerSecond = gameState.autoRates.scrap || 0; 
        let generatedScrap = timeDiffSeconds * scrapPerSecond;
        
        if (generatedScrap > 0) {
            let oldScrap = gameState.resources.scrap;
            if (gameState.resources.scrap < maxCap) {
                gameState.resources.scrap = Math.min(gameState.resources.scrap + generatedScrap, maxCap);
            }
            let actualGain = gameState.resources.scrap - oldScrap;
            if (actualGain > 0) {
                offlineReport += `>> 探測器回收 ${actualGain} 廢料 (當前上限: ${maxCap})。<br>`;
            } else {
                offlineReport += `>> <span style="color:#ff3333;">探測廢料儲存槽已達上限 (${maxCap})。</span><br>`;
            }
        }
		
		// --- 1.5 盲目癡愚的收音機 (離線博弈事件) ---
        // 離線必須超過 5 分鐘 (300秒) 才觸發收音機事件
        if (baseData.radioState && timeDiffSeconds >= 300) {
            const rand = Math.random() * 100;
            if (rand < 40) { 
                // 40% 機率：獲得 ZaCo
                let zacoFound = Math.floor(Math.random() * 15) + 5;
                gameState.resources.zaco += zacoFound;
                offlineReport += `>> 📻 [啟示] 收音機截獲地下交易頻段，尋獲 ${zacoFound} 枚 ZaCo。<br>`;
            } else if (rand < 70) { 
                // 30% 機率：獲得大量廢料
                let scrapFound = Math.floor(Math.random() * 150) + 50;
                let maxCap = getMaxScrap();
                gameState.resources.scrap = Math.min(gameState.resources.scrap + scrapFound, maxCap);
                offlineReport += `>> 📻 [啟示] 收音機解析出舊商隊路線，發掘 ${scrapFound} 廢料。<br>`;
            } else { 
                // 30% 機率：遭遇惡意詛咒 (扣除食物或生命值)
                if (gameState.resources.food >= 5) {
                    gameState.resources.food -= 5;
                    offlineReport += `>> 📻 <span style="color:#ff3333;">[詛咒] 詭異雜訊引發營地鼠患，損失 5 份肉乾。</span><br>`;
                } else {
                    let dmgTaken = Math.floor(gameState.hound.maxHp * 0.3);
                    gameState.hound.hp = Math.max(1, gameState.hound.hp - dmgTaken);
                    offlineReport += `>> 📻 <span style="color:#ff3333;">[詛咒] 刺耳狂亂的雜音令獵犬精神受創，扣除 ${dmgTaken} HP。</span><br>`;
                }
            }
        }
		
		// --- 1.7 誘餌廣播塔 (離線屍潮蓄力) ---
        if (baseData.towerLevel && baseData.towerLevel > 0) {
            let towerLv = baseData.towerLevel;
            let maxHours = 2 + (towerLv * 2);
            let maxZombies = maxHours * 60 * towerLv; // 蓄力最高上限
            
            // 每分鐘累積 [1 * 廣播塔Lv] 隻殭屍
            let timeDiffMinutes = Math.floor(timeDiffSeconds / 60);
            let newZombies = timeDiffMinutes * towerLv;
            
            if (newZombies > 0) {
                baseData.towerZombies = Math.min(maxZombies, (baseData.towerZombies || 0) + newZombies);
                offlineReport += `>> 📡 誘餌廣播塔在黑夜中持續廣播，吸引了新的屍群徘徊。<br>`;
            }
        }

        // --- 2. 副本完全離線掛機模擬 (Combat Sandbox) ---
        if (gameState.isExploring) {
            const tickRateSec = 5;
            let ticksToSimulate = Math.floor(timeDiffSeconds / tickRateSec);
            const maxTicks = 8640; 
            if (ticksToSimulate > maxTicks) ticksToSimulate = maxTicks;
            
            let enemiesKilled = 0;
            let foodConsumed = 0;
            let combatScrap = 0;
            let died = false;
            let def = gameState.hound.totalDef || 0;
            let dmgPerEncounter = Math.max(1, 15 - def); 

            // ⚠️ 新增：手機效能安全閥！限制離線掉寶最多 15 次，避免 Dexie 連續交易卡死主執行緒
            let maxOfflineLoot = 15;
            let lootCount = 0;

            for (let i = 0; i < ticksToSimulate; i++) {
                if (i > 0 && i % 3 === 0) {
                    enemiesKilled++;
                    combatScrap += Math.floor(Math.random() * 5) + 1;
                    
                    // 只有在上限內才執行非同步資料庫寫入
                    if (lootCount < maxOfflineLoot) {
                        await generateLoot(false);
                        lootCount++;
                    }
                    gameState.hound.hp -= dmgPerEncounter;
                }

                const healThreshold = gameState.hound.maxHp * 0.75;
                if (gameState.hound.hp <= healThreshold) {
                    if (gameState.resources.food > 0) {
                        gameState.hound.hp = Math.min(gameState.hound.maxHp, gameState.hound.hp + Math.floor(gameState.hound.maxHp * 0.5));
                        gameState.resources.food--;
                        foodConsumed++;
                    } else if (gameState.hound.hp <= 0) {
                        died = true;
                        break; 
                    }
                }
            }

            gameState.resources.scrap += combatScrap;
            offlineReport += `>> ⚔️ 探索戰報：擊殺 ${enemiesKilled} 隻怪物，戰鬥回收 ${combatScrap} 廢料。<br>`;
            if (lootCount >= maxOfflineLoot) offlineReport += `>> 🎒 [效能保護] 離線戰利品已達回收上限 (${maxOfflineLoot}件)，防止記憶體過載。<br>`;
            offlineReport += `>> 🍖 消耗肉乾：${foodConsumed} 份。<br>`;
            if (died) {
                gameState.isExploring = false;
                gameState.currentEnemy = null;
                gameState.hound.hp = 0;
                const btn = document.getElementById('btn-explore');
                if (btn) { btn.innerText = "EXECUTE_AUTO_EXPLORE [啟動自動探索]"; btn.style.borderColor = "var(--primary-color)"; btn.style.color = "var(--primary-color)"; }
                const stateEl = document.getElementById('hound-state');
                if (stateEl) { stateEl.innerText = "[重傷撤退]"; stateEl.style.color = "#ff3333"; }
                offlineReport += `>> <span style="color:#ff3333;">💀 [警告] 肉乾耗盡，獵犬重傷，已強制撤退！</span><br>`;
            }
        }

        // 統一輸出最終戰報
        logMessage(offlineReport, "system");
    }
    
    // 更新登入時間並存檔
    baseData.lastLoginTime = now;
    if (typeof updateBaseUI === "function") updateBaseUI();
    updateUI();
    renderInventory(); // 確保背包顯示剛剛打到的新裝備
    savePlayerState();
}

// ==========================================
// 🐕 [04] 倖存者派遣電台 & 📜 副本文件系統
// ==========================================

const HOUND_PREFIXES = ["鏽斑", "高壓", "狂暴", "霓虹", "輻射", "合金", "暗影", "血吻", "拾荒", "鐵顎"];
const HOUND_NAMES = ["巴迪", "芬里爾", "雷克斯", "齒輪", "三筒", "阿努比斯", "斯巴達", "狗蛋", "破片", "羅盤"];

// 產生隨機賽博廢土犬名
function generateHoundName() {
    const prefix = HOUND_PREFIXES[Math.floor(Math.random() * HOUND_PREFIXES.length)];
    const name = HOUND_NAMES[Math.floor(Math.random() * HOUND_NAMES.length)];
    return `[${prefix}] ${name}`;
}

// 招募派遣犬伴
function recruitDispatchHound() {
    if (gameState.dispatch.status === "running") {
        logMessage("⚠️ 該犬隻正在執行廢土探索，無法重新招募！", "warning");
        return;
    }
    dismissDispatchHound(false); // 若原本有狗，先安全解雇並歸還裝備
    
    gameState.dispatch.houndName = generateHoundName();
    updateDispatchUI();
    savePlayerState();
    logMessage(`🐶 招募成功！新犬伴 ${gameState.dispatch.houndName} 已就位待命！`, "success");
}

// 解雇傭兵犬（防呆：自動退還裝備至玩家背包）
function dismissDispatchHound(showMsg = true) {
    let returnedCount = 0;
    const gearSlots = ["head", "collar", "harness"];
    
    gearSlots.forEach(slot => {
        const item = gameState.dispatch.houndGear[slot];
        if (item !== null) {
            // 由於你的背包是 IndexedDB 結構，需非同步寫回資料庫
            db.inventory_items.add(item);
            gameState.dispatch.houndGear[slot] = null;
            returnedCount++;
        }
    });

    gameState.dispatch.houndName = "未招募";
    updateDispatchUI();
    savePlayerState();
    
    if (showMsg && returnedCount > 0) {
        logMessage(`♻️ 已解雇傭兵犬！身上裝備共 ${returnedCount} 件已自動退還至你的背包。`, "system");
        if (typeof renderInventory === "function") renderInventory();
    } else if (showMsg) {
        logMessage("👋 已解雇傭兵犬。", "system");
    }
}

// 開始派遣任務 (耗時 4 小時 / 消耗 200 ZaCo)
function startDispatchMission() {
    if (gameState.dispatch.houndName === "未招募") {
        logMessage("⚠️ 請先點擊招募一隻廢土犬伴才能進行派遣！", "warning");
        return;
    }
    if (gameState.dispatch.status === "running") {
        logMessage("⚠️ 犬伴已經在廢土探索中！", "warning");
        return;
    }
    if (gameState.resources.zaco < 200) {
        logMessage("⚠️ 黑市貨幣 (ZaCo) 不足，需要 200 ZaCo 購買探索補給！", "warning");
        return;
    }

    gameState.resources.zaco -= 200;
    gameState.dispatch.status = "running";
    gameState.dispatch.endTime = Date.now() + (4 * 60 * 60 * 1000); // 4 小時後完成
    
    updateUI();
    updateDispatchUI();
    savePlayerState();
    logMessage(`📡 ${gameState.dispatch.houndName} 已出發前往廢土深處！預計 4 小時後歸來。`, "system");
}

// 領取派遣獎勵與掉落結算
function claimDispatchReward() {
    if (gameState.dispatch.status !== "running" || Date.now() < gameState.dispatch.endTime) {
        logMessage("⏳ 探索尚未完成，犬伴還在廢土中奔波...", "warning");
        return;
    }

    // 1. 基礎獎勵：廢料 (受限於當前儲存上限)
    const scrapReward = Math.floor(Math.random() * 401) + 800; // 800~1200 廢料
    let maxCap = typeof getMaxScrap === "function" ? getMaxScrap() : 1000;
    let oldScrap = gameState.resources.scrap;
    gameState.resources.scrap = Math.min(gameState.resources.scrap + scrapReward, maxCap);
    let actualScrap = gameState.resources.scrap - oldScrap;

    let msg = `🎉 ${gameState.dispatch.houndName} 探索歸來！獲得：+${actualScrap} 廢料`;

    // 2. 刷寶判定：15% 機率尋獲文件 (Lore)
    if (Math.random() <= 0.15) {
        const newLore = rollForLore("dispatch");
        if (newLore) {
            gameState.unlockedLore.push(newLore.id);
            msg += ` | 📜 尋獲機密文件：《${newLore.title}》！`;
        }
    }

    gameState.dispatch.status = "idle";
    updateUI();
    updateDispatchUI();
    savePlayerState();
    logMessage(msg, "success");
}

// 從 JSON 資料庫抽取「尚未解鎖」的文件
function rollForLore(sourceType) {
    if (!gameConfig || !gameConfig.lore_database) return null;
    
    let availableLores = [];
    gameConfig.lore_database.categories.forEach(cat => {
        cat.subcategories.forEach(sub => {
            sub.items.forEach(item => {
                if ((item.sourceType === sourceType || item.sourceType === "all") && 
                    !gameState.unlockedLore.includes(item.id)) {
                    availableLores.push(item);
                }
            });
        });
    });

    if (availableLores.length === 0) return null;
    return availableLores[Math.floor(Math.random() * availableLores.length)];
}

// 更新家園派遣卡片的 UI 顯示
function updateDispatchUI() {
    const statusEl = document.getElementById("dispatch-status-text");
    const startBtn = document.getElementById("btn-start-dispatch");
    if (!statusEl || !startBtn) return;

    if (gameState.dispatch.houndName === "未招募") {
        statusEl.innerHTML = `<span style="color:#a0aec0;">[尚未招募犬伴]</span>`;
        startBtn.innerText = "招募派遣犬伴 (免費)";
        startBtn.onclick = recruitDispatchHound;
        startBtn.style.borderColor = "#48bb78";
        startBtn.style.color = "#48bb78";
    } else if (gameState.dispatch.status === "running") {
        if (Date.now() >= gameState.dispatch.endTime) {
            statusEl.innerHTML = `<span style="color:#48bb78; font-weight:bold;">[探索完成！等待召回]</span>`;
            startBtn.innerText = "領取探索物資 & 文件";
            startBtn.onclick = claimDispatchReward;
            startBtn.style.borderColor = "#48bb78";
            startBtn.style.color = "#48bb78";
        } else {
            let remainMin = Math.ceil((gameState.dispatch.endTime - Date.now()) / 60000);
            statusEl.innerHTML = `<span style="color:#63b3ed;">[${gameState.dispatch.houndName} 探索中... 剩餘約 ${remainMin} 分]</span>`;
            startBtn.innerText = "探索進行中...";
            startBtn.onclick = () => logMessage("⏳ 犬伴還在危險的廢土中，請耐心等待。", "warning");
            startBtn.style.borderColor = "#a0aec0";
            startBtn.style.color = "#a0aec0";
        }
    } else {
        statusEl.innerHTML = `<span style="color:#ffae00;">[待命 - ${gameState.dispatch.houndName}]</span>`;
        startBtn.innerText = "派遣探索 (-200 ZaCo)";
        startBtn.onclick = startDispatchMission;
        startBtn.style.borderColor = "#ffae00";
        startBtn.style.color = "#ffae00";
    }
}

// --- 📖 終端機資料庫 (Lore Modal) UI 渲染 ---

function openLoreModal() {
    const modal = document.getElementById("lore-modal");
    const backdrop = document.getElementById("lore-backdrop");
    
    if (backdrop) backdrop.style.display = "none"; // 徹底棄用半透明背景
    if (modal) {
        modal.style.display = "block";
        modal.scrollTop = 0; // 確保每次開啟終端機時，畫面絕對在最頂端
    }
    renderLoreList();
}

function closeLoreModal() {
    const modal = document.getElementById("lore-modal");
    if (modal) modal.style.display = "none";
}

function showLoreList() {
    const listView = document.getElementById("lore-list-view");
    const detailView = document.getElementById("lore-detail-view");
    const container = document.getElementById("lore-list-container");
    if (!listView || !detailView || !container || !gameConfig || !gameConfig.lore_database) return;

    listView.style.display = "block";
    detailView.style.display = "none";
    container.innerHTML = "";

    gameConfig.lore_database.categories.forEach(cat => {
        let catHtml = `<div class="lore-category-title" style="color:#d69e2e; font-size:1.1em; margin-top:12px; border-bottom:1px solid #cbd5e0; padding-bottom:4px;">📂 ${cat.name}</div>`;
        
        cat.subcategories.forEach(sub => {
            catHtml += `<div class="lore-category-title" style="margin-left:8px; font-size:0.95em; color:#2b6cb0;">└ 📁 ${sub.name}</div>`;
            
            sub.items.forEach(item => {
                const isUnlocked = gameState.unlockedLore.includes(item.id);
                const titleText = isUnlocked ? item.title : "？？？ (機密檔案加密中)";
                const btnClass = isUnlocked ? "lore-item-btn unlocked" : "lore-item-btn";
                const clickAction = isUnlocked ? `onclick="readLore('${item.id}')"` : `onclick="alert('🔒 此文件尚未解密！請透過派遣電台或挑戰對應副本取得。')"`;
                
                // ⚠️ 修正：加上 margin-bottom 與 display:flex 兩端對齊，讓手機觸控按鈕整齊又美觀
                catHtml += `
                    <button class="${btnClass}" style="margin-left:16px; margin-bottom:8px; width:calc(100% - 16px); display:flex; justify-content:space-between; align-items:center; padding:10px 12px; text-align:left;" ${clickAction}>
                        <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:75%;">${isUnlocked ? "📜" : "🔒"} ${titleText}</span>
                        <span style="font-size:0.75em; color:#718096; flex-shrink:0;">[${item.sourceType === 'dispatch' ? '派遣' : '副本'}]</span>
                    </button>
                `;
            });
        });
        container.innerHTML += catHtml;
    });
}

// ==========================================
// 📜 終端機文件系統：核心檢索與視窗網格控制（全螢幕優化版）
// ==========================================
// ✨ 精準替換 game.js 中的 readLore 函式
function readLore(loreId) {
    const targetLore = gameConfig.lore_database.find(l => l.id === loreId);
    if (!targetLore) return;

    const listView = document.getElementById("lore-list-view");
    const detailView = document.getElementById("lore-detail-view");
    const titleEl = document.getElementById("lore-read-title");
    const locationEl = document.getElementById("lore-read-location");
    const dateEl = document.getElementById("lore-read-date");
    const bodyEl = document.getElementById("lore-read-body");
    const modal = document.getElementById("lore-modal"); // 抓取母彈窗實體

    if (!listView || !detailView) return;

    // 🚀 關鍵修復 1：切換進閱讀模式時，強制將全螢幕視窗滾動條置頂
    if (modal) modal.scrollTop = 0;

    // 3. 視圖切換：隱藏列表，顯示詳情
    listView.style.display = "none";
    detailView.style.display = "block";
    
    // 🚀 關鍵修復 2：利用全螢幕優勢，左右拉寬到 14px 舒適排版，底部一口氣空出 80px 絕對不被手機瀏覽器工具欄遮擋！
    detailView.style.padding = "10px 14px 80px 14px"; 
    detailView.style.boxSizing = "border-box";

    // 4. 安全填入文本
    if (titleEl) titleEl.innerText = `📜 ${targetLore.title}`;
    if (locationEl) locationEl.innerText = `📍 來源: ${targetLore.location || "未知區域"}`;
    if (dateEl) dateEl.innerText = `⏳ 時間: ${targetLore.date || "大崩潰紀錄"}`;
    
    if (bodyEl) {
        bodyEl.style.lineHeight = "1.75"; // 微調行高，讓字體更易閱讀
        bodyEl.style.whiteSpace = "pre-wrap";
        bodyEl.style.textAlign = "justify";
        bodyEl.style.marginTop = "15px";
        bodyEl.style.paddingBottom = "40px"; // 內文最末端加強緩衝
        bodyEl.style.color = "#e2e8f0";
        bodyEl.innerHTML = targetLore.content || "（檔案內容嚴重損毀...）";
    }
}

// ✨ 精準替換 game.js 中的 showLoreList 函式
function showLoreList() {
    const detailView = document.getElementById("lore-detail-view");
    const listView = document.getElementById("lore-list-view");
    const modal = document.getElementById("lore-modal"); // 抓取母彈窗實體

    if (detailView) detailView.style.display = "none";
    if (listView) listView.style.display = "block";
    
    // 🚀 關鍵修復：返回列表頁面時，同步將滾動條歸零置頂，確保列表第一項清晰可見
    if (modal) modal.scrollTop = 0;
}

// ✨ 精準對接 index.html 第 434 與 435 行：負責關閉整個檔案面板與背景遮罩
function closeLoreModal() {
    const modal = document.getElementById("lore-modal");
    const backdrop = document.getElementById("lore-backdrop");
    if (modal) modal.style.display = "none";
    if (backdrop) backdrop.style.display = "none";
}