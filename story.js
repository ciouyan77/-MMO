// 確保 WastelandDB 存在，然後把劇本資料「合併」進去，避免覆蓋 database.js 的裝備庫
window.WastelandDB = window.WastelandDB || {};
Object.assign(window.WastelandDB, {
        // 1. 在字典中加入 bgColor 與 textColor 屬性
    characters: {
        "CHAR_NARRATOR": { name: "", sprite: "" },
        "CHAR_SURVIVOR": { name: "倖存者", sprite: "https://raw.githubusercontent.com/ciouyan77/-MMO/refs/heads/main/IMG_9615.png", bgColor: "#55ff55", textColor: "#000" },
        "CHAR_HOUND": { name: "貝果", sprite: "https://api.dicebear.com/7.x/bottts/svg?seed=cyberdog&backgroundColor=transparent", bgColor: "#ffaa00", textColor: "#000" },
        "CHAR_SYS": { name: "系統警告", sprite: "", bgColor: "#ff5555", textColor: "#000" }
    },

                storyScripts: {
        "CH01": {
            title: "第一章：廢土復興",
            bgImage: "https://raw.githubusercontent.com/ciouyan77/DMMO_PIC/refs/heads/main/IMG_9274.png",
            targetBossId: "BOSS_STORY_01",
            dialogues: [
                { speakerId: "CHAR_NARRATOR", text: "你的軍靴踩在半凝固的黑色污泥上，發出令人作嘔的吧唧聲。這是一條被世界遺忘的下水道，頭頂上方是曾經被稱為「新都」的殘骸。" },
                { speakerId: "CHAR_NARRATOR", text: "現在，那裡只剩下鋼筋構成的墓碑，以及在灰燼風暴中蹣跚前行的食屍鬼。" },
                { speakerId: "CHAR_SURVIVOR", text: "......足跡在這邊斷了。" },
                { speakerId: "CHAR_NARRATOR", text: "手電筒的光束像是風中的殘燭，勉強切開了濃稠的黑暗。空氣裡懸浮著某種微粒，黏附在你的防毒面具濾罐上。" },
                { speakerId: "CHAR_SURVIVOR", text: "看來是利用水路掩蓋自己的足跡，嘿，{HOUND}，你還聞得到味道嗎？" },
{ speakerId: "CHAR_NARRATOR", text: "被你稱呼為{HOUND}的生物緩緩站起，四隻如鐵管的腳牢牢釘住地面，身上散發出殺氣。" },
                { speakerId: "CHAR_HOUND", text: "（抽動著鼻子，死死盯著前方深暗的隧道）" },
                { speakerId: "CHAR_SYS", text: "前方高能量生化反應！檢測到【{BOSS_NAME}】，戰鬥運算模組已就緒！" }
            ],
            postDialogues: [
                { speakerId: "CHAR_NARRATOR", text: "巨獸轟然倒下，下水道的深處傳來沉悶的崩塌聲，血水混雜著機油流進了暗溝。" },
                { speakerId: "CHAR_SURVIVOR", text: "呼... 總算解決了。幹得好，夥計。" },
                { speakerId: "CHAR_HOUND", text: "（甩了甩身上的污泥，發出低沉的嗚咽聲）" },
                { speakerId: "CHAR_SURVIVOR", text: "走吧，前面就是出口。我們離大崩潰的源頭又近了一步。" }
            ]
        },
        "CH02": {
            title: "第二章：生化異變",
            bgImage: "https://raw.githubusercontent.com/ciouyan77/DMMO_PIC/refs/heads/main/IMG_9274.png",
            targetBossId: "BOSS_STORY_02",
            dialogues: [
                { speakerId: "CHAR_NARRATOR", text: "地表的輻射塵暴漸漸平息，但空氣中卻瀰漫著濃烈的血腥與腐敗氣味。" },
                { speakerId: "CHAR_SURVIVOR", text: "這種氣味... 是某種巨大的生物正在進行畸變增生。戒備！" },
                { speakerId: "CHAR_SYS", text: "前方高能量生化反應！檢測到【{BOSS_NAME}】，戰鬥運算模組已就緒！" }
            ],
            postDialogues: [
                { speakerId: "CHAR_NARRATOR", text: "畸變體的殘骸迅速溶解，化為一灘發出惡臭的綠色螢光液體。" },
                { speakerId: "CHAR_SURVIVOR", text: "這種變異速度絕對不是自然發生的，有人在背後操縱這一切。" },
                { speakerId: "CHAR_HOUND", text: "（從黏液中扒出了一塊帶有財團標誌的破碎金屬牌）" }
            ]
        },
        "CH03": {
            title: "第三章：鋼鐵堡壘",
            bgImage: "https://raw.githubusercontent.com/ciouyan77/DMMO_PIC/refs/heads/main/IMG_9274.png",
            targetBossId: "BOSS_STORY_03",
            dialogues: [
                { speakerId: "CHAR_NARRATOR", text: "你們來到了一座舊時代的工業廢墟，四周散落著巨大的齒輪與冷卻液殘骸。" },
                { speakerId: "CHAR_SURVIVOR", text: "這裡的防衛系統似乎還在運作，腳步放輕點。" },
                { speakerId: "CHAR_SYS", text: "前方高能量生化反應！檢測到【{BOSS_NAME}】，戰鬥運算模組已就緒！" }
            ],
            postDialogues: [
                { speakerId: "CHAR_NARRATOR", text: "隨著震耳欲聾的爆炸，巨大的機械身軀徹底報廢，工廠的紅色警報燈逐漸黯淡。" },
                { speakerId: "CHAR_SURVIVOR", text: "舊時代的遺物終究只能成為廢鐵。不過，這裡的防禦網路已經被我們癱瘓了。" },
                { speakerId: "CHAR_HOUND", text: "（咬住一根外露的電纜，滿意地扯斷了它）" }
            ]
        },
        "CH04": {
            title: "第四章：時空裂縫",
            bgImage: "https://raw.githubusercontent.com/ciouyan77/DMMO_PIC/refs/heads/main/IMG_9274.png",
            targetBossId: "BOSS_STORY_04",
            dialogues: [
                { speakerId: "CHAR_NARRATOR", text: "周遭的重力開始出現異常，漂浮在半空中的碎石違反了物理法則。" },
                { speakerId: "CHAR_SURVIVOR", text: "粒子對撞機的遺址... 這裡的空間結構已經徹底崩潰了。" },
                { speakerId: "CHAR_SYS", text: "前方高能量生化反應！檢測到【{BOSS_NAME}】，戰鬥運算模組已就緒！" }
            ],
            postDialogues: [
                { speakerId: "CHAR_NARRATOR", text: "碎石重新砸向地面，周遭扭曲的重力場終於恢復了正常。" },
                { speakerId: "CHAR_SURVIVOR", text: "咳咳... 差點以為要被撕成碎片了。空間裂縫正在閉合，快離開這裡！" },
                { speakerId: "CHAR_SYS", text: "【系統提示】空間穩定度已恢復，異常能量源已清除。" }
            ]
        },
        "CH05": {
            title: "第五章：蟲群之心",
            bgImage: "https://raw.githubusercontent.com/ciouyan77/DMMO_PIC/refs/heads/main/IMG_9274.png",
            targetBossId: "BOSS_STORY_05",
            dialogues: [
                { speakerId: "CHAR_NARRATOR", text: "地面覆蓋著一層黏稠的菌絲網絡，每走一步都會發出令人不安的撕裂聲。" },
                { speakerId: "CHAR_SURVIVOR", text: "這不是普通的真菌，下面有什麼東西在孵化。" },
                { speakerId: "CHAR_SYS", text: "前方高能量生化反應！檢測到【{BOSS_NAME}】，戰鬥運算模組已就緒！" }
            ],
            postDialogues: [
                { speakerId: "CHAR_NARRATOR", text: "母體死亡後，周圍的菌絲發出痛苦的尖嘯，迅速枯萎碳化。" },
                { speakerId: "CHAR_SURVIVOR", text: "太噁心了... 幸好我們在它徹底孵化前阻止了它。" },
                { speakerId: "CHAR_HOUND", text: "（嫌棄地在乾淨的石頭上蹭了蹭爪子上的黏液）" }
            ]
        },
        "CH06": {
            title: "第六章：古神祭壇",
            bgImage: "https://raw.githubusercontent.com/ciouyan77/DMMO_PIC/refs/heads/main/IMG_9274.png",
            targetBossId: "BOSS_STORY_06",
            dialogues: [
                { speakerId: "CHAR_NARRATOR", text: "穿過暗道，映入眼簾的是一座由未知黑石砌成的巨大地下祭壇。" },
                { speakerId: "CHAR_SURVIVOR", text: "舊世界的狂熱信徒... 他們到底喚醒了什麼怪物？" },
                { speakerId: "CHAR_SYS", text: "前方高能量生化反應！檢測到【{BOSS_NAME}】，戰鬥運算模組已就緒！" }
            ],
            postDialogues: [
                { speakerId: "CHAR_NARRATOR", text: "祭壇中央的黑石裂開，那些令人發狂的低語聲終於徹底消失在黑暗中。" },
                { speakerId: "CHAR_SURVIVOR", text: "不管是舊神還是新造物，只要敢擋路，下場都一樣。" },
                { speakerId: "CHAR_HOUND", text: "（對著碎裂的祭壇發出威嚇的低吼，確認沒有活物）" }
            ]
        },
        "CH07": {
            title: "第七章：致命賭局",
            bgImage: "https://raw.githubusercontent.com/ciouyan77/DMMO_PIC/refs/heads/main/IMG_9274.png",
            targetBossId: "BOSS_STORY_07",
            dialogues: [
                { speakerId: "CHAR_NARRATOR", text: "廢棄賭場的霓虹燈還在閃爍，滿地的籌碼與彈殼訴說著這裡曾經的瘋狂。" },
                { speakerId: "CHAR_SURVIVOR", text: "聞到了嗎？那是生化興奮劑的味道，這裡的主人是個不折不扣的瘋子。" },
                { speakerId: "CHAR_SYS", text: "前方高能量生化反應！檢測到【{BOSS_NAME}】，戰鬥運算模組已就緒！" }
            ],
            postDialogues: [
                { speakerId: "CHAR_NARRATOR", text: "瘋子倒在血泊中，手裡還緊緊攥著一枚染血的籌碼。霓虹燈閃爍了兩下，徹底熄滅。" },
                { speakerId: "CHAR_SURVIVOR", text: "這場賭局，看來是我們贏了。莊家通吃。" },
                { speakerId: "CHAR_SYS", text: "【系統提示】檢測到高純度生化興奮劑庫存，已標記座標。" }
            ]
        },
        "CH08": {
            title: "第八章：黑市暗流",
            bgImage: "https://raw.githubusercontent.com/ciouyan77/DMMO_PIC/refs/heads/main/IMG_9274.png",
            targetBossId: "BOSS_STORY_08",
            dialogues: [
                { speakerId: "CHAR_NARRATOR", text: "你們深入了黑市的核心金庫，四周的武裝防禦級別達到了軍用級別。" },
                { speakerId: "CHAR_SURVIVOR", text: "廢土上 90% 的財富都在這裡了，守衛絕對不好惹。" },
                { speakerId: "CHAR_SYS", text: "前方高能量生化反應！檢測到【{BOSS_NAME}】，戰鬥運算模組已就緒！" }
            ],
            postDialogues: [
                { speakerId: "CHAR_NARRATOR", text: "沉重的金庫大門緩緩開啟，裡面堆滿了廢土上最稀有的資源與武器原型。" },
                { speakerId: "CHAR_SURVIVOR", text: "有了這些物資，我們就有足夠的火力去面對最後的挑戰了。" },
                { speakerId: "CHAR_HOUND", text: "（在成堆的物資中翻找，興奮地叼出了一個高級裝甲核心）" }
            ]
        },
        "CH09": {
            title: "第九章：極寒門戶",
            bgImage: "https://raw.githubusercontent.com/ciouyan77/DMMO_PIC/refs/heads/main/IMG_9274.png",
            targetBossId: "BOSS_STORY_09",
            dialogues: [
                { speakerId: "CHAR_NARRATOR", text: "氣溫驟降至零下四十度，獵犬的裝甲表面結滿了冰霜。" },
                { speakerId: "CHAR_SURVIVOR", text: "撐住，只要突破這扇大門，我們就能抵達大崩潰的源頭。" },
                { speakerId: "CHAR_SYS", text: "前方高能量生化反應！檢測到【{BOSS_NAME}】，戰鬥運算模組已就緒！" }
            ],
            postDialogues: [
                { speakerId: "CHAR_NARRATOR", text: "守門者轟然碎裂成滿地冰晶。緊閉的合金大門發出沉重的機械聲，緩緩向兩側滑開。" },
                { speakerId: "CHAR_SURVIVOR", text: "門開了... 裡面就是一切災厄的源頭。準備好迎接地獄了嗎，夥伴？" },
                { speakerId: "CHAR_HOUND", text: "（眼神銳利，毫不退縮地站在最前方）" }
            ]
        },
        "CH10": {
            title: "第十章：終焉奇點",
            bgImage: "https://raw.githubusercontent.com/ciouyan77/DMMO_PIC/refs/heads/main/IMG_9274.png",
            targetBossId: "BOSS_STORY_10",
            dialogues: [
                { speakerId: "CHAR_NARRATOR", text: "你們站在了一切的終點。前方的空間正在無聲地坍縮，吞噬著所有的光線。" },
                { speakerId: "CHAR_SURVIVOR", text: "這就是廢土的末日嗎... 不，只要我們還活著，就絕不退縮！" },
                { speakerId: "CHAR_SYS", text: "【極度危險】宇宙奇點收縮！檢測到【{BOSS_NAME}】，最終決戰開始！" }
            ],
            postDialogues: [
                { speakerId: "CHAR_NARRATOR", text: "奇點的核心在極限的壓縮後猛然爆散，化為漫天光塵。籠罩廢土多年的灰燼風暴，竟在此刻奇蹟般地散開了一絲縫隙。" },
                { speakerId: "CHAR_SURVIVOR", text: "結束了... 這是真的嗎？" },
                { speakerId: "CHAR_NARRATOR", text: "一縷微弱的陽光，穿透了輻射雲層，灑在滿身傷痕的獵犬與倖存者身上。" },
                { speakerId: "CHAR_HOUND", text: "（抬起頭，安靜地沐浴在久違的陽光下）" },
                { speakerId: "CHAR_SYS", text: "【系統提示】終局威脅已解除。廢土，迎來了新的黎明。" }
            ]
        }
    },

        storyBosses: {
    "BOSS_STORY_01": {
        id: "BOSS_STORY_01",
        name: "大蛇",
        theme: "【極速快攻流】大幅提升前期攻擊節奏",
        desc: "舊時代高速突擊獵犬的原型機，身形飄忽不定，能瞬間撕裂敵人的防線。",
        image: "https://raw.githubusercontent.com/ciouyan77/-MMO/refs/heads/main/IMG_9548.png",
        hp: 3500, atk: 120, def: 40, dodge: 35, trueDmg: 0,
        recommendedGear: "第 2 副本套裝 +5 ~ +7",
        specialTraits: { critResist: 0.0, healSuppression: 0.0, ohkoImmune: false, traitDescription: "【超感驅動】極高閃避率 (35%)，建議配備高頻率攻擊裝備。" },
        rechallengeScript: [{ speakerId: "CHAR_SYS", text: ">> 終端機警告：幻影王殘影再次聚攏！" }],
        drops: { lore: { id: "lore_doc_01", prob: 0.30 }, gear: { prob: 0.02, pool: ["core_ninja_A", "core_scavenger_B"] } }
    },
    "BOSS_STORY_02": {
        id: "BOSS_STORY_02",
        name: "不死生化獸",
        theme: "【血牛吸盾流】專為長線掛機、極致生存設計",
        desc: "融合了多重輻射組織的畸變巨獸，擁有令人絕望的自我再生與血肉吸收能力。",
        image: "https://raw.githubusercontent.com/ciouyan77/DMMO_PIC/refs/heads/main/boss_02.png",
        hp: 6825, atk: 234, def: 78, dodge: 0, trueDmg: 20,
        recommendedGear: "第 4 副本套裝 +5 ~ +7",
        specialTraits: { critResist: 0.20, healSuppression: 0.30, ohkoImmune: false, traitDescription: "【生化血脈】攻擊附帶腐蝕真傷，並具備輕微減療氣場。" },
        rechallengeScript: [{ speakerId: "CHAR_SYS", text: ">> 終端機警告：生化獸組織再度增殖！" }],
        drops: { lore: { id: "lore_doc_02", prob: 0.30 }, gear: { prob: 0.02, pool: ["core_thug_A", "core_abyss_C"] } }
    },
    "BOSS_STORY_03": {
        id: "BOSS_STORY_03",
        name: "重裝機甲王",
        theme: "【坦克殺手流】專門攻克高防禦怪物的破甲重器",
        desc: "舊時代工業堡壘的重型安保核心，外層包裹著厚達三十公分的液態合金裝甲。",
        image: "https://raw.githubusercontent.com/ciouyan77/DMMO_PIC/refs/heads/main/boss_03.png",
        hp: 13308, atk: 456, def: 152, dodge: 0, trueDmg: 0,
        recommendedGear: "第 6 副本套裝 +5 ~ +7",
        specialTraits: { critResist: 1.0, healSuppression: 0.0, ohkoImmune: true, traitDescription: "【合金裝甲】完全免疫暴擊與秒殺！防禦極高，請利用破甲或真傷應對。" },
        rechallengeScript: [{ speakerId: "CHAR_SYS", text: ">> 終端機警告：重裝機甲引擎重新過載！" }],
        drops: { lore: { id: "lore_doc_03", prob: 0.30 }, gear: { prob: 0.02, pool: ["core_ninja_C", "core_thug_B"] } }
    },
    "BOSS_STORY_04": {
        id: "BOSS_STORY_04",
        name: "時空異變體",
        theme: "【控場核彈流】追求極限控場與一發入魂的終極聖地",
        desc: "受失控粒子對撞機輻射產生的異時空生物，其周遭的物理法則已被徹底扭曲。",
        image: "https://raw.githubusercontent.com/ciouyan77/DMMO_PIC/refs/heads/main/boss_04.png",
        hp: 25951, atk: 889, def: 296, dodge: 25, trueDmg: 80,
        recommendedGear: "第 8 副本套裝 +5 ~ +7",
        specialTraits: { critResist: 0.30, healSuppression: 0.0, ohkoImmune: true, traitDescription: "【時滯力場】自帶 25% 閃避與 80 點空間撕裂真傷，免疫秒殺。" },
        rechallengeScript: [{ speakerId: "CHAR_SYS", text: ">> 終端機警告：偵測到局部時間線扭曲！" }],
        drops: { lore: { id: "lore_doc_04", prob: 0.30 }, gear: { prob: 0.02, pool: ["core_ninja_D", "core_thug_D"] } }
    },
    "BOSS_STORY_05": {
        id: "BOSS_STORY_05",
        name: "瘟疫蟲后",
        theme: "【推圖割草流】專打多波次小怪的頂級神裝",
        desc: "盤據在死寂小鎮地下的幼蟲母體，體內充斥著無數俱備高度傳染性的屍爆菌絲。",
        image: "https://raw.githubusercontent.com/ciouyan77/DMMO_PIC/refs/heads/main/boss_05.png",
        hp: 50606, atk: 1735, def: 578, dodge: 10, trueDmg: 150,
        recommendedGear: "第 10 副本套裝 +5 ~ +7",
        specialTraits: { critResist: 0.20, healSuppression: 0.60, ohkoImmune: true, traitDescription: "【劇毒孢子】附帶 150 點毒素真傷，並使獵犬治療效果大減 60%，免疫秒殺。" },
        rechallengeScript: [{ speakerId: "CHAR_SYS", text: ">> 終端機警告：蟲后帶著無數幼蟲傾巢而出！" }],
        drops: { lore: { id: "lore_doc_05", prob: 0.30 }, gear: { prob: 0.02, pool: ["core_zombie_D", "core_scavenger_A"] } }
    },
    "BOSS_STORY_06": {
        id: "BOSS_STORY_06",
        name: "深淵巨像",
        theme: "【深淵攻克流】中後期以小博大、逆襲強敵的關鍵",
        desc: "自古神祭壇深處甦醒的黑石巨人，全身上下流淌著冷酷的古神黑水。",
        image: "https://raw.githubusercontent.com/ciouyan77/DMMO_PIC/refs/heads/main/boss_06.png",
        hp: 98682, atk: 3383, def: 1127, dodge: 0, trueDmg: 50,
        recommendedGear: "第 12 副本套裝 +5 ~ +7",
        specialTraits: { critResist: 0.60, healSuppression: 0.0, ohkoImmune: true, traitDescription: "【古神意志】防禦極高且擁有 60% 暴擊抗性，免疫秒殺。唯有反傷能有效剋制。" },
        rechallengeScript: [{ speakerId: "CHAR_SYS", text: ">> 終端機警告：深淵巨像從冥河召喚重組！" }],
        drops: { lore: { id: "lore_doc_06", prob: 0.30 }, gear: { prob: 0.02, pool: ["core_zombie_B", "core_abyss_A"] } }
    },
    "BOSS_STORY_07": {
        id: "BOSS_STORY_07",
        name: "賭徒狂人",
        theme: "【極限運氣流】殭屍骰套裝狂熱者首選，刀刀開獎",
        desc: "曾是廢土黑市最大的莊家，注射了過量生化興奮劑後化身為崇尚隨機機率的瘋子。",
        image: "https://raw.githubusercontent.com/ciouyan77/DMMO_PIC/refs/heads/main/boss_07.png",
        hp: 192431, atk: 6597, def: 2199, dodge: 25, trueDmg: 300,
        recommendedGear: "第 14 副本套裝 +5 ~ +7",
        specialTraits: { critResist: 0.0, healSuppression: 0.0, ohkoImmune: true, traitDescription: "【瘋狂賭局】子彈附帶 300 點穿甲真傷與 25% 閃避，免疫秒殺。" },
        rechallengeScript: [{ speakerId: "CHAR_SYS", text: ">> 終端機警告：賭徒狂人再次搖響了命運左輪！" }],
        drops: { lore: { id: "lore_doc_07", prob: 0.30 }, gear: { prob: 0.02, pool: ["core_zombie_A", "core_zombie_C"] } }
    },
    "BOSS_STORY_08": {
        id: "BOSS_STORY_08",
        name: "黑市財閥",
        theme: "【大後期囤積流】長線玩家專屬，感受資產轉化為戰力的爽感",
        desc: "掌握廢土 90% 廢料與金屬命脈的生化巨頭，座駕配有極其昂貴的金屬防護力場。",
        image: "https://raw.githubusercontent.com/ciouyan77/DMMO_PIC/refs/heads/main/boss_08.png",
        hp: 375240, atk: 12865, def: 4288, dodge: 15, trueDmg: 150,
        recommendedGear: "第 16 副本套裝 +5 ~ +7",
        specialTraits: { critResist: 0.40, healSuppression: 0.0, ohkoImmune: true, traitDescription: "【黃金力場】高防禦、高血量、40% 抗暴，免疫秒殺，完美的多邊形戰士。" },
        rechallengeScript: [{ speakerId: "CHAR_SYS", text: ">> 終端機警告：財閥的鋼鐵衛隊再次壓境！" }],
        drops: { lore: { id: "lore_doc_08", prob: 0.30 }, gear: { prob: 0.02, pool: ["core_scavenger_D", "core_scavenger_C"] } }
    },
    "BOSS_STORY_09": {
        id: "BOSS_STORY_09",
        name: "零度守門人",
        theme: "【背水鎖血流】追求血越少、打人越痛的極致張力",
        desc: "鎮守極寒廢墟最後門戶的改造戰士，當其甲胄破碎時，將會釋放核融級別的狂怒。",
        image: "https://raw.githubusercontent.com/ciouyan77/DMMO_PIC/refs/heads/main/boss_09.png",
        hp: 1024407, atk: 35122, def: 11707, dodge: 20, trueDmg: 400,
        recommendedGear: "第 18 副本套裝 +9 (終局壁壘)",
        specialTraits: { critResist: 0.70, healSuppression: 0.0, ohkoImmune: true, traitDescription: "【絕對零度】70% 暴擊抗性與高達 400 點的凍結真傷，免疫秒殺。" },
        rechallengeScript: [{ speakerId: "CHAR_SYS", text: ">> 終端機警告：守門人再次拔出了絕境冰刃！" }],
        drops: { lore: { id: "lore_doc_09", prob: 0.30 }, gear: { prob: 0.02, pool: ["core_abyss_B", "core_thug_C"] } }
    },
    "BOSS_STORY_10": {
        id: "BOSS_STORY_10",
        name: "終焉引力源",
        theme: "【究極永動流】把敵人吸乾、瘋狂反擊挑釁的終極畢業追求",
        desc: "大崩潰事件的源頭，吞噬一切物質與能量的終極生化奇點，廢土最後的終極試煉。",
        image: "https://raw.githubusercontent.com/ciouyan77/DMMO_PIC/refs/heads/main/boss_10.png",
        hp: 1997595, atk: 68489, def: 22829, dodge: 30, trueDmg: 800,
        recommendedGear: "第 20 副本套裝 +9 (滿配畢業)",
        specialTraits: { critResist: 0.85, healSuppression: 0.50, ohkoImmune: true, traitDescription: "【奇點坍縮】30%閃避、85%抗暴、800點真傷、減療50%、免疫秒殺的終極絕望。" },
        rechallengeScript: [{ speakerId: "CHAR_SYS", text: ">> 終端機警告：終焉引力源再次降臨！廢土的命運在此一舉！" }],
        drops: { lore: { id: "lore_doc_10", prob: 0.50 }, gear: { prob: 0.02, pool: ["core_abyss_D", "core_ninja_B"] } }
    }
}
});

// ==========================================
// 征途系統：UI 階段切換與狀態機 (Tab 架構專用)
// ==========================================

let currentStoryContext = {
    script: null,
    boss: null,
    dialogues: [],
    currentLineIndex: 0,
    isCleared: false
};

function switchOdysseyPhase(phaseName) {
    const phases = ['select', 'story', 'prep', 'battle'];
    phases.forEach(p => {
        const el = document.getElementById(`odyssey-phase-${p}`);
        if (el) el.style.display = 'none';
    });
    
    const target = document.getElementById(`odyssey-phase-${phaseName}`);
    if (target) {
        target.style.display = 'flex';
        
        // 🟢 動態載入當前劇本的背景圖 (僅限整備室與戰鬥階段)
        if ((phaseName === 'prep' || phaseName === 'battle') && typeof currentStoryContext !== 'undefined' && currentStoryContext.script && currentStoryContext.script.bgImage) {
            // 加入暗色漸層濾鏡，確保 UI 文字不會被背景吃掉
            target.style.backgroundImage = `linear-gradient(rgba(10,10,10,0.1), rgba(10,10,10,0.3)), url('${currentStoryContext.script.bgImage}')`;
            target.style.backgroundSize = 'cover';
            target.style.backgroundPosition = 'center';
            target.style.border = '1px solid #444';
        }
    }
}

// (替換 story.js 原有的 initOdysseySystem 函數)
function initOdysseySystem() {
    const listContainer = document.getElementById('odyssey-chapter-list');
    if (!listContainer) return;

    if (!window.WastelandDB || !window.WastelandDB.storyScripts) {
        console.error("[系統攔截] WastelandDB 遺失！");
        return;
    }

    // 💎 繼承你舊存檔的優秀設計：加入 unlockedChapters
    if (!gameState.story) {
        gameState.story = { clearedBosses: [], unlockedChapters: ["CH01"] };
    } else if (!gameState.story.unlockedChapters) {
        gameState.story.unlockedChapters = ["CH01"]; // 舊存檔相容
    }
    
    listContainer.innerHTML = '';

    for (const [chId, chData] of Object.entries(window.WastelandDB.storyScripts)) {
        const btn = document.createElement('button');
        btn.className = 'btn';
        
        const isCleared = gameState.story.clearedBosses.includes(chData.targetBossId);
        const isUnlocked = gameState.story.unlockedChapters.includes(chId);
        
                        // 💎 實作三階段按鈕狀態：已通關 / 未探索(已解鎖) / 權限不足(未解鎖)
        if (!isUnlocked) {
            btn.style.borderColor = "#333";
            btn.style.color = "#555";
            btn.innerHTML = `[ 權限不足 ] 未知訊號`;
            btn.disabled = true; // 鎖定
            listContainer.appendChild(btn);
        } else if (isCleared) {
            // 🟢 雙按鈕設計：左側主體用來刷寶，右側小按鈕用來回顧
            const row = document.createElement('div');
            row.style.display = "flex";
            row.style.gap = "8px";
            row.style.marginBottom = "10px";

            // 左側主按鈕 (黃色，點擊進入正常刷寶/戰鬥)
            btn.style.flex = "1";
            btn.style.borderColor = '#ffaa00';
            btn.style.color = '#ffaa00';
            btn.style.margin = "0"; 
            btn.innerHTML = `[已通關] ${chData.title} <span style="font-size:0.8em; color:#aaa;">- 重複刷寶</span>`;
            btn.onclick = () => startChapter(chId, false); // 傳入 false 代表戰鬥模式

            // 右側回顧按鈕 (灰色中空，點擊觀看劇情)
            const replayBtn = document.createElement('button');
            replayBtn.className = 'btn';
            replayBtn.style.borderColor = '#666';
            replayBtn.style.color = '#aaa';
            replayBtn.style.background = 'transparent';
            replayBtn.style.width = 'auto';
            replayBtn.style.margin = "0";
            replayBtn.style.padding = "0 15px";
            replayBtn.innerHTML = `回顧`;
            replayBtn.onclick = () => startChapter(chId, true); // 傳入 true 代表回顧模式

            row.appendChild(btn);
            row.appendChild(replayBtn);
            listContainer.appendChild(row);
        } else {
            btn.style.borderColor = '#ff5555';
            btn.style.color = '#ff5555';
            btn.innerHTML = `[未探索] ${chData.title} <span style="font-size:0.8em; color:#ff5555;">- 致命警告</span>`;
            btn.onclick = () => startChapter(chId);
            listContainer.appendChild(btn);
        }
}
    switchOdysseyPhase('select');
}


function startChapter(chapterId, isReplay = false) {
    const script = window.WastelandDB.storyScripts[chapterId];
    const bossId = script.targetBossId;
    const bossData = window.WastelandDB.storyBosses[bossId];
    
    if (!gameState.story) gameState.story = { clearedBosses: [] };
    const isCleared = gameState.story.clearedBosses.includes(bossId);

    // 🟢 縫合劇情：如果是回顧模式，將戰前、戰鬥黑畫面、戰後劇情接在一起
    let finalDialogues = [];
    if (isReplay) {
        finalDialogues = [...script.dialogues];
        finalDialogues.push({ speakerId: "CHAR_SYS", text: "【記憶回溯】系統略過了激烈的死鬥過程...", isBlackScreen: true });
        if (script.postDialogues) finalDialogues.push(...script.postDialogues);
    } else {
        finalDialogues = script.dialogues;
    }

    currentStoryContext = {
        script: script,
        boss: bossData,
        dialogues: finalDialogues,
        currentLineIndex: 0,
        isCleared: isCleared,
        isReplay: isReplay // 紀錄當前是否為回顧狀態
    };

    const stage = document.getElementById('odyssey-visual-stage');
    if (stage) stage.style.backgroundImage = `url('${script.bgImage}')`;

    document.getElementById('odyssey-next-btn').style.display = 'block';
    document.getElementById('odyssey-prep-btn').style.display = 'none';

    // 🟢 注入右上角的「結束回顧」返回按鈕
    let returnBtn = document.getElementById('odyssey-replay-return-btn');
    if (!returnBtn) {
        returnBtn = document.createElement('button');
        returnBtn.id = 'odyssey-replay-return-btn';
        returnBtn.innerText = "✖ 結束回顧";
        returnBtn.style.position = "absolute";
        returnBtn.style.top = "10px";
        returnBtn.style.right = "10px";
        returnBtn.style.padding = "5px 10px";
        returnBtn.style.background = "rgba(0,0,0,0.7)";
        returnBtn.style.color = "#fff";
        returnBtn.style.border = "1px solid #555";
        returnBtn.style.zIndex = "100";
        returnBtn.onclick = () => { switchOdysseyPhase('select'); initOdysseySystem(); };
        const storyPhase = document.getElementById('odyssey-phase-story');
        if (storyPhase) {
            storyPhase.style.position = "relative";
            storyPhase.appendChild(returnBtn);
        }
    }
    returnBtn.style.display = isReplay ? 'block' : 'none';

    switchOdysseyPhase('story');
    renderCurrentDialogue(); 
}


// (替換 story.js 原有的 renderCurrentDialogue 函數)
function renderCurrentDialogue() {
    const context = currentStoryContext;
    
    if (context.currentLineIndex >= context.dialogues.length) {
        document.getElementById('odyssey-next-btn').style.display = 'none';
        if (context.isReplay) {
            switchOdysseyPhase('select');
            initOdysseySystem();
        } else {
            document.getElementById('odyssey-prep-btn').style.display = 'block';
        }
        return;
    }

    const currentLine = context.dialogues[context.currentLineIndex];
    const actor = window.WastelandDB.characters[currentLine.speakerId] || { name: "UNKNOWN", sprite: "" };

    const badgeEl = document.getElementById('odyssey-speaker-badge');
    const textEl = document.getElementById('odyssey-text');
    const spriteEl = document.getElementById('odyssey-character-sprite');

    // 🟢 1. 取得自訂姓名 (若無則回退預設)
    const customPlayerName = (typeof gameState !== 'undefined' && gameState.playerName) ? gameState.playerName : "倖存者";
    const customHoundName = (typeof gameState !== 'undefined' && gameState.houndName) ? gameState.houndName : "廢土獵犬";

    // 🟢 2. 判斷說話者標籤是否需要動態置換 (精準鎖定 ID)
    let displaySpeakerName = actor.name;
    if (currentLine.speakerId === "CHAR_SURVIVOR") {
        displaySpeakerName = customPlayerName;
    } else if (currentLine.speakerId === "CHAR_HOUND") {
        displaySpeakerName = customHoundName;
    }

    if (!displaySpeakerName || displaySpeakerName === "") {
        badgeEl.style.display = 'none';
        textEl.style.fontStyle = 'italic';
        textEl.style.color = '#aaa';
    } else {
        badgeEl.style.display = 'inline-block';
        badgeEl.innerText = displaySpeakerName;
        badgeEl.style.backgroundColor = actor.bgColor || "#55ff55";
        badgeEl.style.color = actor.textColor || "#000";
        textEl.style.fontStyle = 'normal';
        textEl.style.color = '#fff';
    }

    // 🚀 3. 動態字串引擎：全域正則替換專屬變數標籤 (不誤傷一般名詞)
    let parsedText = currentLine.text;
    if (context.boss && context.boss.name) {
        parsedText = parsedText.replace(/\{BOSS_NAME\}/g, context.boss.name);
    }
    parsedText = parsedText.replace(/\{PLAYER\}/g, customPlayerName);
    parsedText = parsedText.replace(/\{HOUND\}/g, customHoundName);
    textEl.innerText = parsedText;

    // 🟢 4. 處理黑畫面特效與「自訂去背立繪」覆蓋
    const stageEl = document.getElementById('odyssey-visual-stage');
    if (currentLine.isBlackScreen) {
        if (stageEl) { stageEl.style.backgroundImage = 'none'; stageEl.style.backgroundColor = '#000'; }
        spriteEl.style.display = 'none';
    } else {
        if (stageEl) { stageEl.style.backgroundImage = `url('${context.script.bgImage}')`; stageEl.style.backgroundColor = 'transparent'; }
        
        let targetSprite = actor.sprite;
        
        // 🟢 判斷是否為主角或獵犬發言，且有勾選顯示相片
        if (typeof gameState !== 'undefined' && gameState.showAvatarInStory) {
            if (currentLine.speakerId === "CHAR_SURVIVOR" && gameState.playerAvatar) {
                targetSprite = gameState.playerAvatar;
            } else if (currentLine.speakerId === "CHAR_HOUND" && gameState.houndAvatar) {
                targetSprite = gameState.houndAvatar;
            }
        }

        if (!targetSprite || targetSprite === "") {
            spriteEl.style.display = 'none';
        } else {
            spriteEl.src = targetSprite;
            spriteEl.style.display = 'block';
            // 🟢 確保去背 PNG 在劇情舞台上維持透明底，不變形
            spriteEl.style.backgroundColor = 'transparent';
            spriteEl.style.objectFit = 'contain';
        }
    }
}




function nextOdysseyDialogue() {
    currentStoryContext.currentLineIndex++;
    renderCurrentDialogue();
}

// ==========================================
// 征途系統：戰術整備室與即時換裝引擎
// ==========================================

function enterOdysseyPrep() {
    switchOdysseyPhase('prep');
    updateOdysseyPrepUI();
}

// ==========================================
// 征途系統：戰術整備室 (究極終端機視覺版)
// ==========================================


// 7. 刷新整備室數值與裝備狀態 (精準對接 total 變數版)
async function updateOdysseyPrepUI() {
    const context = currentStoryContext;
    if (!context || !context.boss) return;
    const boss = context.boss;

    document.getElementById('boss-prep-name').innerText = boss.name;
    document.getElementById('boss-prep-hp').innerText = boss.hp;
    document.getElementById('boss-prep-atk').innerText = boss.atk;
    document.getElementById('boss-prep-trait').innerText = boss.specialTraits.traitDescription;

    // 確保核心數值在渲染前已被精準重算
    if (typeof calculateHoundStats === 'function') {
        const res = calculateHoundStats();
        if (res instanceof Promise) await res;
    }

    // 💎 變數精準對接：抓取你系統底層的 totalAtk, totalDef 等正確變數！
    const houndHp = gameState.hound.hp || 0;
    const houndMaxHp = gameState.hound.maxHp || 100;
    const atk = gameState.hound.totalAtk || gameState.hound.baseAtk || 0;
    const def = gameState.hound.totalDef || gameState.hound.baseDef || 0;
    const crit = (gameState.hound.totalCrit || gameState.hound.baseCrit || 10) + "%";
    const dodge = (gameState.hound.totalDodge || gameState.hound.baseDodge || 5) + "%";
    const ohko = (gameState.hound.ohko || 0) + "%";

    let equippedItems = [];
    if (typeof db !== 'undefined' && db.inventory_items) {
        equippedItems = await db.inventory_items.where("is_equipped").equals(1).toArray();
    }

    const rColor = { common: '#888888', rare: '#55aaff', set: '#55ff55', legendary: '#ffcc00', apocalyptic: '#ff2222' };

    let eqHtml = '';
    if (equippedItems.length === 0) {
        eqHtml = `<div style="color:#777; font-size:0.85em; text-align:center; padding:10px;">[著裝狀態：無武裝]</div>`;
    } else {
        equippedItems.forEach(item => {
            let color = rColor[item.rarity] || '#888';
            let lvlStr = item.level ? `<span style="color:#00ffcc; font-weight:bold;">+${item.level}</span>` : "";
            let slotName = item.slotText || item.slot || "裝備";

            let lvlMult = 1 + (item.level || 0) * 0.1;
            let iAtk = Math.floor((item.atk||0) * lvlMult);
            let iDef = Math.floor((item.def||0) * lvlMult);

            eqHtml += `
            <div style="border: 1px dashed ${color}; padding: 8px; margin-bottom: 6px; background: rgba(0,0,0,0.4); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="color: ${color}; font-weight: bold; font-size: 0.9em; margin-bottom: 4px;">
                        [已著裝] ${item.name} ${lvlStr}
                    </div>
                    <div style="color: #aaa; font-size: 0.8em;">
                        [${slotName}] 攻擊: +${iAtk} | 防禦: +${iDef}
                    </div>
                </div>
                <div style="color: #555; font-size: 0.75em; letter-spacing: 1px;">[LOCKED]</div>
            </div>
            `;
        });
    }

    const miniInv = document.getElementById('prep-mini-inv');
    if (miniInv) {
        miniInv.innerHTML = `
            <div style="border: 1px dashed #444; padding: 10px; margin-bottom: 10px; background: rgba(0,0,0,0.2);">
                <div style="color: #ffaa00; font-size: 0.85em; margin-bottom: 8px; border-bottom: 1px dashed #444; padding-bottom: 4px;">[ 著裝狀態 ]</div>
                ${eqHtml}
                <button class="btn" onclick="goToInventoryFromPrep()" style="width: 100%; border-color: var(--zaco-color); color: var(--zaco-color); margin-top: 5px; font-weight: bold; box-shadow: 0 0 8px rgba(255, 215, 0, 0.2);">
                    >> 開啟武裝庫 (04_INV) 進行換裝
                </button>
            </div>
            
            <div style="border: 1px dashed #444; padding: 10px; background: rgba(0,0,0,0.2);">
                <div style="color: #ffaa00; font-size: 0.85em; margin-bottom: 8px; border-bottom: 1px dashed #444; padding-bottom: 4px;">[ 核心能力值 ]</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.85em; color: #ccc;">
                    <div style="grid-column: span 2; border-bottom: 1px dotted #333; padding-bottom: 4px; color: #fff;">
                        生命: <span style="font-weight:bold; color:#00ffcc;">${houndHp} / ${houndMaxHp}</span>
                    </div>
                    <div>攻擊力: <span style="color:#fff; font-weight:bold;">${atk}</span></div>
                    <div>防禦力: <span style="color:#fff;">${def}</span></div>
                    <div>暴擊率: <span style="color:#ffaa00;">${crit}</span></div>
                    <div>閃避率: <span style="color:#55aaff;">${dodge}</span></div>
                    <div>秒殺率: <span style="color:#ff3333;">${ohko}</span></div>
                </div>
            </div>
        `;
    }
}



// 8. 整備室專用：直接卸下裝備
async function unequipFromPrep(itemId) {
    if (typeof db === 'undefined' || !db.inventory_items) return;
    const item = await db.inventory_items.get(itemId);
    
    if (item) {
        item.is_equipped = 0;
        await db.inventory_items.put(item);
        
        // 💎 強制洗腦系統：清空記憶體裡對應的裝備位，迫使系統承認獵犬被扒光了！
        if (gameState.hound && gameState.hound.equipment) {
            const s = item.slot || item.slotText || "";
            if (s === 'head' || s.includes('頭')) gameState.hound.equipment.helmet = null;
            if (s === 'neck' || s === 'collar' || s.includes('項')) gameState.hound.equipment.collar = null;
            if (s === 'body' || s === 'harness' || s.includes('背') || s.includes('甲')) gameState.hound.equipment.harness = null;
        }
    }
    
    // 呼叫重算與介面更新，此時計算函數會發現裝備已經 null 了，就會把攻擊力扣回去
    if (typeof calculateHoundStats === 'function') await calculateHoundStats();
    if (typeof renderCampUI === 'function') renderCampUI();
    if (typeof updateUI === 'function') updateUI(); 
    
    // 更新整備室畫面顯示
    await updateOdysseyPrepUI();
}



// 9. 整備室專用：跳轉背包，並發送「返回信號」
function goToInventoryFromPrep() {
    window._odysseyReturnActive = true;
    switchTab('inv');
    updateInvReturnButton();
}

// 10. 動態注入「返回整備室」按鈕到背包介面
function updateInvReturnButton() {
    const invTab = document.getElementById('tab-inv');
    if (!invTab) return;
    
    let btn = document.getElementById('odyssey-return-btn');
    if (window._odysseyReturnActive) {
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'odyssey-return-btn';
            btn.className = 'btn';
            btn.style.borderColor = '#ff5555';
            btn.style.color = '#ff5555';
            btn.style.fontWeight = 'bold';
            btn.style.marginBottom = '15px';
            btn.style.boxShadow = '0 0 10px rgba(255,85,85,0.3)';
            btn.innerHTML = '<< 裝備替換完畢，點此返回【戰術整備室】';
            
            // 點擊後，消滅按鈕並返回
            btn.onclick = async () => {
                window._odysseyReturnActive = false;
                btn.style.display = 'none';
                switchTab('odyssey');
                await updateOdysseyPrepUI();
            };
            // 將按鈕插入到物品欄的最上方
            invTab.insertBefore(btn, invTab.firstChild);
        }
        btn.style.display = 'block';
    } else {
        if (btn) btn.style.display = 'none';
    }
}


// ==========================================
// 征途系統：絕境死鬥引擎 (Phase 3: Battle)
// ==========================================

let odysseyBattleTimer = null;

// 1. 發動死鬥 (初始化)
function startOdysseyBattle() {
    if (!currentStoryContext || !currentStoryContext.boss) return;
    const boss = currentStoryContext.boss;

    switchOdysseyPhase('battle');

    const exitBtn = document.getElementById('odyssey-emergency-exit');
    if (exitBtn) exitBtn.style.display = 'block'; // 確保每次戰鬥開始都有撤退按鈕


    // UI 初始化
    document.getElementById('boss-battle-name').innerText = boss.name;
    document.getElementById('boss-battle-maxhp').innerText = boss.hp;
    document.getElementById('boss-battle-hp').innerText = boss.hp;
    const hpBar = document.getElementById('boss-battle-hp-bar');
    if (hpBar) hpBar.style.width = '100%';

    // 載入立繪 (直接把圖片路徑塞給 HTML 裡已經預留好的全螢幕 img 標籤)
    let bossImgEl = document.getElementById('boss-battle-sprite');
    if (bossImgEl) {
        bossImgEl.src = boss.image || boss.sprite || "https://api.dicebear.com/7.x/bottts/svg?seed=boss&backgroundColor=transparent"; 
        bossImgEl.alt = boss.name;
    }

    // 清空日誌與按鈕區 (為新戰鬥淨空畫面)
    const logEl = document.getElementById('odyssey-battle-log');
    if (logEl) logEl.innerHTML = ''; 
    const actionArea = document.getElementById('odyssey-battle-action-area');
    if (actionArea) actionArea.innerHTML = '';

    // 將 Boss 滿血載入記憶體
    currentStoryContext.bossCurrentHp = boss.hp;
    
    appendOdysseyLog(`>> 空間封鎖完畢。死鬥開始！`, '#ff5555');
    appendOdysseyLog(`> 檢測到【${boss.name}】的高能反應...`, '#ffaa00');

    // 清除舊計時器，啟動心跳迴圈 (每 1.5 秒交鋒一次)
    if (odysseyBattleTimer) clearInterval(odysseyBattleTimer);
    odysseyBattleTimer = setInterval(odysseyBattleTick, 1500);
}


// 2. 戰鬥交鋒迴圈 (心跳引擎 - 終極武裝版 + 屬性實裝 + 完美減療補給)
function odysseyBattleTick() {
    if (!currentStoryContext || !currentStoryContext.boss) return endOdysseyBattle(false, "系統異常，強制中止。");
    const boss = currentStoryContext.boss;

    // 🚀 動態抓取裝備欄核心，免疫資料斷鏈
    let coreRes = (gameState.equipped && gameState.equipped.core && gameState.equipped.core.resonance) ? gameState.equipped.core.resonance : null;
    let maxHp = gameState.hound.maxHp || 100;

    // 🍖 [實裝] 王關專屬吃肉乾與減療機制
    let healSuppression = (boss.specialTraits && boss.specialTraits.healSuppression) ? boss.specialTraits.healSuppression : 0;
    
    if (gameState.hound.hp <= maxHp * 0.5 && (gameState.resources.food || 0) > 0) {
        gameState.resources.food -= 1;
        // 計算原補血量 (25%)，並扣除 Boss 專屬減療比例
        let baseHeal = Math.floor(maxHp * 0.25);
        let finalHeal = Math.floor(baseHeal * (1 - healSuppression));
        
        gameState.hound.hp = Math.min(maxHp, gameState.hound.hp + finalHeal);
        
        let healLog = `🍖 [緊急補給] 消耗 1 肉乾，恢復 ${finalHeal} HP！`;
        if (healSuppression > 0) {
            healLog += ` <span style="color:#ff5555;">(受減療影響 -${healSuppression * 100}%)</span>`;
        }
        appendOdysseyLog(healLog, '#00ffcc');
        
        if (typeof renderCampUI === 'function') renderCampUI();
        if (typeof updateUI === 'function') updateUI(); 
    }

    let currentAtk = gameState.hound.totalAtk || 10;
    let currentDef = gameState.hound.totalDef || 0;
    let currentDodge = gameState.hound.totalDodge || 0;
    let currentCrit = gameState.hound.totalCrit || 10;
    let cMult = gameState.hound.critMult || 2;

    // 🛡️ [實裝] 計算被 Boss 抗暴減去後的真實暴擊率
    let bossCritResist = (boss.specialTraits && boss.specialTraits.critResist) ? boss.specialTraits.critResist : 0;
    let actualCritRate = Math.max(0, currentCrit - (bossCritResist * 100));

    // --- 【回合 A：獵犬攻擊階段】 ---
    if (coreRes === 'scavenger_B' && currentStoryContext.bossCurrentHp > (boss.hp || 100) * 0.5) currentAtk += 30;
    if (coreRes === 'thug_D') cMult = gameState.hound.thugDMult || CORE_CONFIG.thug_D.baseCritMult;
    if (coreRes === 'thug_C' && gameState.hound.hp < maxHp * 0.3) cMult = Math.max(cMult, CORE_CONFIG.thug_C.boostedCritMult);

    let isGuaranteedCrit = gameState.hound.guaranteedCrit === true;
    let isCrit = isGuaranteedCrit || (Math.random() * 100 < actualCritRate);
    if (isCrit && coreRes === 'ninja_B' && Math.random() < CORE_CONFIG.ninja_B.doubleCritChance) cMult *= 2;
    if (isGuaranteedCrit) gameState.hound.guaranteedCrit = false;
    
    if (gameState.hound.ninjaABuff) { currentAtk = Math.floor(currentAtk * (1 + CORE_CONFIG.ninja_A.postCritAtkBonus)); gameState.hound.ninjaABuff = false; }

    // 💨 [實裝] Boss 閃避檢定
    let bossDodgeRate = boss.dodge || 0;
    let isHoundMiss = Math.random() * 100 < bossDodgeRate;

    if (isHoundMiss) {
        appendOdysseyLog(`> 💨 【${boss.name}】身形一閃，完全迴避了獵犬的攻擊！`, '#888');
    } else {
        let dmgDealt = isCrit ? Math.floor(currentAtk * cMult) : currentAtk;
        if (isCrit && coreRes === 'ninja_C') {
            let overflow = Math.max(0, currentDodge - CORE_CONFIG.ninja_C.dodgeOverflowThreshold);
            if (overflow > 0) dmgDealt += Math.floor(overflow * 2);
        }

        let ohkoChance = gameState.hound.ohko || 0;
        if (coreRes === 'zombie_A') ohkoChance += (gameState.hound.zombieAPity || 0);
        else if (coreRes === 'zombie_C' && gameState.hound.zombieCBoosted) ohkoChance = Math.min(CORE_CONFIG.zombie_C.maxOHKO, ohkoChance * 2);

        // 🟢 殭屍骰與攻擊結算
        if (Math.random() * 100 < ohkoChance) {
            if (coreRes === 'zombie_A') gameState.hound.zombieAPity = 0;
            if (coreRes === 'zombie_C') gameState.hound.zombieCBoosted = true;

            if (coreRes === 'zombie_B') {
                dmgDealt = Math.max(1, Math.floor(currentStoryContext.bossCurrentHp * CORE_CONFIG.zombie_B.bossCurrentHpPercent));
                appendOdysseyLog(`>> [死靈壞疽] 觸發！強制削去 ${dmgDealt} HP！`, '#c355ff');
            } else if (coreRes === 'zombie_D') {
                dmgDealt = Math.floor(currentAtk * CORE_CONFIG.zombie_D.explosionAtkMult);
                gameState.hound.zombieDStacks = Math.min(CORE_CONFIG.zombie_D.maxStacks, (gameState.hound.zombieDStacks || 0) + 1);
                appendOdysseyLog(`>> [生化屍爆] 觸發造成 ${dmgDealt} 點傷害！`, '#00ff66');
            } else {
                // 🛡️ [實裝] 防秒殺機制
                if (boss.specialTraits && boss.specialTraits.ohkoImmune) {
                    dmgDealt = Math.floor(currentAtk * 4); // 轉化為 4 倍重擊
                    appendOdysseyLog(`>> 💥 [致命一擊] 觸發！但【${boss.name}】免疫秒殺，轉化為 ${dmgDealt} 點爆發重擊！`, '#ffaa00');
                } else {
                    dmgDealt = 999999;
                    appendOdysseyLog(`>> [致命一擊] 觸發殭屍骰效果，直接秒殺！`, '#ff2222');
                }
            }
        } else {
            if (coreRes === 'zombie_A') gameState.hound.zombieAPity = (gameState.hound.zombieAPity || 0) + CORE_CONFIG.zombie_A.missAddOHKO;
            if (coreRes === 'zombie_C') gameState.hound.zombieCBoosted = false;
            let critTag = isGuaranteedCrit ? " <span style='color:#00ff66;'>[忍術必爆!]</span>" : (isCrit ? " <span style='color:var(--zaco-color);'>(暴擊)</span>" : "");
            appendOdysseyLog(`> 獵犬發起撕咬，造成 ${dmgDealt} 點傷害${critTag}。`, '#ddd');
        }

        // 🟢 戰後追擊與恢復特效
        if (coreRes === 'thug_D') {
            if (isCrit) gameState.hound.thugDMult = CORE_CONFIG.thug_D.baseCritMult;
            else gameState.hound.thugDMult = Math.min(CORE_CONFIG.thug_D.maxCritMult, (gameState.hound.thugDMult || CORE_CONFIG.thug_D.baseCritMult) + 1);
        }
        if (coreRes === 'scavenger_C') gameState.hound.shield = (gameState.hound.shield || 0) + Math.floor(dmgDealt * CORE_CONFIG.scavenger_C.lifestealShieldPercent);
        if (isCrit && coreRes === 'thug_A') {
            let healHp = Math.floor(dmgDealt * CORE_CONFIG.thug_A.critLifestealPercent);
            gameState.hound.hp = Math.min(maxHp, gameState.hound.hp + healHp);
            appendOdysseyLog(`(嗜血恢復 ${healHp} HP)`, '#55ff55');
        }
        if (isCrit && coreRes === 'thug_B' && Math.random() < CORE_CONFIG.thug_B.stunChance) {
            boss.stunned = true;
            appendOdysseyLog(`[腦部震盪：目標眩暈!]`, '#ffcc00');
        }
        if (isCrit && coreRes === 'ninja_A') {
            let echoDmg = Math.floor(dmgDealt * CORE_CONFIG.ninja_A.echoDmgPercent);
            currentStoryContext.bossCurrentHp -= echoDmg;
            gameState.hound.ninjaABuff = true;
            appendOdysseyLog(`> 👤 [量子殘影] 追加連擊造成 ${echoDmg} 點傷害！`, '#00ff66');
        }

        currentStoryContext.bossCurrentHp -= dmgDealt;
    } 

    updateOdysseyBossHpUI();
    if (currentStoryContext.bossCurrentHp <= 0) return endOdysseyBattle(true, `>> 【${boss.name}】已被徹底摧毀！`);

    // --- 【回合 B：Boss 反擊階段】 ---
    if (boss.stunned) {
        boss.stunned = false;
        appendOdysseyLog(`💫 敵人處於眩暈狀態，無法發動攻擊！`, '#aaa');
    } else if (Math.random() * 100 < currentDodge) {
        let dodgeLog = `> 💨 [幻影] 獵犬靈巧地閃避了敵人的攻擊！`;
        if (coreRes === 'ninja_B') {
            let shieldAdd = Math.floor(currentDodge * CORE_CONFIG.ninja_B.dodgeToShieldRatio);
            gameState.hound.shield = (gameState.hound.shield || 0) + shieldAdd;
            dodgeLog += ` <span style="color:#00ff66;">[護盾 +${shieldAdd}]</span>`;
        }
        if (gameState.hound.dodgeCrit) {
            gameState.hound.guaranteedCrit = true;
            dodgeLog += ` <span style="color:#00ff66;">[殘影反擊啟動]</span>`;
        }
        appendOdysseyLog(dodgeLog, '#55aaff');
    } else {
        let bossAtk = boss.atk || 20;
        if (coreRes === 'abyss_D' && gameState.hound.abyssDDebuff) bossAtk = Math.floor(bossAtk * (1 - gameState.hound.abyssDDebuff));

        // 🛡️ 常規防禦與護盾計算
        let rawDmgTaken = Math.max(1, bossAtk - currentDef);
        if (coreRes === 'thug_A') rawDmgTaken = Math.floor(rawDmgTaken * (1 + CORE_CONFIG.thug_A.selfDmgPenalty));

        let dmgTaken = rawDmgTaken;
        if ((gameState.hound.shield || 0) > 0) {
            if (gameState.hound.shield >= dmgTaken) { gameState.hound.shield -= dmgTaken; dmgTaken = 0; }
            else { dmgTaken -= gameState.hound.shield; gameState.hound.shield = 0; }
        }

        // ☠️ [實裝] 無視防禦與護盾的真傷
        let trueDmg = boss.trueDmg || 0;
        let finalDmgTaken = dmgTaken + trueDmg; 

        gameState.hound.hp = Math.max(0, gameState.hound.hp - finalDmgTaken);
        
        let hitLog = `> 💥 遭受重擊，受傷 ${rawDmgTaken} 點 (實扣 ${dmgTaken})`;
        if (trueDmg > 0) hitLog += `，並受到 <span style="color:#ff3333;">${trueDmg} 點真傷</span>`;
        hitLog += `。`;
        
        if (coreRes === 'abyss_B' && !gameState.hound.abyssBUsed && (gameState.hound.hp <= 0 || gameState.hound.hp < maxHp * CORE_CONFIG.abyss_B.cheatDeathHpThreshold)) {
            gameState.hound.hp = 1; gameState.hound.abyssBUsed = true;
            let burstDmg = Math.floor((gameState.hound.totalReflectedDmg || 500) * CORE_CONFIG.abyss_B.reflectAccumulatedBurstMult);
            currentStoryContext.bossCurrentHp -= burstDmg;
            appendOdysseyLog(`❄️ [零度晶核] 絕境觸發！晶體風暴造成 ${burstDmg} 爆發傷害！`, '#00ffff');
        }

        let reflectRate = gameState.hound.reflect || 0;
        if (reflectRate > 0) {
            let reflectDmg = Math.floor(rawDmgTaken * reflectRate);
            if (coreRes === 'abyss_A' && Math.random() * 100 < currentCrit) {
                reflectDmg = Math.floor(reflectDmg * (gameState.hound.critMult || 2));
                let healHp = Math.floor(maxHp * CORE_CONFIG.abyss_A.reflectCritHealHpPercent);
                gameState.hound.hp = Math.min(maxHp, gameState.hound.hp + healHp);
                hitLog += ` <span style="color:#00ff66;">[反傷暴擊! +${healHp} HP]</span>`;
            }
            currentStoryContext.bossCurrentHp -= reflectDmg;
            gameState.hound.totalReflectedDmg = (gameState.hound.totalReflectedDmg || 0) + reflectDmg;
            hitLog += ` <span style="color: #ff3333;">(反彈 ${reflectDmg} 傷害)</span>`;

            if (coreRes === 'abyss_C') gameState.hound.shield = Math.min(maxHp * CORE_CONFIG.abyss_C.maxShieldHpPercent, (gameState.hound.shield || 0) + Math.floor(reflectDmg * CORE_CONFIG.abyss_C.reflectToShieldPercent));
            if (coreRes === 'abyss_D') gameState.hound.abyssDDebuff = Math.min(CORE_CONFIG.abyss_D.maxEnemyAtkDebuff, (gameState.hound.abyssDDebuff || 0) + CORE_CONFIG.abyss_D.enemyAtkDebuffStep);
        }
        appendOdysseyLog(hitLog, '#ffaa00');

        if (typeof renderCampUI === 'function') renderCampUI();
        if (typeof updateUI === 'function') updateUI(); 

        updateOdysseyBossHpUI();
        if (currentStoryContext.bossCurrentHp <= 0) return endOdysseyBattle(true, `>> 【${boss.name}】被自己的攻擊反彈致死！`);
        if (gameState.hound.hp <= 0) return endOdysseyBattle(false, `<b style="color:#ff3333; font-size:1.1rem;">💀 [SYSTEM_WARNING] 承受傷害超過極限，獵犬遭到擊倒！</b>`);
    }
}


// 3. 戰鬥結算與中止
function endOdysseyBattle(isVictory, finalMessage) {
    if (odysseyBattleTimer) clearInterval(odysseyBattleTimer);

    if (isVictory) {
        appendOdysseyLog(finalMessage, '#00ff66');
        appendOdysseyLog(">> 戰鬥連線結束。正在獲取戰利品...", '#00ff66');
        
        // 紀錄通關
        const bossId = currentStoryContext.boss.id;
        if (!gameState.story.clearedBosses.includes(bossId)) {
            gameState.story.clearedBosses.push(bossId);
        }
        
        // 🚀 新增：自動推算並解鎖下一章節
        const currentChId = Object.keys(window.WastelandDB.storyScripts).find(key => window.WastelandDB.storyScripts[key].targetBossId === bossId);
        if (currentChId) {
            // 解析當前章節數字並 +1 (例如 CH01 -> CH02)
            const nextChNum = parseInt(currentChId.replace('CH', '')) + 1;
            const nextChId = 'CH' + nextChNum.toString().padStart(2, '0');
            
            // 如果下一章存在，且尚未解鎖，則賦予權限
            if (window.WastelandDB.storyScripts[nextChId] && !gameState.story.unlockedChapters.includes(nextChId)) {
                gameState.story.unlockedChapters.push(nextChId);
                appendOdysseyLog(`>> [系統提示] 權限升級！已解鎖新章節：${window.WastelandDB.storyScripts[nextChId].title}`, '#00ffcc');
            }
        }
        
        // 預留未來鉤子：分配主線專屬掉落物
        processOdysseyBossLoot(bossId);
        
    } else {
        appendOdysseyLog(finalMessage, '#ff5555');
        appendOdysseyLog(">> 戰鬥連線中斷。[ YOU DIED ]", '#ff5555');
    }

    // 🟢 核心修復：廢土系統的標準存檔指令是 savePlayerState()，不是 saveGame()！
    if (typeof savePlayerState === 'function') savePlayerState();

        // ▼▼▼ 貼上新的代碼 ▼▼▼
    const actionArea = document.getElementById('odyssey-battle-action-area');
    if (actionArea) {
        actionArea.innerHTML = ''; // 確保淨空
        const btn = document.createElement('button');
        btn.id = 'odyssey-battle-exit-btn';
        btn.className = 'btn';
        btn.style.width = '100%';
        btn.style.margin = '0'; // 消除預設 margin
        btn.style.borderColor = isVictory ? '#00ff66' : '#ff5555';
        btn.style.color = isVictory ? '#00ff66' : '#ff5555';
        btn.style.fontWeight = 'bold';
        btn.style.backgroundColor = 'rgba(0,0,0,0.6)'; // 加上半透明黑底讓按鈕更清楚
        btn.style.backdropFilter = 'blur(4px)';
        btn.innerText = isVictory ? ">> [ 戰術目標達成_提取戰利品 ]" : ">> [ 撤退_返回系統 ]";
        
        btn.onclick = () => {
            if (isVictory && currentStoryContext.script.postDialogues) {
                currentStoryContext.dialogues = currentStoryContext.script.postDialogues;
                currentStoryContext.currentLineIndex = 0;
                currentStoryContext.isReplay = true; 
                
                document.getElementById('odyssey-next-btn').style.display = 'block';
                document.getElementById('odyssey-prep-btn').style.display = 'none';

                switchOdysseyPhase('story');
                renderCurrentDialogue();
            } else {
                switchOdysseyPhase('select'); 
                initOdysseySystem(); 
            }
        };
        actionArea.appendChild(btn); // 🎯 關鍵改變：把按鈕塞進新的 action-area 裡
    }
    // ▲▲▲ 貼上結束 ▲▲▲

}


// ==========================================
// 征途系統：專屬戰利品與劇情解密引擎
// ==========================================

// 4. 戰鬥勝利後的掉落結算鉤子
async function processOdysseyBossLoot(bossId) {
    if (!currentStoryContext || !currentStoryContext.boss) return;
    
    const boss = currentStoryContext.boss;
    let lootLog = [];

    if (boss.drops) {
        // A. 判定機密文件 (Lore) 掉落
        if (boss.drops.lore && Math.random() <= boss.drops.lore.prob) {
            const loreId = boss.drops.lore.id;
            if (!gameState.unlockedLore.includes(loreId)) {
                gameState.unlockedLore.push(loreId);
                lootLog.push(`<b style="color:#d69e2e; font-size:1.05em;">📜 [機密解密] 獲取檔案資料：[${loreId}]</b>`);
            } else {
                gameState.resources.zaco += 50; 
                lootLog.push(`<span style="color:#aaa;">📜 [檔案已解析] 重複的機密資料已自動轉換為 +50 ZaCo</span>`);
            }
        }

                // B. 🎯 主線 Boss 專屬紫色核心掉落 (讀取 Boss 專屬 pool 陣列 + 防臉黑 Soft Pity & 許願鎖)
        if (boss.drops && boss.drops.gear) {
            const baseProb = boss.drops.gear.prob || 0.02; // 預設 2% 基礎率
            const currentPity = gameState.bossPity || 0;
            const currentTotalProb = baseProb + (currentPity * 0.005); // 每次未中 +0.5% 保底

            if (Math.random() <= currentTotalProb) {
                // 🚀 優先讀取這個 Boss 配置的專屬 2 大核心 Pool
                let bossPool = boss.drops.gear.pool || (boss.drops.gear.id ? [boss.drops.gear.id] : []);
                
                if (bossPool.length === 0 && typeof EXOTIC_CORE_DATABASE !== 'undefined') {
                    bossPool = Object.keys(EXOTIC_CORE_DATABASE);
                }

                // 🔒 許願鎖：優先挑選玩家「尚未擁有」的專屬核心
                const ownedItems = await db.inventory_items.toArray();
                const ownedSet = new Set(ownedItems.map(i => i.resonance || i.id));
                const unownedCores = bossPool.filter(cid => !ownedSet.has(cid));
                
                let targetGearId = unownedCores.length > 0 
                    ? unownedCores[Math.floor(Math.random() * unownedCores.length)]
                    : bossPool[Math.floor(Math.random() * bossPool.length)];
                
                if (typeof generateStoryGear === 'function') {
                    const generatedItem = await generateStoryGear(targetGearId);
                    if (generatedItem) {
                        // ⚡ 觸發全螢幕霓虹紫閃與實體震動
                        if (typeof triggerPurpleJackpotEffect === 'function') {
                            triggerPurpleJackpotEffect();
                        }
                        
                        lootLog.push(`<b style="color:#c355ff; font-size:1.1em; text-shadow: 0 0 8px rgba(195,85,255,0.8);">⚡ [極限剝離成功] 獲得專屬紫色核心：${generatedItem.name}！</b>`);
                        
                        // 重置 Soft Pity 保底
                        gameState.bossPity = 0;
                    }
                } else {
                    console.error(">> 系統錯誤：找不到 generateStoryGear 函數");
                }
            } else {
                // 未命中：靜默計數 +1 (+0.5% 累加至下次)
                gameState.bossPity = (gameState.bossPity || 0) + 1;
                const nextProbText = ((baseProb + gameState.bossPity * 0.005) * 100).toFixed(1);
                lootLog.push(`<span style="color:#888;">>> 核心未剝離，能量共振累積 +0.5% (下次概率增強至 ${nextProbText}%)</span>`);
            }
        }
    }

    // --- 🎁 2. 基礎掉落 (Boss 常規戰利品) ---
    if (typeof generateLoot === 'function') {
        await generateLoot(true); 
    }

    // --- 🖨️ 3. 將結算結果印出到死鬥終端機 ---
    appendOdysseyLog("<br>>> 正在掃描戰場殘骸...", '#ffaa00');
    
    if (lootLog.length > 0) {
        lootLog.forEach(log => appendOdysseyLog(log));
    } else {
        appendOdysseyLog("> 未發現核心專屬武裝，僅獲取常規戰利品。", '#aaa');
    }

    appendOdysseyLog(">> 戰利品已全數傳送至武裝庫 [04_INV]。", '#fff');
    if (typeof savePlayerState === 'function') savePlayerState();
}



// 5. 輔助函數：更新王關血條 UI
function updateOdysseyBossHpUI() {
    const boss = currentStoryContext.boss;
    let hp = Math.max(0, currentStoryContext.bossCurrentHp);
    
    document.getElementById('boss-battle-hp').innerText = hp;
    
    const hpBar = document.getElementById('boss-battle-hp-bar');
    if (hpBar) {
        let pct = Math.max(0, (hp / boss.hp) * 100);
        hpBar.style.width = pct + '%';
    }
}

// 6. 輔助函數：文字日誌印表機 (沉浸流無框版)
function appendOdysseyLog(msg, color = '#aaa') {
    const logEl = document.getElementById('odyssey-battle-log');
    if (logEl) {
        const p = document.createElement('div'); // 捨棄 <p> 以消除預設外距
        p.style.color = color;
        p.style.margin = "4px 0";
        p.style.textShadow = "1px 1px 2px #000"; // 增加無底色時的可讀性
        p.style.lineHeight = "1.3";
        p.innerHTML = msg; 
        logEl.appendChild(p);
        
        // 核心機制：限制畫面上最多只保留 8 行文字
        // 當新文字加入底部，舊文字就會被往上推，並被 CSS 遮罩淡出
        while (logEl.children.length > 8) {
            logEl.removeChild(logEl.firstChild);
        }
    }
}



// 🟢 當劇本與角色庫載入完畢後，發送回馬槍指令重新渲染頭像，解決時間差黑屏！
setTimeout(() => {
    if (typeof renderProfileAvatar === 'function') {
        renderProfileAvatar();
        console.log(">> [系統提示] WastelandDB 載入完畢，已重新同步識別證影像。");
    }
}, 500);



// 🚨 緊急撤退機能
function forceExitOdysseyBattle() {
    if (odysseyBattleTimer) clearInterval(odysseyBattleTimer);
    
    appendOdysseyLog(">> [緊急覆寫] 戰鬥連線強制中斷... 撤退！", '#ff5555');
    const exitBtn = document.getElementById('odyssey-emergency-exit');
    if (exitBtn) exitBtn.style.display = 'none'; // 點擊後立刻隱藏，避免連點
    
    // 延遲 0.8 秒後切換回主選單，讓玩家看得到撤退文字
    setTimeout(() => {
        switchOdysseyPhase('select');
        initOdysseySystem();
    }, 800);
}
