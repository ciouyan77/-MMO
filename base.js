

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

function healHound() {
    if (gameState.hound.hp >= gameState.hound.maxHp) return;
    if (gameState.resources.food >= 1) {
        gameState.resources.food--;
        // 🚀 微創優化：改為計算總血量的 25% (無條件捨去小數點)
        let healAmount = Math.floor(gameState.hound.maxHp * 0.25);
        gameState.hound.hp = Math.min(gameState.hound.hp + healAmount, gameState.hound.maxHp);
        
        updateUI(); 
        savePlayerState(); 
        logMessage(`餵食肉乾，恢復 ${healAmount} HP (25%)。[${gameState.hound.hp}/${gameState.hound.maxHp}]`);
    }
}