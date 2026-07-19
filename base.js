// --- [06_BASE] 家園設施邏輯 ---

// 🛡️ 防呆初始化：確保全域變數存在
function initBaseState() {
    if (typeof baseData === 'undefined') window.baseData = {};
    if (typeof gameState === 'undefined' || !gameState) return false;
    if (!gameState.dispatch) {
        gameState.dispatch = { status: "idle", houndName: "未招募", endTime: 0, houndGear: { head: null, collar: null, harness: null } };
    }
    return true;
}

// 更新家園分頁的所有 UI 數值
function updateBaseUI() {
    if (!initBaseState()) return;

    // 1. 中央控制室 (Lv.Max 限制)
    let currentLevel = baseData.ccLevel || 0;
    let isMax = currentLevel >= 9; // 達到 Lv9 (即畫面上的 Lv.10) 視為滿等
    let ccCost = Math.floor(500 * Math.pow(1.35, currentLevel));

    if (document.getElementById('base-cc-level')) {
        document.getElementById('base-cc-level').innerText = isMax ? "Max" : currentLevel;
    }
    
    let costEl = document.getElementById('base-cc-cost');
    if (costEl) {
        let btn = costEl.closest('button'); 
        if (isMax) {
            if (btn) {
                btn.innerText = "擴充完成";
                btn.disabled = true; 
                btn.style.color = "#666";
                btn.style.borderColor = "#333";
            } else {
                costEl.innerText = "擴充完成";
            }
        } else {
            if (btn) btn.disabled = false; // 防呆恢復
            costEl.innerText = ccCost;
        }
    }
    
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

    // 3. 誘餌廣播塔 (實體封印：暫未實裝離線功能，隱藏處理)
    const towerChargeEl = document.getElementById('base-tower-charge');
    if (towerChargeEl) towerChargeEl.innerText = "系統尚未實裝 (Offline Module Missing)";
    
    // 4. 派遣電台 (🚀 升級兩次即滿等)
    let dispatchLvl = baseData.dispatchLevel || 0;
    let isDispatchMax = dispatchLvl >= 2;
    let dispatchCost = Math.floor(6000 * Math.pow(1.8, dispatchLvl));
    
    if (document.getElementById('base-dispatch-level')) {
        document.getElementById('base-dispatch-level').innerText = isDispatchMax ? "Max" : dispatchLvl;
    }
    
    let dCostEl = document.getElementById('base-dispatch-cost');
    if (dCostEl) {
        let dBtn = dCostEl.closest('button');
        if (isDispatchMax) {
            if (dBtn) {
                dBtn.innerText = "電台已達最高功率";
                dBtn.disabled = true;
                dBtn.style.color = "#666";
                dBtn.style.borderColor = "#333";
            }
        } else {
            if (dBtn) dBtn.disabled = false;
            dCostEl.innerText = dispatchCost;
        }
    }

    if (typeof updateDispatchUI === "function") updateDispatchUI();
}

// 收音機開關切換邏輯
function toggleRadio() {
    if (!initBaseState()) return;
    if (baseData.radioState === undefined) baseData.radioState = false;
    baseData.radioState = !baseData.radioState;
    
    updateBaseUI();
    if (typeof savePlayerState === 'function') savePlayerState();
    
    if (typeof logMessage === 'function') {
        if (baseData.radioState) {
            logMessage(`📻 [雜訊] 收音機已開啟。虛空中的低語開始在營地迴盪...`, 'system');
        } else {
            logMessage(`📻 [靜音] 切斷收音機電源。空間恢復了令人安心的死寂。`, 'system');
        }
    }
}

// 一鍵引爆廣播塔收割殭屍 (暫時封印)
function detonateTower() {
    if (typeof logMessage === 'function') logMessage("⚠️ 廣播塔系統正在進行底層重構，暫停使用。", "warning");
}

// 升級設施共用函數
function upgradeFacility(facility) {
    if (!initBaseState()) return;

    if (facility === 'controlCenter') {
        if ((baseData.ccLevel || 0) >= 9) {
            if (typeof logMessage === 'function') logMessage(`[系統] 中央控制室已達最高擴容等級 (Lv.10)。`, 'warning');
            return;
        }
        let cost = Math.floor(500 * Math.pow(1.35, baseData.ccLevel || 0));

        if (gameState.resources.scrap >= cost) {
            gameState.resources.scrap -= cost;
            baseData.ccLevel = (baseData.ccLevel || 0) + 1;
            let capStr = typeof getMaxScrap === "function" ? getMaxScrap() : "未知";
            if (typeof logMessage === 'function') logMessage(`[系統] 系統擴容成功。中央控制室升級至 Lv.${baseData.ccLevel} (廢料上限: ${capStr})`, 'system');
            updateBaseUI(); 
            if (typeof window.updateUI === 'function') window.updateUI();
 
            if (typeof savePlayerState === 'function') savePlayerState();
        } else {
            if (typeof logMessage === 'function') logMessage(`[警告] 廢料不足，擴容需要 ${cost} 廢料`, 'zaco');
        }
    } else if (facility === 'tower') {
        if (typeof logMessage === 'function') logMessage(`[系統] 廣播塔功能暫未開放升級。`, 'warning');
    } else if (facility === 'dispatch') {
        // 🚀 實裝：2 級滿等限制
        if ((baseData.dispatchLevel || 0) >= 2) {
            if (typeof logMessage === 'function') logMessage(`[系統] 派遣電台已達最高功率 (Max)。`, 'warning');
            return;
        }
        let cost = Math.floor(6000 * Math.pow(1.8, baseData.dispatchLevel || 0));
        
        if (gameState.resources.scrap >= cost) {
            gameState.resources.scrap -= cost;
            baseData.dispatchLevel = (baseData.dispatchLevel || 0) + 1;
            if (typeof logMessage === 'function') logMessage(`[系統] 派遣電台功率提升！升級至 Lv.${baseData.dispatchLevel}`, 'system');
            updateBaseUI(); 
            if (typeof window.updateUI === 'function') window.updateUI();
 
            if (typeof savePlayerState === 'function') savePlayerState();
        } else {
            if (typeof logMessage === 'function') logMessage(`[警告] 廢料不足，升級電台需要 ${cost} 廢料`, 'zaco');
        }
    }
}

function healHound() {
    if (!initBaseState()) return;
    if (gameState.hound.hp >= gameState.hound.maxHp) return;
    if (gameState.resources.food >= 1) {
        gameState.resources.food--;
        let healAmount = Math.floor(gameState.hound.maxHp * 0.25);
        gameState.hound.hp = Math.min(gameState.hound.hp + healAmount, gameState.hound.maxHp);
        
        if (typeof window.updateUI === 'function') window.updateUI();
 
        if (typeof savePlayerState === 'function') savePlayerState(); 
        if (typeof logMessage === 'function') logMessage(`餵食肉乾，恢復 ${healAmount} HP (25%)。[${gameState.hound.hp}/${gameState.hound.maxHp}]`);
    }
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
                // 🚀 修正：自動兼容 "dungeon" 與 "combat" 命名，並保留 "all" 通用掉落
                const isSourceMatch = item.sourceType === sourceType || 
                                      item.sourceType === "all" || 
                                      (sourceType === "dungeon" && item.sourceType === "combat") ||
                                      (sourceType === "combat" && item.sourceType === "dungeon");

                if (isSourceMatch && !gameState.unlockedLore.includes(item.id)) {
                    availableLores.push(item);
                }
            });

        });
    });

    if (availableLores.length === 0) return null;
    return availableLores[Math.floor(Math.random() * availableLores.length)];
}

function updateDispatchUI() {
    if (!initBaseState()) return;
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
            startBtn.onclick = () => { if (typeof logMessage === 'function') logMessage("⏳ 犬伴還在危險的廢土中，請耐心等待。", "warning"); };
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

function recruitDispatchHound() {
    if (!initBaseState()) return;
    if (gameState.dispatch.status === "running") {
        if (typeof logMessage === 'function') logMessage("⚠️ 該犬隻正在執行廢土探索，無法重新招募！", "warning");
        return;
    }
    if (typeof dismissDispatchHound === 'function') dismissDispatchHound(false); 
    
    gameState.dispatch.houndName = generateHoundName();
    updateDispatchUI();
    if (typeof savePlayerState === 'function') savePlayerState();
    if (typeof logMessage === 'function') logMessage(`🐶 招募成功！新犬伴 ${gameState.dispatch.houndName} 已就位待命！`, "success");
}

function dismissDispatchHound(showMsg = true) {
    if (!initBaseState()) return;
    let returnedCount = 0;
    const gearSlots = ["head", "collar", "harness"];
    
    gearSlots.forEach(slot => {
        const item = gameState.dispatch.houndGear[slot];
        if (item !== null && typeof db !== 'undefined') {
            db.inventory_items.add(item);
            gameState.dispatch.houndGear[slot] = null;
            returnedCount++;
        }
    });

    gameState.dispatch.houndName = "未招募";
    updateDispatchUI();
    if (typeof savePlayerState === 'function') savePlayerState();
    
    if (showMsg && returnedCount > 0) {
        if (typeof logMessage === 'function') logMessage(`♻️ 已解雇傭兵犬！身上裝備共 ${returnedCount} 件已自動退還至你的背包。`, "system");
        if (typeof renderInventory === "function") renderInventory();
    } else if (showMsg) {
        if (typeof logMessage === 'function') logMessage("👋 已解雇傭兵犬。", "system");
    }
}

// 🚀 實裝：動態派遣時間 (0等: 4小時, 1等: 2小時, 2等: 30分鐘)
function getDispatchDuration() {
    let lvl = (typeof baseData !== 'undefined' && baseData.dispatchLevel) ? baseData.dispatchLevel : 0;
    if (lvl === 0) return 4 * 60 * 60 * 1000; // 4小時
    if (lvl === 1) return 2 * 60 * 60 * 1000; // 2小時
    return 30 * 60 * 1000;                     // 2等(滿等) 30分鐘
}

function startDispatchMission() {
    if (!initBaseState()) return;
    if (gameState.dispatch.houndName === "未招募") {
        if (typeof logMessage === 'function') logMessage("⚠️ 請先點擊招募一隻廢土犬伴才能進行派遣！", "warning");
        return;
    }
    if (gameState.dispatch.status === "running") {
        if (typeof logMessage === 'function') logMessage("⚠️ 犬伴已經在廢土探索中！", "warning");
        return;
    }
    if (gameState.resources.zaco < 200) {
        if (typeof logMessage === 'function') logMessage("⚠️ 黑市貨幣 (ZaCo) 不足，需要 200 ZaCo 購買探索補給！", "warning");
        return;
    }

    gameState.resources.zaco -= 200;
    gameState.dispatch.status = "running";
    
    // 🚀 使用動態計算的時間
    let durationMs = getDispatchDuration();
    gameState.dispatch.endTime = Date.now() + durationMs; 
    let hoursStr = (durationMs / (60 * 60 * 1000)).toFixed(1).replace('.0', '');
    
    if (typeof window.updateUI === 'function') window.updateUI();
    updateDispatchUI();
    if (typeof savePlayerState === 'function') savePlayerState();
    if (typeof logMessage === 'function') logMessage(`📡 ${gameState.dispatch.houndName} 已出發前往廢土深處！預計 ${hoursStr} 小時後歸來。`, "system");
}

function claimDispatchReward() {
    if (!initBaseState()) return;
    if (gameState.dispatch.status !== "running" || Date.now() < gameState.dispatch.endTime) {
        if (typeof logMessage === 'function') logMessage("⏳ 探索尚未完成，犬伴還在廢土中奔波...", "warning");
        return;
    }

    const scrapReward = Math.floor(Math.random() * 401) + 800; 
    let maxCap = typeof getMaxScrap === "function" ? getMaxScrap() : 1000;
    let oldScrap = gameState.resources.scrap;
    gameState.resources.scrap = Math.min(gameState.resources.scrap + scrapReward, maxCap);
    let actualScrap = gameState.resources.scrap - oldScrap;

    let msg = `🎉 ${gameState.dispatch.houndName} 探索歸來！獲得：+${actualScrap} 廢料`;

    if (Math.random() <= 0.15) {
        const newLore = typeof rollForLore === 'function' ? rollForLore("dispatch") : null;
        if (newLore) {
            gameState.unlockedLore.push(newLore.id);
            msg += ` | 📜 尋獲機密文件：《${newLore.title}》！`;
        }
    }

    gameState.dispatch.status = "idle";
    if (typeof window.updateUI === 'function') window.updateUI();

    updateDispatchUI();
    if (typeof savePlayerState === 'function') savePlayerState();
    if (typeof logMessage === 'function') logMessage(msg, "success");
}

// 🛡️ 確保畫面啟動
document.addEventListener('DOMContentLoaded', () => {
    if (typeof updateBaseUI === 'function') updateBaseUI();
});
