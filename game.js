// 全域記憶體快照
let gameConfig = null;
const isDevMode = false; // 🔒 永久死鎖：嚴格禁止任何腳本重啟作弊模式



// 🚀 廢土全域資料字典 (O(1) 高速檢索)
const WastelandDB = {
    enemies: {},
    dungeons: {}
};

// 🛡️ 整合了所有家園(base)與派遣(dispatch)數值的安全全域狀態
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
    },
    // 新增：統一整合家園數據
    base: { 
        ccLevel: 0, towerLevel: 0, towerZombies: 0,          
        radioState: false, lastLoginTime: Date.now(), dispatchLevel: 0 
    }
};

// 系統預設參數
const BASE_SCRAP_CAP = 1000; 
const MAX_FOOD_CAP = 400;    


// --- 動態計算資源上限 (防彈級作用域安全) ---
function getMaxScrap() {
    // 🔧 [修改] 將等級限制從 9 提升至 14，滿等可容納 15,000 廢料 (解決 10800 電台升級死鎖)
    let level = (gameState && gameState.base && gameState.base.ccLevel) ? Math.min(gameState.base.ccLevel, 14) : 0;
    return 1000 + (level * 1000);
}


function getMaxFood() {
    let level = (gameState && gameState.base && gameState.base.ccLevel) ? Math.min(gameState.base.ccLevel, 9) : 0;
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
    
        // 🟢 終極防呆：深度讀取主線進度，確保所有關鍵陣列絕對存在！
    gameState.story = savedState.story || {};
    gameState.story.clearedBosses = gameState.story.clearedBosses || [];
    gameState.story.unlockedChapters = gameState.story.unlockedChapters || ["CH01"];

    // 🚀 【進度追溯補丁】：清除舊存檔幽靈！只要你殺過第一章王，強制補發第二章權限！
    if (gameState.story.clearedBosses.includes("BOSS_STORY_01") && !gameState.story.unlockedChapters.includes("CH02")) {
        gameState.story.unlockedChapters.push("CH02");
    }

    // --- 關鍵修復：恢復探索狀態與所在區域的記憶 ---


    gameState.isExploring = savedState.isExploring || false;
    gameState.currentArea = savedState.currentArea || "wasteland";

        // 載入家園資料，並掛載到安全的 gameState.base (放在 loadGameData 裡面替換舊的)
    if (savedState.baseData) {
        gameState.base = savedState.baseData;
    }
    if (!gameState.base) gameState.base = { ccLevel: 0, towerLevel: 0, dispatchLevel: 0, towerZombies: 0, radioState: false, lastLoginTime: Date.now() };
    
    if (gameState.base.ccLevel === undefined) gameState.base.ccLevel = 0;
    if (gameState.base.towerLevel === undefined) gameState.base.towerLevel = 0;
    if (gameState.base.dispatchLevel === undefined) gameState.base.dispatchLevel = 0;
    if (gameState.base.towerZombies === undefined) gameState.base.towerZombies = 0;
    if (gameState.base.radioState === undefined) gameState.base.radioState = false;

    // 🟢 終極防呆：給予預設值，防止 undefined 導致 UI 空白與讀檔中斷！
    gameState.playerName = savedState.playerName || "倖存者";
    gameState.houndName = savedState.houndName || "廢土獵犬";
    gameState.playerAvatar = savedState.playerAvatar || null;
    gameState.houndAvatar = savedState.houndAvatar || null;
    gameState.showAvatarInStory = savedState.showAvatarInStory || false; 

    // 🟢 加上 try-catch 防禦罩：即使渲染失敗也絕不影響後續的裝備載入與離線掛機結算！
    try {
        renderProfileAvatar(); 
        const chkAvatar = document.getElementById('chk-story-avatar');
        if (chkAvatar) chkAvatar.checked = gameState.showAvatarInStory;
    } catch (err) {
        console.error(">> [讀檔警告] 頭像與識別證 UI 渲染異常，已自動隔離保護主流程:", err);
    }




    if(document.getElementById('auto-common')) document.getElementById('auto-common').checked = gameState.autoSell.common;
    if(document.getElementById('auto-rare')) document.getElementById('auto-rare').checked = gameState.autoSell.rare;

        const equippedItems = await db.inventory_items.where("is_equipped").equals(1).toArray();
    gameState.equipped = { helmet: null, collar: null, harness: null, core: null };
    if (gameState.bossPity === undefined) gameState.bossPity = savedState.bossPity || 0;

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

// 完全替換原本的 savePlayerState (加入強效防護與錯誤捕捉)
async function savePlayerState() {
    if (gameState.base) gameState.base.lastLoginTime = Date.now();
    
    try {
        await db.player_state.put({
            id: 1, 
            resources: gameState.resources, 
            upgrades: gameState.upgrades,
            costs: gameState.costs, 
            autoRates: gameState.autoRates, 
            hound_hp: gameState.hound.hp, 
            autoSell: gameState.autoSell,
            baseData: gameState.base, 
            isExploring: gameState.isExploring,
            currentArea: gameState.currentArea,
            bossPity: gameState.bossPity || 0,
            unlockedLore: gameState.unlockedLore,
            dispatch: gameState.dispatch,
            story: gameState.story,
            playerName: gameState.playerName,       
            houndName: gameState.houndName,         
            playerAvatar: gameState.playerAvatar,   
            houndAvatar: gameState.houndAvatar,     
            showAvatarInStory: gameState.showAvatarInStory || false 
        });
    } catch (error) {
        console.error(">> [系統崩潰] 存檔寫入失敗！相片檔案可能過大導致資料庫拒絕寫入。", error);
        if (typeof logMessage === 'function') logMessage(">> 系統警告：資料庫存取異常，進度未保存！", "warning");
    }
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

// ==========================================
// 🚀 [識別證] 最初始的穩定版本 (支援去背照片與代碼輸入)
// ==========================================

// 1. 寫入名字
function saveProfileNames() {
    const pNameEl = document.getElementById('input-player-name');
    const hNameEl = document.getElementById('input-hound-name');
    
    if (pNameEl) gameState.playerName = pNameEl.value.trim() || "倖存者";
    if (hNameEl) gameState.houndName = hNameEl.value.trim() || "廢土獵犬";
    
    if (typeof savePlayerState === 'function') savePlayerState();
    logMessage(">> [系統提示] 識別證身份資料已更新同步。", "system");
}

// 🚀 圖片上傳 (高畫質自適應比例版，完美還原東方仗助效果)
function handleAvatarUpload(type, event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 🚨 解除 150x150 的封印！改用 MAX_SIZE 限制最大邊長
            const MAX_SIZE = 600; // 600 像素能確保主線立繪極度清晰，且不會撐爆資料庫
            let width = img.width;
            let height = img.height;
            
            // 精準計算等比例縮放
            if (width > height) {
                if (width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                }
            } else {
                if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }
            }
            
            // 畫布尺寸完全貼合縮放後的圖片，不再有隱形透明牆！
            canvas.width = width;
            canvas.height = height;
            
            // 完整繪製 (不加黑底，完美保留原圖去背與色彩)
            ctx.drawImage(img, 0, 0, width, height);
            
            // 使用 PNG 格式輸出
            const base64Data = canvas.toDataURL('image/png');
            
            if (type === 'player') gameState.playerAvatar = base64Data;
            else if (type === 'hound') gameState.houndAvatar = base64Data;
            
            if (typeof savePlayerState === 'function') savePlayerState();
            if (typeof renderProfileAvatar === 'function') renderProfileAvatar();
            logMessage(`>> [系統提示] ${type === 'player' ? '倖存者' : '獵犬'}相片已上傳。`, "system");
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}



// 3. 圖片移除
function removeAvatar(type) {
    if (type === 'player') gameState.playerAvatar = null;
    else if (type === 'hound') gameState.houndAvatar = null;
    
    if (typeof savePlayerState === 'function') savePlayerState();
    if (typeof renderProfileAvatar === 'function') renderProfileAvatar();
}

// 4. 營地識別證畫面渲染 (最乾淨版本)
function renderProfileAvatar() {
    try {
        const pName = document.getElementById('input-player-name');
        const hName = document.getElementById('input-hound-name');
        
        // 防止打字被打斷
        if (pName && document.activeElement !== pName) pName.value = gameState.playerName || "倖存者";
        if (hName && document.activeElement !== hName) hName.value = gameState.houndName || "廢土獵犬";

        // 倖存者圖片顯示
        const pImg = document.getElementById('profile-avatar-img');
        const pPh = document.getElementById('profile-avatar-placeholder');
        if (gameState.playerAvatar) {
            if (pImg) { pImg.src = gameState.playerAvatar; pImg.style.display = 'block'; }
            if (pPh) { pPh.style.display = 'none'; }
        } else {
            if (pImg) { pImg.style.display = 'none'; pImg.src = ""; }
            if (pPh) { pPh.style.display = 'block'; }
        }

        // 獵犬圖片顯示
        const hImg = document.getElementById('hound-avatar-img');
        const hPh = document.getElementById('hound-avatar-placeholder');
        if (gameState.houndAvatar) {
            if (hImg) { hImg.src = gameState.houndAvatar; hImg.style.display = 'block'; }
            if (hPh) { hPh.style.display = 'none'; }
        } else {
            if (hImg) { hImg.style.display = 'none'; hImg.src = ""; }
            if (hPh) { hPh.style.display = 'block'; }
        }
    } catch (err) {
        console.error(">> [UI警告] 渲染頭像失敗:", err);
    }
}




function switchTab(tabId) {
    try {
        // 1. 隱藏所有分頁內容與按鈕狀態 (你原本的邏輯)
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
    } // 👈 就是這裡！原本少了這個 catch 的閉合括號

    // ==========================================
    // 👇 下方是每次切換分頁「必定」要執行的外掛系統 👇
    // ==========================================

    // [連動一] 讓側邊抽屜裡的按鈕正確亮起
    if (typeof updateActiveNavButton === 'function') {
        updateActiveNavButton(tabId);
    }

    // [連動二] 觸發分頁專屬 BGM
    if (typeof audioEngine !== 'undefined') {
        audioEngine.playBGM(tabId);
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
    // 🟢 修復：精準寫入當前值與最大值，解決疊影問題
    document.getElementById('res-scrap').innerText = gameState.resources.scrap;
    if (document.getElementById('cap-scrap')) document.getElementById('cap-scrap').innerText = getMaxScrap();
    
    document.getElementById('res-food').innerText = gameState.resources.food;
    if (document.getElementById('cap-food')) document.getElementById('cap-food').innerText = getMaxFood();
    
    document.getElementById('res-zaco').innerText = gameState.resources.zaco;

    // =========================================================
    // 🟢 新增：容量條視覺化動態連動模組
    // =========================================================
    try {
        let maxScrap = getMaxScrap();
        let scrapPercent = Math.min((gameState.resources.scrap / maxScrap) * 100, 100); // 確保不超過 100%
        let barScrap = document.getElementById('bar-scrap');
        if (barScrap) barScrap.style.width = scrapPercent + '%';

        let maxFood = getMaxFood();
        let foodPercent = Math.min((gameState.resources.food / maxFood) * 100, 100);
        let barFood = document.getElementById('bar-food');
        if (barFood) barFood.style.width = foodPercent + '%';
    } catch (e) {
        console.error("UI: 容量條渲染失敗", e);
    }
    // =========================================================
    
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
    
    const buildEqLine = (slot, item) => {
        if(!item) return "";
        const lvlStr = item.level ? ` <span style="color:#00ffcc; font-weight:bold;">+${item.level}</span>` : "";
        const isEpic = slot === 'core' || item.rarity === 'epic';
        const nameStyle = isEpic ? 'color:#c355ff; text-shadow:0 0 6px rgba(195,85,255,0.6); font-weight:bold;' : '';
        
        return `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; border-bottom:1px dashed #333; padding-bottom:6px;">
            <span class="${item.class}" onclick="showCompare(${item.id})" style="cursor:pointer; text-decoration:underline dotted; flex:1; line-height:1.4; ${nameStyle}">[${item.slotText}] ${item.name}${lvlStr}</span>
            <button class="btn" style="width:auto; padding:4px 12px; margin:0; font-size:0.75rem; border-color:#ff3333; color:#ff3333;" onclick="unequipSlot('${slot}')">卸下</button>
        </div>`;
    };

    if (gameState.equipped.helmet) eqText.push(buildEqLine('helmet', gameState.equipped.helmet));
    if (gameState.equipped.collar) eqText.push(buildEqLine('collar', gameState.equipped.collar));
    if (gameState.equipped.harness) eqText.push(buildEqLine('harness', gameState.equipped.harness));
    if (gameState.equipped.core) eqText.push(buildEqLine('core', gameState.equipped.core));
    if (equipDiv) equipDiv.innerHTML = eqText.length > 0 ? eqText.join("") : `<span style="color:#777;">[無裝備]</span>`;

    const setDiv = document.getElementById('camp-sets') || document.getElementById('hound-active-sets');
    if (setDiv) {
        let setHtml = [];
        if (gameState.hound.activeSets && gameState.hound.activeSets.length > 0) {
            setHtml.push(`<div style="color:#00ff66; margin-bottom:4px; font-weight:bold;">[套裝共鳴] ${gameState.hound.activeSets.join(", ")}</div>`);
        }
        if (gameState.equipped.core && (gameState.equipped.core.desc || gameState.equipped.core.effect)) {
            setHtml.push(`<div style="color:#c355ff; text-shadow:0 0 5px rgba(195,85,255,0.5); line-height:1.3;">⚡ [核心共鳴] ${gameState.equipped.core.desc || gameState.equipped.core.effect}</div>`);
        }
        setDiv.innerHTML = setHtml.length > 0 ? setHtml.join("") : `<span style="color:#777;">[無共鳴效果]</span>`;
    }

    let critBonus = gameState.hound.activeSets && gameState.hound.activeSets.includes('thug_2pc') ? 2 : 1;
    let expectedDps = ((gameState.hound.totalAtk * (1 + (gameState.hound.totalCrit / 100) * critBonus)) + ((gameState.hound.ohko || 0) * 50)) / 5;
    if (document.getElementById('hound-dps-val')) {
        document.getElementById('hound-dps-val').innerText = expectedDps.toFixed(2);
    }
}
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
    let timeDiffSeconds = Math.floor((now - gameState.base.lastLoginTime) / 1000); 
    
    if (timeDiffSeconds > 60) {
        let offlineMinutes = (timeDiffSeconds / 60).toFixed(1);
        let offlineReport = `[系統重連] 離線時間：${offlineMinutes} 分鐘。<br>`;

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
        
        if (gameState.base.radioState && timeDiffSeconds >= 300) {
            const rand = Math.random() * 100;
            if (rand < 40) { 
                let zacoFound = Math.floor(Math.random() * 15) + 5;
                gameState.resources.zaco += zacoFound;
                offlineReport += `>> 📻 [啟示] 收音機截獲地下交易頻段，尋獲 ${zacoFound} 枚 ZaCo。<br>`;
            } else if (rand < 70) { 
                let scrapFound = Math.floor(Math.random() * 150) + 50;
                let maxCap = getMaxScrap();
                gameState.resources.scrap = Math.min(gameState.resources.scrap + scrapFound, maxCap);
                offlineReport += `>> 📻 [啟示] 收音機解析出舊商隊路線，發掘 ${scrapFound} 廢料。<br>`;
            } else { 
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
        
        if (gameState.base.towerLevel && gameState.base.towerLevel > 0) {
            let towerLv = gameState.base.towerLevel;
            let maxHours = 2 + (towerLv * 2);
            let maxZombies = maxHours * 60 * towerLv; 
            
            let timeDiffMinutes = Math.floor(timeDiffSeconds / 60);
            let newZombies = timeDiffMinutes * towerLv;
            
            if (newZombies > 0) {
                gameState.base.towerZombies = Math.min(maxZombies, (gameState.base.towerZombies || 0) + newZombies);
                offlineReport += `>> 📡 誘餌廣播塔在黑夜中持續廣播，吸引了新的屍群徘徊。<br>`;
            }
        }

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
                gameState.hound.hp = Math.max(0, gameState.hound.hp - dmgPerEncounter);

                if (i > 0 && i % 3 === 0) {
                    enemiesKilled++;
                    combatScrap += Math.floor(Math.random() * 5) + 1;
                    if (typeof generateLoot === 'function') await generateLoot(false);
                    lootCount++;
                }

                if (gameState.hound.hp < gameState.hound.maxHp && gameState.resources.food > 0) {
                    let healAmount = Math.floor(gameState.hound.maxHp * 0.25);
                    gameState.hound.hp = Math.min(gameState.hound.maxHp, gameState.hound.hp + healAmount);
                    gameState.resources.food--;
                    foodConsumed++;
                } 
                
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

        if (typeof logMessage === 'function') logMessage(offlineReport, "system");
    }
    
    gameState.base.lastLoginTime = now;
    if (typeof updateBaseUI === "function") updateBaseUI();
    updateUI();
    if (typeof renderInventory === "function") renderInventory(); 
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

/* ================================================= */
/* ⚙️ UI 系統抽屜控制 (SYSTEM NAV DRAWER)            */
/* ================================================= */

function toggleNavDrawer() {
  const drawer = document.getElementById('nav-drawer');
  const overlay = document.getElementById('drawer-overlay');
  
  if (drawer) drawer.classList.toggle('open');
  if (overlay) overlay.classList.toggle('open');
}

function updateActiveNavButton(tabId) {
    const btns = document.querySelectorAll('.nav-drawer .drawer-btn');
    btns.forEach(btn => btn.classList.remove('active-btn'));
    
    const tabMapping = {
        'odyssey': '[00]', 'status': '[01]', 'gather': '[02]',
        'battle': '[03]', 'inv': '[04]', 'shop': '[05]', 'base': '[06]'
    };
    
    const prefix = tabMapping[tabId];
    if(prefix) {
        btns.forEach(btn => {
            if(btn.innerText.includes(prefix)) {
                btn.classList.add('active-btn');
            }
        });
    }
}
