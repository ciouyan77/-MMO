// --- [06_BASE] 家園設施邏輯 ---

// 🛡️ 防呆初始化：確保全域變數存在，完全棄用容易引發 TDZ 的 baseData
function initBaseState() {
    if (typeof gameState === 'undefined' || !gameState) return false;
    
    // 將家園數據強制掛載於 gameState.base，確保與存檔系統完美同步
    if (!gameState.base) {
        gameState.base = { ccLevel: 0, radioState: false, dispatchLevel: 0 };
    }
    // 🔧 [新增] 相容舊存檔，注入廣播塔數據
    if (gameState.base.towerLevel === undefined) {
        gameState.base.towerLevel = 0;
        gameState.base.towerLastDetonate = Date.now();
    }
    
    if (!gameState.dispatch) {
        gameState.dispatch = { status: "idle", houndName: "未招募", endTime: 0, houndGear: { head: null, collar: null, harness: null } };
    }
    return true;
}


// 更新家園分頁的所有 UI 數值
function updateBaseUI() {
    if (typeof initBaseState === 'function') {
        if (!initBaseState()) return;
    }

    // 🛡️ 核心防呆裝甲：確保 Dexie 存檔已經成功注入 gameState
    if (typeof gameState === 'undefined' || !gameState || !gameState.base) {
        console.warn(">> [SYS_WARN] 存檔載入中，暫停渲染家園 UI...");
        return; 
    }
    const safeBaseData = gameState.base;

        // 1. 中央控制室 (Lv.Max 限制)
    let currentLevel = safeBaseData.ccLevel || 0;
    // 🔧 [修改] 滿等限制改為 14 (畫面上顯示 Lv.15)
    let isMax = currentLevel >= 14; 
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
            }
        } else {
            if (btn) btn.disabled = false; 
            costEl.innerText = ccCost;
        }
    }

    
    // 2. 收音機狀態 (改用 safeBaseData)
    const radioBtn = document.getElementById('btn-radio-state');
    if (radioBtn) {
        if (safeBaseData.radioState) {
            radioBtn.innerText = "[目前狀態: 啟動] TURN_OFF";
            radioBtn.style.borderColor = "#55aaff"; radioBtn.style.color = "#55aaff";
        } else {
            radioBtn.innerText = "[目前狀態: 關閉] TURN_ON";
            radioBtn.style.borderColor = "#888"; radioBtn.style.color = "#888";
        }
    }

    // 3. 誘餌廣播塔 (🚀 實裝：離線蓄力系統)
    let towerLvl = safeBaseData.towerLevel || 0;
    const towerChargeEl = document.getElementById('base-tower-charge');
    const towerBtn = document.getElementById('btn-detonate-tower');
    const towerUpBtn = document.getElementById('btn-upgrade-tower');

    if (towerLvl === 0) {
        if (towerChargeEl) towerChargeEl.innerText = "未建置 (等待授權指令)";
        if (towerBtn) { towerBtn.disabled = true; towerBtn.innerText = "請先建置廣播塔"; }
        if (towerUpBtn) { towerUpBtn.innerText = "BUILD FACILITY [消耗: 1500 廢料]"; towerUpBtn.disabled = false; }
    } else {
        let maxZombies = towerLvl * 150; // Lv1:150, Lv2:300, Lv3:450
        let zpm = towerLvl; // 每分鐘吸引數量 (隨等級提升)
        let minPassed = Math.floor((Date.now() - (safeBaseData.towerLastDetonate || Date.now())) / 60000);
        let currentZombies = Math.min(minPassed * zpm, maxZombies);
        let percent = Math.floor((currentZombies / maxZombies) * 100);

        if (towerChargeEl) towerChargeEl.innerText = `${currentZombies} / ${maxZombies} 隻感染者 (蓄力 ${percent}%)`;
        if (towerBtn) {
            towerBtn.disabled = currentZombies === 0;
            towerBtn.innerText = currentZombies > 0 ? `DETONATE_EMP [收割 ${currentZombies} 隻]` : "DETONATE_EMP [蓄力中...]";
        }
        if (towerUpBtn) {
            if (towerLvl >= 3) {
                towerUpBtn.innerText = "廣播塔已達最大功率 (Lv.Max)";
                towerUpBtn.disabled = true;
                towerUpBtn.style.color = "#666"; towerUpBtn.style.borderColor = "#333";
            } else {
                let cost = towerLvl * 3500; // 升級費用: 3500, 7000
                towerUpBtn.innerText = `UPGRADE FACILITY [消耗: ${cost} 廢料]`;
            }
        }
    }

    
    // 4. 派遣電台 (改用 safeBaseData，🚀 升級兩次即滿等)
    let dispatchLvl = safeBaseData.dispatchLevel || 0;
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

// 收音機開關切換邏輯 (改用 gameState.base)
function toggleRadio() {
    if (!initBaseState()) return;
    
    if (gameState.base.radioState === undefined) gameState.base.radioState = false;
    gameState.base.radioState = !gameState.base.radioState;
    
    updateBaseUI();
    if (typeof savePlayerState === 'function') savePlayerState();
    
    if (typeof logMessage === 'function') {
        if (gameState.base.radioState) {
            logMessage(`📻 [雜訊] 收音機已開啟。虛空中的低語開始在營地迴盪...`, 'system');
        } else {
            logMessage(`📻 [靜音] 切斷收音機電源。空間恢復了令人安心的死寂。`, 'system');
        }
    }
}

// 一鍵引爆廣播塔收割殭屍 (🚀 實裝：保底與驚喜 Gacha 機制)
function detonateTower() {
    if (!initBaseState()) return;
    let lvl = gameState.base.towerLevel || 0;
    if (lvl === 0) return;

    let maxZombies = lvl * 150;
    let minPassed = Math.floor((Date.now() - (gameState.base.towerLastDetonate || Date.now())) / 60000);
    let currentZombies = Math.min(minPassed * lvl, maxZombies);

    if (currentZombies <= 0) {
        if (typeof logMessage === 'function') logMessage("⚠️ 雷達顯示周圍尚無感染者，節省你的 EMP 能量。", "warning");
        return;
    }

    // 保底資源計算
    let getScrap = currentZombies * 5;            // 滿載 450 隻可得 2250 廢料
    let getZaco = Math.floor(currentZombies / 10); // 滿載可得 45 ZaCo
    let getFood = Math.floor(currentZombies / 50); // 滿載可得 9 肉乾

    // 結算廢料 (防禦溢出)
    let maxCap = typeof getMaxScrap === "function" ? getMaxScrap() : 1000;
    let oldScrap = gameState.resources.scrap;
    gameState.resources.scrap = Math.min(gameState.resources.scrap + getScrap, maxCap);
    let actualScrap = gameState.resources.scrap - oldScrap;

    gameState.resources.zaco = (gameState.resources.zaco || 0) + getZaco;
    gameState.resources.food = (gameState.resources.food || 0) + getFood;

    // 🎲 爆寶期待感 (Gacha Hook): 蓄力越滿，獲得隱藏保險箱的機率越高！每 10 隻加 1% (最高 45%)
    let rareChance = (currentZombies / 10) * 0.01; 
    let gachaMsg = "";
    if (Math.random() < rareChance) {
        let bonusZaco = Math.floor(Math.random() * 100) + 50; // 額外獲得 50~150 ZaCo
        gameState.resources.zaco += bonusZaco;
        gachaMsg = ` 🎁 【大爆發】你在焦黑的殘骸中發現了黑市保險箱！額外獲得 ${bonusZaco} ZaCo！`;
    }

    // 重置時間軸與存檔
    gameState.base.towerLastDetonate = Date.now();
    updateBaseUI();
    if (typeof window.updateUI === 'function') window.updateUI();
    if (typeof savePlayerState === 'function') savePlayerState();

    if (typeof logMessage === 'function') {
        logMessage(`💥 [EMP 引爆] 刺眼的藍光瞬間燒毀了 ${currentZombies} 隻感染者！獲得: +${actualScrap} 廢料, +${getZaco} ZaCo, +${getFood} 肉乾。${gachaMsg}`, "success");
    }
}



// 升級設施共用函數
function upgradeFacility(facility) {
    if (!initBaseState()) return;

    if (facility === 'controlCenter') {
        // 🔧 [修改] 中央控制室最高擴容改為 14 級
        if ((gameState.base.ccLevel || 0) >= 14) {
            if (typeof logMessage === 'function') logMessage(`[系統] 中央控制室已達最高擴容等級 (Lv.15)。`, 'warning');
            return;
        }
        let cost = Math.floor(500 * Math.pow(1.35, gameState.base.ccLevel || 0));

        if (gameState.resources.scrap >= cost) {
            gameState.resources.scrap -= cost;
            gameState.base.ccLevel = (gameState.base.ccLevel || 0) + 1;
            let capStr = typeof getMaxScrap === "function" ? getMaxScrap() : "未知";
            if (typeof logMessage === 'function') logMessage(`[系統] 系統擴容成功。中央控制室升級至 Lv.${gameState.base.ccLevel} (廢料上限: ${capStr})`, 'system');
            updateBaseUI(); 
            if (typeof window.updateUI === 'function') window.updateUI();
            if (typeof savePlayerState === 'function') savePlayerState();
        } else {
            if (typeof logMessage === 'function') logMessage(`[警告] 廢料不足，擴容需要 ${cost} 廢料`, 'zaco');
        }
        
    } else if (facility === 'tower') {
        // 🚀 實裝：廣播塔升級邏輯
        let lvl = gameState.base.towerLevel || 0;
        if (lvl >= 3) return; 
        
        let cost = lvl === 0 ? 1500 : lvl * 3500;
        if (gameState.resources.scrap >= cost) {
            gameState.resources.scrap -= cost;
            gameState.base.towerLevel = lvl + 1;
            gameState.base.towerLastDetonate = Date.now(); // 升級時重置計時器，防 Bug
            if (typeof logMessage === 'function') logMessage(`[系統] 誘餌廣播塔已連線！目前等級: Lv.${gameState.base.towerLevel}`, 'system');
            updateBaseUI(); 
            if (typeof window.updateUI === 'function') window.updateUI();
            if (typeof savePlayerState === 'function') savePlayerState();
        } else {
            if (typeof logMessage === 'function') logMessage(`[警告] 廢料不足，廣播塔建造/升級需要 ${cost} 廢料`, 'zaco');
        }
        
    } else if (facility === 'dispatch') {
        // (保留你原本派遣電台的代碼，無需修改)
        if ((gameState.base.dispatchLevel || 0) >= 2) {
            if (typeof logMessage === 'function') logMessage(`[系統] 派遣電台已達最高功率 (Max)。`, 'warning');
            return;
        }
        let cost = Math.floor(6000 * Math.pow(1.8, gameState.base.dispatchLevel || 0));
        
        if (gameState.resources.scrap >= cost) {
            gameState.resources.scrap -= cost;
            gameState.base.dispatchLevel = (gameState.base.dispatchLevel || 0) + 1;
            if (typeof logMessage === 'function') logMessage(`[系統] 派遣電台功率提升！升級至 Lv.${gameState.base.dispatchLevel}`, 'system');
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

// 從 JSON 資料庫抽取「尚未解鎖」的文件
function rollForLore(sourceType) {
    if (!gameConfig || !gameConfig.lore_database) return null;
    
    let availableLores = [];
    gameConfig.lore_database.categories.forEach(cat => {
        cat.subcategories.forEach(sub => {
            sub.items.forEach(item => {
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
        if (typeof window.renderInventory === "function") window.renderInventory();
    } else if (showMsg) {
        if (typeof logMessage === 'function') logMessage("👋 已解雇傭兵犬。", "system");
    }
}

// 🚀 實裝：動態派遣時間 (0等: 4小時, 1等: 2小時, 2等: 30分鐘)
function getDispatchDuration() {
    let lvl = (typeof gameState !== 'undefined' && gameState.base && gameState.base.dispatchLevel) ? gameState.base.dispatchLevel : 0;
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

// 🛡️ 確保畫面啟動 (改為安全掛載)
document.addEventListener('DOMContentLoaded', () => {
    console.log(">> [SYS_OK] 家園模組介面掛載完畢，等待本地存檔注入...");
});
