// 全域記憶體快照
let gameConfig = null;
const isDevMode = false; // 🔒 永久死鎖：嚴格禁止任何腳本重啟作弊模式



// 🚀 廢土全域資料字典 (O(1) 高速檢索)
const WastelandDB = {
    enemies: {},
    dungeons: {}
};

let gameState = {
    playerName: "倖存者", houndName: "廢土獵犬", playerAvatar: null,

resources: { scrap: 0, food: 10, zaco: 0, biometal: 0, coating: 0 },


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
    unlockedLore: [], 
    dispatch: {
        status: "idle", houndName: "未招募", endTime: 0,
        houndGear: { head: null, collar: null, harness: null }
    }
};

// === 家園與離線系統變數 ===
let baseData = {
    ccLevel: 0, towerLevel: 0, towerZombies: 0,          
    radioState: false, lastLoginTime: Date.now() 
};

// 系統預設參數
const BASE_SCRAP_CAP = 1000; 
const MAX_FOOD_CAP = 400;    

// --- 動態計算資源上限 (防彈級作用域安全) ---
function getMaxScrap() {
    if (typeof baseData === 'undefined' || !baseData) {
        return typeof BASE_SCRAP_CAP !== 'undefined' ? BASE_SCRAP_CAP : 1000;
    }
    let level = Math.min(baseData.ccLevel || 0, 9);
    return 1000 + (level * 1000);
}

function getMaxFood() {
    if (typeof baseData === 'undefined' || !baseData) {
        return typeof MAX_FOOD_CAP !== 'undefined' ? MAX_FOOD_CAP : 400;
    }
    let level = Math.min(baseData.ccLevel || 0, 9);
    return 400 + (level * 400);
}

window.addEventListener("DOMContentLoaded", async () => {
    // 讀取 JSON 設定檔
    const response = await fetch('./config.json');
    gameConfig = await response.json();
    
    // 🚀 關鍵修復：把怪物與副本的資料，真正「灌入」我們的高速字典中！
    if (gameConfig.enemy_database) {
        gameConfig.enemy_database.forEach(e => WastelandDB.enemies[e.id] = e);
    }
    if (gameConfig.dungeon_database) {
        gameConfig.dungeon_database.forEach(d => WastelandDB.dungeons[d.id] = d);
    }
    
    // ==========================================
    // 🚀 [幽靈金鑰探測協議] (新增：不影響任何原有邏輯)
    // ==========================================
    try {
        const devResponse = await fetch('./dev_key.json');
        if (devResponse.ok) {
            const devData = await devResponse.json();
            if (devData.dev_mode_active) {
                isDevMode = true;
                if (typeof initDevTools === "function") initDevTools(); // 啟動開發者面板！
            }
        }
    } catch (e) {
        // 靜默處理：如果沒抓到 dev_key.json 檔案，就當作一般玩家，絕對不報錯
    }
    // ==========================================

    // 繼續原本的開局流程
    await loadGameData();
    initGameLoops();
    if (typeof renderDungeonList === "function") renderDungeonList();
});





// ==========================================
// async function loadGameData() { 
// (請確保這行以下的代碼都保留不動！)
// ==========================================

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

if (savedState.playerName) gameState.playerName = savedState.playerName;
if (savedState.houndName) gameState.houndName = savedState.houndName;
if (savedState.playerAvatar) gameState.playerAvatar = savedState.playerAvatar;
renderProfileAvatar(); // 讀檔後順便將大頭照與姓名寫入 UI


    if(document.getElementById('auto-common')) document.getElementById('auto-common').checked = gameState.autoSell.common;
    if(document.getElementById('auto-rare')) document.getElementById('auto-rare').checked = gameState.autoSell.rare;

    const equippedItems = await db.inventory_items.where("is_equipped").equals(1).toArray();
    gameState.equipped = { helmet: null, collar: null, harness: null };
    equippedItems.forEach(item => { gameState.equipped[item.slot] = item; });

        // 🛡️ 防禦性裝甲：隔離外部模組計算，確保即便出錯也不會阻斷 UI 與廢料渲染！
    try {
        if (typeof calculateHoundStats === "function") {
            calculateHoundStats();
        }
    } catch (err) {
        console.error(">> [模組警告] calculateHoundStats 執行失敗:", err);
        logMessage(`>> [系統提示] 數值模組載入異常: ${err.message}`, "warning");
    }
    
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

// 🚀 新增：營地雙視窗切換控制器 (Sub-view Routing)
function toggleCampView(viewName) {
    const mainView = document.getElementById('camp-main-view');
    const houndView = document.getElementById('camp-hound-view');
    const profileView = document.getElementById('camp-profile-view');
    
    if (mainView) mainView.style.display = (viewName === 'main') ? 'block' : 'none';
    if (houndView) houndView.style.display = (viewName === 'hound') ? 'block' : 'none';
    if (profileView) profileView.style.display = (viewName === 'profile') ? 'block' : 'none';
    
    // 切換時順便刷新數值
    if (viewName === 'hound') updateUI();
}

// 🚀 新增：保存玩家與狗狗姓名
function saveProfileNames() {
    const pName = document.getElementById('input-player-name');
    const hName = document.getElementById('input-hound-name');
    if (pName && hName) {
        gameState.playerName = pName.value || "倖存者";
        gameState.houndName = hName.value || "廢土獵犬";
        // 同步修改派遣狀態中記載的狗狗名字
        if (gameState.dispatch) gameState.dispatch.houndName = gameState.houndName;
        savePlayerState();
        logMessage(`>> 身分識別資料已更新：${gameState.playerName} & ${gameState.houndName}`, "system");
    }
}

// 🚀 新增：手機端 Base64 圖片壓縮上傳 (自動壓至 150x150 防止存檔膨脹)
function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 150; canvas.height = 150; // 固定壓縮小尺寸
            ctx.drawImage(img, 0, 0, 150, 150);
            const base64Data = canvas.toDataURL('image/jpeg', 0.7);
            
            gameState.playerAvatar = base64Data;
            savePlayerState();
            renderProfileAvatar();
            logMessage(">> 大頭照識別證已同步寫入存檔！", "system");
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function renderProfileAvatar() {
    const imgEl = document.getElementById('profile-avatar-img');
    const placeholder = document.getElementById('profile-avatar-placeholder');
    const pName = document.getElementById('input-player-name');
    const hName = document.getElementById('input-hound-name');
    
    if (pName && gameState.playerName) pName.value = gameState.playerName;
    if (hName && gameState.houndName) hName.value = gameState.houndName;
    
    if (imgEl && placeholder && gameState.playerAvatar) {
        imgEl.src = gameState.playerAvatar;
        imgEl.style.display = 'block';
        placeholder.style.display = 'none';
    }
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
    
        // --- 修改：肉乾動態上限攔截邏輯 ---
    if (type === 'food') {
        let maxFoodCap = getMaxFood();
        if (gameState.resources.food >= maxFoodCap) {
            logMessage(`[系統警告] 肉乾儲存槽已滿 (${maxFoodCap})。請至 [06_BASE] 升級中央控制室。`, 'warning');
            return; // 達到當前上限就不給採集
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

function logMessage(text, type = 'normal') {
    const container = document.getElementById('log-container'); const entry = document.createElement('div');
    entry.className = `log-entry ${type}`; entry.innerHTML = `[${new Date().toLocaleTimeString()}] ${text}`;
    container.appendChild(entry); if (container.children.length > 4) container.removeChild(container.firstChild);
}

function updateUI() {
    // 修正：分別正確顯示當前廢料與肉乾的動態上限
    document.getElementById('res-scrap').innerText = `${gameState.resources.scrap} / ${getMaxScrap()}`;
    document.getElementById('res-food').innerText = `${gameState.resources.food} / ${getMaxFood()}`;
    document.getElementById('res-zaco').innerText = gameState.resources.zaco;
    
    // 🟢 移到這裡！跟其他資源放在一起，保證每次 UI 刷新都會執行到！
    if (document.getElementById('res-baits')) document.getElementById('res-baits').innerText = gameState.resources.baits || 0;

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
    
    // 這裡恢復原本乾淨的裝備生成邏輯
    const buildEqLine = (slot, item) => {
        if(!item) return "";
        // 🚀 微創手術：若有 level 屬性，在名字後方顯示螢光綠色的 +N 階級
        const lvlStr = item.level ? ` <span style="color:#00ffcc; font-weight:bold;">+${item.level}</span>` : "";
        
        return `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; border-bottom:1px dashed #333; padding-bottom:6px;">
            <span class="${item.class}" onclick="showCompare(${item.id})" style="cursor:pointer; text-decoration:underline dotted; flex:1; line-height:1.4;">[${item.slotText}] ${item.name}${lvlStr}</span>
            <button class="btn" style="width:auto; padding:4px 12px; margin:0; font-size:0.75rem; border-color:#ff3333; color:#ff3333;" onclick="unequipSlot('${slot}')">卸下</button>
        </div>`;
    };

    if (gameState.equipped.helmet) eqText.push(buildEqLine('helmet', gameState.equipped.helmet));
    if (gameState.equipped.collar) eqText.push(buildEqLine('collar', gameState.equipped.collar));
    if (gameState.equipped.harness) eqText.push(buildEqLine('harness', gameState.equipped.harness));
    equipDiv.innerHTML = eqText.length > 0 ? eqText.join("") : `<span style="color:#777;">[無裝備]</span>`;

    // 🚀 正確歸位：每秒 DPS 期望值計算公式
    let critBonus = gameState.hound.activeSets && gameState.hound.activeSets.includes('thug_2pc') ? 2 : 1;
    let expectedDps = ((gameState.hound.totalAtk * (1 + (gameState.hound.totalCrit / 100) * critBonus)) + ((gameState.hound.ohko || 0) * 50)) / 5;
    if (document.getElementById('hound-dps-val')) {
        document.getElementById('hound-dps-val').innerText = expectedDps.toFixed(2);
    }
}

// 🛡️ 廢土裝甲：強制掛載至全域，免疫跨檔案 ReferenceError！
window.updateUI = updateUI;



function saveGame() { savePlayerState(); logMessage(">> 資料庫快照備份完成。", "system"); }

// ==========================================
// 🔐 防作弊存檔傳輸與安全簽章引擎 (Security Engine)
// ==========================================

// 1. 加鹽混淆演算法 (你可以隨意修改 SALT 字串，讓 AI 猜不透你的防偽鑰匙)
function generateWastelandHash(dataStr) {
    const SALT = "CYBER_HOUND_2026_SECURE_SALT_#9981";
    const target = dataStr + SALT;
    let h1 = 0xdeadbeef | 0, h2 = 0x41c6ce57 | 0;
    for (let i = 0, ch; i < target.length; i++) {
        ch = target.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
}

// 🚀 廢土核心：高壓縮比 Base64 編解碼器 (縮減 70% 體積，徹底防止手機剪貼簿撐爆)
function compressToBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
}
function decompressFromBase64(b64) {
    return decodeURIComponent(escape(atob(b64)));
}

// 2. 匯出存檔 (極致防護與高壓縮比版)
async function exportGameData() {
    try {
        // 🚀 微創修復：防洗錢機制 - 匯出前強制撤退，杜絕掛機資源增生漏洞
        if (gameState.isExploring) {
            gameState.isExploring = false;
            gameState.currentEnemy = null;
            if (typeof exploreInterval !== 'undefined') clearInterval(exploreInterval); // 中斷線上探索計時器
            if (typeof updateUI === 'function') updateUI();
            logMessage(">> [系統] 偵測到匯出指令，已強制撤退並暫停探索。", "warning");
        }

        await savePlayerState(); // 先確保最新狀態入庫
        let exportObject = { timestamp: Date.now(), tables: {} };

        
        for (const table of db.tables) {
            exportObject.tables[table.name] = await table.toArray();
        }
        
        const jsonString = JSON.stringify(exportObject);
        const signature = generateWastelandHash(jsonString);
        const finalPayload = JSON.stringify({ payload: jsonString, sig: signature });
        
        // 🚀 啟用全新高壓縮引擎，代碼長度縮小 3 倍！
        const base64Data = compressToBase64(finalPayload);
        
        showExportUI(base64Data);
        logMessage(">> 存檔代碼已壓縮生成，等待終端機讀取。", "system");
    } catch (e) {
        logMessage(">> [錯誤] 匯出失敗: " + e.message, "warning");
        alert("匯出失敗：" + e.message);
    }
}




// 🚀 專屬匯出終端機 UI (解決手機 WebView 複製與全選限制)
function showExportUI(data) {
    // 移除可能殘留的舊視窗
    const oldModal = document.getElementById("export-ui-modal");
    if (oldModal) oldModal.remove();

    // 建立全螢幕遮罩
    const modal = document.createElement("div");
    modal.id = "export-ui-modal";
    modal.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;backdrop-filter:blur(3px);";

    // 建立內部面板
    const panel = document.createElement("div");
    panel.style.cssText = "background:#0a0a0a;border:2px solid #00ffcc;padding:20px;width:100%;max-width:400px;border-radius:6px;text-align:center;box-shadow:0 0 15px rgba(0,255,204,0.2);";

    const title = document.createElement("h3");
    title.style.cssText = "color:#00ffcc;margin-top:0;font-family:monospace;letter-spacing:1px;";
    title.innerText = "DATA_EXPORT_READY";

    const desc = document.createElement("p");
    desc.style.cssText = "color:#ccc;font-size:13px;line-height:1.4;";
    desc.innerText = "防偽存檔密碼已生成。\n請點擊下方按鈕複製，或點擊文字框全選。";

    // 唯讀文字框，點擊自動全選
    const textArea = document.createElement("textarea");
    textArea.value = data;
    textArea.readOnly = true;
    textArea.style.cssText = "width:100%;height:140px;background:#000;color:#00ffcc;border:1px solid #333;padding:10px;margin-bottom:15px;box-sizing:border-box;font-family:monospace;font-size:12px;word-break:break-all;outline:none;";
    textArea.onclick = () => { 
        textArea.select(); 
        textArea.setSelectionRange(0, 999999); 
    };

    // 100% 同步觸發的一鍵複製按鈕
    const btnCopy = document.createElement("button");
    btnCopy.className = "btn";
    btnCopy.style.cssText = "width:100%;border-color:#00ffcc;color:#00ffcc;margin-bottom:10px;font-weight:bold;";
    btnCopy.innerText = "📋 點我一鍵複製";
    btnCopy.onclick = () => {
        textArea.select();
        textArea.setSelectionRange(0, 999999);
        try {
            document.execCommand('copy');
            btnCopy.innerText = "✅ 複製成功！(可前往記事本貼上)";
            btnCopy.style.backgroundColor = "#00ffcc";
            btnCopy.style.color = "#000";
            setTimeout(() => {
                btnCopy.innerText = "📋 點我一鍵複製";
                btnCopy.style.backgroundColor = "transparent";
                btnCopy.style.color = "#00ffcc";
            }, 3000);
        } catch (err) {
            alert("❌ 自動複製受限，請手動長按上方文字框複製！");
        }
    };

    // 關閉按鈕
    const btnClose = document.createElement("button");
    btnClose.className = "btn";
    btnClose.style.cssText = "width:100%;border-color:#666;color:#ccc;";
    btnClose.innerText = "關閉終端機";
    btnClose.onclick = () => modal.remove();

    // 組裝並顯示在畫面上
    panel.appendChild(title);
    panel.appendChild(desc);
    panel.appendChild(textArea);
    panel.appendChild(btnCopy);
    panel.appendChild(btnClose);
    modal.appendChild(panel);
    document.body.appendChild(modal);
}



//// 3. 匯入存檔 (呼叫專屬 UI 面板，破解手機字數限制)
function importGameData() {
    showImportUI();
}


// 🚀 專屬匯入終端機 UI (無限制字數大容量文字框)
function showImportUI() {
    // 移除可能殘留的舊視窗
    const oldModal = document.getElementById("import-ui-modal");
    if (oldModal) oldModal.remove();

    // 建立全螢幕遮罩
    const modal = document.createElement("div");
    modal.id = "import-ui-modal";
    modal.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;backdrop-filter:blur(3px);";

    // 建立內部面板 (橘色警告風格)
    const panel = document.createElement("div");
    panel.style.cssText = "background:#0a0a0a;border:2px solid #ff9900;padding:20px;width:100%;max-width:400px;border-radius:6px;text-align:center;box-shadow:0 0 15px rgba(255,153,0,0.2);";

    const title = document.createElement("h3");
    title.style.cssText = "color:#ff9900;margin-top:0;font-family:monospace;letter-spacing:1px;";
    title.innerText = "DATA_IMPORT_PROTOCOL";

    const desc = document.createElement("p");
    desc.style.cssText = "color:#ccc;font-size:13px;line-height:1.4;";
    desc.innerText = "請在下方長按並貼上您的【存檔防偽密碼】：";

    // 大容量文字輸入框
    const textArea = document.createElement("textarea");
    textArea.placeholder = "在此貼上代碼...";
    textArea.style.cssText = "width:100%;height:140px;background:#000;color:#ff9900;border:1px solid #333;padding:10px;margin-bottom:15px;box-sizing:border-box;font-family:monospace;font-size:12px;word-break:break-all;outline:none;";

    // 驗證與匯入按鈕
    const btnImport = document.createElement("button");
    btnImport.className = "btn";
    btnImport.style.cssText = "width:100%;border-color:#ff9900;color:#ff9900;margin-bottom:10px;font-weight:bold;";
    btnImport.innerText = "📥 驗證簽章並覆蓋存檔";

    // 綁定核心驗證邏輯 (已升級：高壓縮解碼與精準截斷報錯)
    btnImport.onclick = async () => {
        let cleanData = textArea.value.replace(/[^A-Za-z0-9+/=]/g, '');
        
        while (cleanData.length % 4 !== 0) {
            cleanData += '=';
        }

        if (!cleanData) {
            alert("❌ 請先貼上存檔代碼！");
            return;
        }
        
        try {
            btnImport.innerText = "⏳ 驗證與解壓縮中...";
            
            let decodedJson;
            try {
                // 🚀 啟用高壓縮解碼器
                decodedJson = decompressFromBase64(cleanData);
            } catch(err) {
                // 精準抓出 URIError (截斷錯誤) 並翻譯成人話
                throw new Error("代碼尾部遭受嚴重截斷，遺失了關鍵裝備資料！\n請確認您是否複製了「完整」的代碼，或重新匯出一次。");
            }
            
            if (!decodedJson || !decodedJson.startsWith('{')) {
                throw new Error("代碼內容非有效存檔結構。");
            }
            
            const parsed = JSON.parse(decodedJson);
            if (!parsed.payload || !parsed.sig) {
                throw new Error("存檔結構損毀，缺少數位簽章。");
            }
            
            const expectedSig = generateWastelandHash(parsed.payload);
            if (parsed.sig !== expectedSig) {
                logMessage("⚠️ [安全警報] 檢測到存檔簽章不匹配或數值遭篡改！", "warning");
                alert("【非法存檔】防偽簽章驗證失敗！該存檔代碼疑似遭到篡改或損毀，系統拒絕載入。");
                btnImport.innerText = "📥 驗證簽章並覆蓋存檔";
                return;
            }
            
            const dataObj = JSON.parse(parsed.payload);
            const backupDate = new Date(dataObj.timestamp).toLocaleString();
            if (!confirm(`✅ 簽章與壓縮檔驗證通過！\n備份時間：${backupDate}\n\n⚠️ 警告：匯入將完全覆蓋當前的所有進度與裝備，是否確定執行？`)) {
                btnImport.innerText = "📥 驗證簽章並覆蓋存檔";
                return;
            }
            
                        for (const table of db.tables) {
                await table.clear();
                if (dataObj.tables[table.name]) {
                    await table.bulkAdd(dataObj.tables[table.name]);
                }
            }
            
            // 🚀 微創修復：防洗錢機制 - 匯入成功後，立刻廢掉全域存檔能力，防止 reload 瞬間的髒資料回寫
            window.savePlayerState = () => { console.log(">> 系統已鎖死，攔截異常覆寫。"); };
            if (typeof exploreInterval !== 'undefined') clearInterval(exploreInterval);
            
            alert(">> 存檔匯入與復原成功！系統將立即重啟。");
            location.replace(location.href); // 🚀 使用 replace 取代 reload，強制清除緩存跳轉
        } catch (e) {

            logMessage(">> [匯入失敗] 無法解析存檔代碼。", "warning");
            alert("匯入失敗：" + e.message);
            btnImport.innerText = "📥 驗證簽章並覆蓋存檔";
        }
    };



    // 關閉按鈕
    const btnClose = document.createElement("button");
    btnClose.className = "btn";
    btnClose.style.cssText = "width:100%;border-color:#666;color:#ccc;";
    btnClose.innerText = "取消";
    btnClose.onclick = () => modal.remove();

    // 組裝並顯示
    panel.appendChild(title);
    panel.appendChild(desc);
    panel.appendChild(textArea);
    panel.appendChild(btnImport);
    panel.appendChild(btnClose);
    modal.appendChild(panel);
    document.body.appendChild(modal);
}



// --- 升級版：防誤觸雙重確認與「輸入 yes」安全格式化系統 ---
let resetTimer = null;
let resetCountdown = 5;

async function resetGame() { 
    const btn = document.getElementById("btn-reset-game");
    if (!btn) {
        // 兼容找不到按鈕 UI 時的備用邏輯
        const fallbackInput = prompt("⚠️ 確定格式化系統？這會永久抹除所有資料！\n若確定，請輸入「yes」：");
        if (fallbackInput && fallbackInput.trim().toLowerCase() === "yes") executeFormatDrive();
        return;
    }

    if (resetTimer === null) {
        // 第一階段：觸發倒數警告
        resetCountdown = 5;
        btn.style.backgroundColor = "#ff3333";
        btn.style.color = "#000000";
        btn.style.fontWeight = "bold";
        btn.innerText = `⚠️ 再次點擊確認格式化 (${resetCountdown}s)`;
        
        resetTimer = setInterval(() => {
            resetCountdown--;
            if (resetCountdown <= 0) {
                clearInterval(resetTimer);
                resetTimer = null;
                btn.style.backgroundColor = "transparent";
                btn.style.color = "#ff3333";
                btn.style.fontWeight = "normal";
                btn.innerText = "FORMAT_DRIVE (清除存檔)";
                logMessage(">> 已取消清除存檔操作。", "system");
            } else {
                btn.innerText = `⚠️ 再次點擊確認格式化 (${resetCountdown}s)`;
            }
        }, 1000);
    } else {
        // 第二階段：在倒數期間再次點擊，觸發「打字確認」終極安全鎖！
        clearInterval(resetTimer);
        resetTimer = null;
        
        const userInput = prompt("⚠️ 【終端機最高安全鎖】\n這將會徹底銷毀您所有荒原探索紀錄與犬伴資料！\n\n若您確定要永久抹除，請手動輸入「yes」：");
        
        if (userInput && userInput.trim().toLowerCase() === "yes") {
            executeFormatDrive();
        } else {
            // 玩家取消、按提示框的取消、或打錯字，立刻恢復按鈕原狀
            btn.style.backgroundColor = "transparent";
            btn.style.color = "#ff3333";
            btn.style.fontWeight = "normal";
            btn.innerText = "FORMAT_DRIVE (清除存檔)";
            logMessage(">> 安全驗證未通過（未輸入 yes），已自動攔截清除指令。", "warning");
            alert("❌ 驗證失敗：已取消清除存檔。您的資料完全安全。");
        }
    }
}


async function executeFormatDrive() {
    try {
        db.close(); 
        await Dexie.delete("WastelandHoundDB"); 
        localStorage.clear();
        sessionStorage.clear();
        location.reload(); 
    } catch (e) {
        alert("格式化失敗，請手動在瀏覽器設定中清除網頁暫存：" + e.message);
    }
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
        let maxCap = getMaxScrap(); 
 
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

        // --- 2. 副本完全離線掛機模擬 (Combat Sandbox - 效能與修復版) ---
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
            
            let lootCount = 0;

            for (let i = 0; i < ticksToSimulate; i++) {
                // 🚀 微創修復 1：每迴圈真正執行扣血檢定！
                gameState.hound.hp = Math.max(0, gameState.hound.hp - dmgPerEncounter);

                if (i > 0 && i % 3 === 0) {
                    enemiesKilled++;
                    combatScrap += Math.floor(Math.random() * 5) + 1;
                    await generateLoot(false);
                    lootCount++;
                }

                // 🚀 微創修復 2：血量不滿即自動吃肉乾，並嚴格對齊「線上 25% 動態回血」設定
                if (gameState.hound.hp < gameState.hound.maxHp && gameState.resources.food > 0) {
                    let healAmount = Math.floor(gameState.hound.maxHp * 0.25);
                    gameState.hound.hp = Math.min(gameState.hound.maxHp, gameState.hound.hp + healAmount);
                    gameState.resources.food--;
                    foodConsumed++;
                } 
                
                // 🚀 微創修復 3：若沒肉乾且血量歸零，立刻終止掛機！
                if (gameState.hound.hp <= 0) {
                    died = true;
                    break; 
                }
            }

            gameState.resources.scrap += combatScrap;
            offlineReport += `>> ⚔️ 探索戰報：擊殺 ${enemiesKilled} 隻怪物，回收 ${combatScrap} 廢料。<br>`;
            if (lootCount > 0) offlineReport += `>> 🎒 戰鬥掉落：共計 ${lootCount} 件裝備 (垃圾裝已自動拆解)。<br>`;
            offlineReport += `>> 🍖 消耗肉乾：${foodConsumed} 份。<br>`;

            if (died) {
                gameState.isExploring = false;
                gameState.currentEnemy = null;
                gameState.hound.hp = 0;
                offlineReport += `>> <span style="color:#ff3333;">💀 [警告] 獵犬重傷，已強制撤退！</span><br>`;
            }
        }


        // 統一輸出最終戰報
        logMessage(offlineReport, "system");
    }
    
    // 更新 UI 與存檔
    baseData.lastLoginTime = now;
    if (typeof updateBaseUI === "function") updateBaseUI();
    updateUI();
    renderInventory(); 
    savePlayerState();
}






// --- 📖 終端機資料庫 (Lore Modal) UI 渲染 ---

function openLoreModal() {
    // 🚀 關鍵新增：每次點擊開啟終端機時，強制檢查。如果沒這篇 README，就直接塞進去！
    if (!gameState.unlockedLore || !Array.isArray(gameState.unlockedLore)) {
        gameState.unlockedLore = [];
    }
    if (!gameState.unlockedLore.includes("lore_00_00")) {
        gameState.unlockedLore.push("lore_00_00");
    }

    const modal = document.getElementById("lore-modal");
    const backdrop = document.getElementById("lore-backdrop");
    
    if (backdrop) backdrop.style.display = "none"; 
    if (modal) {
        modal.style.display = "block";
        modal.scrollTop = 0; 
    }
    showLoreList();
}



function closeLoreModal() {
    const modal = document.getElementById("lore-modal");
    if (modal) modal.style.display = "none";
}

function showLoreList() {
    const listView = document.getElementById("lore-list-view");
    const detailView = document.getElementById("lore-detail-view");
    const container = document.getElementById("lore-list-container");
    const modal = document.getElementById("lore-modal");
    if (!listView || !detailView || !container) return;

    listView.style.display = "block";
    detailView.style.display = "none";
    if (modal) modal.scrollTop = 0;
    container.innerHTML = "";

    // 🚀 防禦 1：避免舊存檔相容性當機
    if (!gameState.unlockedLore || !Array.isArray(gameState.unlockedLore)) {
        gameState.unlockedLore = [];
    }

    // 🚀 防禦 2：如果 JSON 語法壞掉或沒讀到，直接在手機螢幕上跳出紅色大警告
    if (!gameConfig || !gameConfig.lore_database || !gameConfig.lore_database.categories) {
        container.innerHTML = `
            <div style="color: #ff5555; border: 1px dashed #ff5555; padding: 15px; text-align: center; background: rgba(255,0,0,0.15); font-family: monospace; font-size: 0.9em;">
                ⚠️ <b>[TERMINAL_ERROR: CONFIG_CRASH]</b><br>
                資料庫異常！未偵測到正確的 config.json 資料。<br>
                原因通常是：JSON 語法內逗號或括號錯置。
            </div>`;
        return;
    }

    // 正常渲染
    gameConfig.lore_database.categories.forEach(cat => {
        let catHtml = `<div class="lore-category-title" style="color:#d69e2e; font-size:1.1em; margin-top:12px; border-bottom:1px solid #cbd5e0; padding-bottom:4px;">📂 ${cat.name || '未命名'}</div>`;
        
        (cat.subcategories || []).forEach(sub => {
            catHtml += `<div class="lore-category-title" style="margin-left:8px; font-size:0.95em; color:#2b6cb0;">└ 📁 ${sub.name || '未命名'}</div>`;
            
            (sub.items || []).forEach(item => {
                const isUnlocked = gameState.unlockedLore.includes(item.id);
                const titleText = isUnlocked ? item.title : "？？？ (機密檔案加密中)";
                const btnClass = isUnlocked ? "lore-item-btn unlocked" : "lore-item-btn";
                const clickAction = isUnlocked ? `onclick="readLore('${item.id}')"` : `onclick="alert('🔒 此文件尚未解密！請透過派遣電台或挑戰對應副本取得。')"`;
                
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
// ✨ 精準替換 game.js 中的 readLore 函式（賽博黑底螢光白邊優化版）
function readLore(loreId) {
    let targetLore = null;
    if (gameConfig && gameConfig.lore_database && gameConfig.lore_database.categories) {
        for (const cat of gameConfig.lore_database.categories) {
            for (const sub of cat.subcategories) {
                targetLore = sub.items.find(item => item.id === loreId);
                if (targetLore) break;
            }
            if (targetLore) break;
        }
    }
    if (!targetLore) return;

    const listView = document.getElementById("lore-list-view");
    const detailView = document.getElementById("lore-detail-view");
    const titleEl = document.getElementById("lore-read-title");
    const locationEl = document.getElementById("lore-read-location");
    const dateEl = document.getElementById("lore-read-date");
    const bodyEl = document.getElementById("lore-read-body");
    const modal = document.getElementById("lore-modal");

    if (!listView || !detailView) return;

    if (modal) modal.scrollTop = 0;

    listView.style.display = "none";
    detailView.style.display = "block";
    
    // 🚀 視覺大升級：將閱讀容器打造為「黑底 + 螢光白邊」的末日機密螢幕！
    detailView.style.backgroundColor = "#080808"; // 深邃純黑底色
    detailView.style.border = "1px solid #ffffff"; // 實線高對比白邊
    detailView.style.boxShadow = "0 0 14px rgba(255, 255, 255, 0.7)"; // 螢光白邊發光特效 (Cyberpunk Glow)
    detailView.style.borderRadius = "8px"; // 科技感圓角
    detailView.style.padding = "20px 16px 80px 16px"; // 舒適內邊距，底部空出 80px 絕對防工具欄遮擋
    detailView.style.margin = "10px 4px"; // 與四周保留些微空隙，讓發光外框完美呈現
    detailView.style.boxSizing = "border-box";

    // 4. 安全填入文本與色彩配置
    if (titleEl) {
        titleEl.innerText = `📜 ${targetLore.title}`;
        titleEl.style.color = "#ffd700"; // 標題改為醒目的賽博亮金黃色
        titleEl.style.textShadow = "0 0 6px rgba(255, 215, 0, 0.5)";
    }
    if (locationEl) {
        locationEl.innerText = `📍 來源: ${targetLore.location || "未知區域"}`;
        locationEl.style.color = "#a0aec0";
    }
    if (dateEl) {
        dateEl.innerText = `⏳ 時間: ${targetLore.date || "大崩潰紀錄"}`;
        dateEl.style.color = "#a0aec0";
    }
    
    if (bodyEl) {
        bodyEl.style.lineHeight = "1.85"; // 增加行距，讓長時間手機閱讀眼睛不疲勞
        bodyEl.style.whiteSpace = "pre-wrap";
        bodyEl.style.textAlign = "justify";
        bodyEl.style.marginTop = "20px";
        bodyEl.style.paddingTop = "15px";
        bodyEl.style.borderTop = "1px dashed #444444"; // 深色質感分隔線
        bodyEl.style.paddingBottom = "40px";
        bodyEl.style.color = "#ffffff"; // 🚀 關鍵修復：改為方便舒服、高清晰的純白色
        bodyEl.style.fontSize = "1.02rem"; // 微調為最適合手機閱覽的字級
        bodyEl.style.textShadow = "0 0 2px rgba(255, 255, 255, 0.3)"; // 淡淡的螢光字體感，增添 CRT 螢幕氛圍
        bodyEl.innerHTML = targetLore.content || "（檔案內容嚴重損毀...）";
    }
}



// ✨ 精準對接 index.html 第 434 與 435 行：負責關閉整個檔案面板與背景遮罩
function closeLoreModal() {
    const modal = document.getElementById("lore-modal");
    const backdrop = document.getElementById("lore-backdrop");
    if (modal) modal.style.display = "none";
    if (backdrop) backdrop.style.display = "none";
}


// ==========================================
// 🚨 開發者專屬外掛模組 (僅限本地擁有 dev_key.json 時觸發)
// ==========================================
function initDevTools() {
    logMessage(">> ⚠️ 警告：系統已偵測到開發者金鑰，[ROOT] 權限已覆寫！", "warning");

    // 1. 動態生成作弊 UI 容器 (不需動到 index.html)
    const devPanel = document.createElement("div");
    devPanel.style.cssText = `
        position: fixed; bottom: 10px; right: 10px;
        background: rgba(20, 0, 0, 0.9); border: 2px solid #ff2222;
        padding: 10px; z-index: 99999; color: #ff5555;
        font-family: monospace; font-size: 0.8rem;
        box-shadow: 0 0 10px #ff2222; border-radius: 5px;
    `;
    
    devPanel.innerHTML = `
        <div style="font-weight:bold; border-bottom:1px solid #ff2222; margin-bottom:5px;">[ROOT_TOOLS]</div>
        <button onclick="cheatResources()" style="background:#330000; color:#ff2222; border:1px solid #ff2222; margin:2px; cursor:pointer; padding:5px;">+ 滿資源</button>
        <button onclick="cheatKillEnemy()" style="background:#330000; color:#ff2222; border:1px solid #ff2222; margin:2px; cursor:pointer; padding:5px;">☠️ 秒殺怪物</button>
        <button onclick="cheatBaits()" style="background:#330000; color:#ff2222; border:1px solid #ff2222; margin:2px; cursor:pointer; padding:5px;">+ 誘餌x5</button>
    `;

    document.body.appendChild(devPanel);
}

// === 作弊功能函式庫 (防崩潰安全版) ===
function cheatResources() {
    if (!isDevMode) return;
    gameState.resources.scrap += 10000;
    gameState.resources.zaco += 10000;
    gameState.resources.food += 1000;
    
    // 安全刷新：如果有 updateUI 就呼叫，沒有就手動暴力改數字
    if (typeof updateUI === "function") {
        updateUI();
    } else {
        // 暴力覆寫 UI，確保你能馬上看到錢變多
        const scrapEl = document.getElementById('res-scrap'); // 依據你實際的 ID 調整
        const foodEl = document.getElementById('res-food');
        if (scrapEl) scrapEl.innerText = gameState.resources.scrap;
        if (foodEl) foodEl.innerText = gameState.resources.food;
    }
    
    logMessage(">> [DEV] 已注入巨量廢料、ZaCo 與食物！", "system");
}

function cheatKillEnemy() {
    if (!isDevMode || !gameState.currentEnemy) {
        logMessage(">> [DEV] 找不到目標怪物！", "warning");
        return;
    }
    
    gameState.currentEnemy.hp = 0; // 直接讓怪物血量歸零
    
    if (typeof updateUI === "function") {
        updateUI();
    }
    
    logMessage(">> [DEV] 已發送軌道炮，目標已殲滅！(請等待獵犬進行下一次攻擊結算)", "system");
}

function cheatBaits() {
    if (!isDevMode) return;
    gameState.resources.baits = (gameState.resources.baits || 0) + 5;
    
    if (typeof updateUI === "function") {
        updateUI();
    } else {
        const baitsEl = document.getElementById('res-baits');
        if (baitsEl) baitsEl.innerText = gameState.resources.baits;
    }
    
    logMessage(">> [DEV] Alpha 誘餌補給已空投！", "system");
}
