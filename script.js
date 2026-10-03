/* ==========================================================================
   SNAP DRAGON - UPGRADED ROGUELITE TOWER DEFENSE & ACTION ENGINE
   ========================================================================== */

// --- GLOBAL GAME CONFIG & STATE ---
const GameConfig = {
    difficulties: {
        easy: { speedMult: 0.75, hpMult: 0.75, dmgMult: 0.7, rewardMult: 1.0 },
        normal: { speedMult: 1.0, hpMult: 1.0, dmgMult: 1.0, rewardMult: 1.5 },
        hard: { speedMult: 1.3, hpMult: 1.3, dmgMult: 1.3, rewardMult: 2.0 },
        nightmare: { speedMult: 1.6, hpMult: 1.8, dmgMult: 1.6, rewardMult: 3.0 }
    },
    heroClasses: {
        archer: { name: "Archer", icon: "🏹", bonusCrit: 0.25, bonusDmg: 0.1, bonusGold: 0, bonusHp: 0 },
        mage: { name: "Mage", icon: "🧙", bonusCrit: 0, bonusDmg: 0.30, bonusHaste: 0.25, bonusGold: 0, bonusHp: 0 },
        warrior: { name: "Warrior", icon: "🛡️", bonusCrit: 0, bonusDmg: 0, bonusGold: 0, bonusHp: 50, armor: 0.2 },
        engineer: { name: "Engineer", icon: "⚙️", bonusCrit: 0, bonusDmg: 0.15, bonusGold: 0.40, bonusHp: 0 }
    },
    monsters: {
        1: { name: "Goblin", maxHp: 25, speed: 4.2, damage: 6, gold: 12, score: 15, class: "charactor1" },
        2: { name: "Orc", maxHp: 75, speed: 2.5, damage: 14, gold: 28, score: 30, class: "charactor2" },
        3: { name: "Specter", maxHp: 45, speed: 6.0, damage: 10, gold: 35, score: 40, class: "charactor3" },
        4: { name: "Gargoyle", maxHp: 140, speed: 3.2, damage: 22, gold: 55, score: 60, class: "charactor4" },
        5: { name: "Dragon Boss", maxHp: 450, speed: 1.6, damage: 45, gold: 180, score: 250, class: "charactor5", isBoss: true }
    },
    weapons: {
        arrow: { name: "Arrow", damage: 30, cd: 0, type: "single" },
        fireball: { name: "Fireball", damage: 85, cd: 2.5, type: "aoe", radius: 180 },
        lightning: { name: "Lightning", damage: 130, cd: 4.0, type: "chain", targets: 3 },
        ice: { name: "Ice Freeze", damage: 25, cd: 6.0, type: "freeze", duration: 4000 },
        meteor: { name: "Meteor Strike", damage: 280, cd: 10.0, type: "nuke" }
    },
    perksPool: [
        { id: "pyro", icon: "🔥", title: "Pyro Essence", desc: "+30% Spell Damage" },
        { id: "haste", icon: "⚡", title: "Time Warp", desc: "-25% Spell Cooldowns" },
        { id: "walls", icon: "❤️", title: "Stone Citadel", desc: "+60 Max Castle HP & Full Heal" },
        { id: "crit", icon: "🎯", title: "Deadly Focus", desc: "+20% Crit Chance & x3 Crit Damage" },
        { id: "gold", icon: "💰", title: "Greed Ring", desc: "+50% Gold from Slain Enemies" },
        { id: "frost", icon: "❄️", title: "Permafrost", desc: "Freeze Duration Increased by 50%" },
        { id: "armor", icon: "🛡️", title: "Iron Plating", desc: "Castle Takes 25% Less Damage" },
        { id: "overload", icon: "💥", title: "Boss Slayer", desc: "Spells Deal 2x Damage to Bosses" }
    ]
};

let GameState = {
    difficulty: "normal",
    realm: 1,
    heroClass: "archer",
    castleHp: 100,
    castleMaxHp: 100,
    gold: 0,
    score: 0,
    wave: 1,
    totalWaves: 20,
    enemiesRemainingInWave: 0,
    waveEnemiesToSpawn: [],
    combo: 0,
    maxCombo: 0,
    comboTimer: null,
    totalKills: 0,
    bossDefeated: false,
    selectedWeapon: "arrow",
    activePerks: [],
    currentEvent: null,
    isPaused: false,
    upgrades: {
        damageMult: 1.0,
        hasteMult: 1.0,
        critChance: 0.05,
        goldMult: 1.0,
        damageReduction: 0
    },
    cooldowns: {
        fireball: 0,
        lightning: 0,
        ice: 0,
        meteor: 0
    },
    isGameOver: false,
    isWin: false,
    activeMonsters: [],
    monsterIdCounter: 0
};

// Audio elements
const Sounds = {
    levelUp: new Audio("sounds/levelup.mp3"),
    die: new Audio("sounds/die.mp3"),
    main: new Audio("sounds/mainsound.mp3"),
    danger: new Audio("sounds/danger.wav"),
    click: new Audio("sounds/clicksound.wav"),
    monsterAttack: new Audio("sounds/Monster_Attack.wav")
};

let isAudioMuted = false;

// --- INITIALIZATION ---
function charactorCreateStart() {
    const savedName = localStorage.getItem("snapdragon_player_name") || "Hero";
    const savedDiff = localStorage.getItem("snapdragon_difficulty") || "normal";
    const savedRealm = parseInt(localStorage.getItem("snapdragon_realm") || "1");
    const savedClass = localStorage.getItem("snapdragon_class") || "archer";
    isAudioMuted = localStorage.getItem("snapdragon_muted") === "true";

    GameState.difficulty = savedDiff;
    GameState.realm = savedRealm;
    GameState.heroClass = savedClass;

    const playerBadge = document.getElementById("playerBadge");
    if (playerBadge) {
        playerBadge.innerText = `👤 ${savedName}`;
    }

    // Apply Hero Traits
    applyHeroClassTraits(savedClass);

    // Apply Realm Graphics & Castle Scaling
    applyRealmSettings(savedRealm);

    // Init FX Canvas
    initCanvasFX();

    // Keyboard Shortcuts [1, 2, 3, 4, 5, P, ESC, Space]
    window.addEventListener("keydown", handleKeyShortcuts);

    if (!isAudioMuted) {
        mainSound();
    }

    // Start Wave 1
    startWave(1);

    setInterval(updateCooldowns, 100);
    requestAnimationFrame(gameLoop);
}

function applyHeroClassTraits(cls) {
    const traits = GameConfig.heroClasses[cls] || GameConfig.heroClasses.archer;
    const heroBadge = document.getElementById("heroBadge");
    if (heroBadge) {
        heroBadge.innerText = `${traits.icon} ${traits.name}`;
    }

    if (traits.bonusCrit) GameState.upgrades.critChance += traits.bonusCrit;
    if (traits.bonusDmg) GameState.upgrades.damageMult += traits.bonusDmg;
    if (traits.bonusGold) GameState.upgrades.goldMult += traits.bonusGold;
    if (traits.bonusHaste) GameState.upgrades.hasteMult += traits.bonusHaste;
    if (traits.bonusHp) {
        GameState.castleMaxHp += traits.bonusHp;
        GameState.castleHp = GameState.castleMaxHp;
    }
    if (traits.armor) GameState.upgrades.damageReduction += traits.armor;
}

function applyRealmSettings(realmId) {
    const d3 = document.getElementById("d3");
    const d22 = document.getElementById("d22");
    d3.className = `game-arena background${realmId}`;
    d22.className = `d22 castle${realmId}`;
}

// --- PAUSE GAME SYSTEM ---
function togglePauseGame() {
    if (GameState.isGameOver || GameState.isWin) return;

    GameState.isPaused = !GameState.isPaused;
    const modal = document.getElementById("pauseModal");
    if (modal) {
        modal.classList.toggle("show", GameState.isPaused);
    }

    const pauseBtn = document.getElementById("pauseBtn");
    if (pauseBtn) {
        pauseBtn.innerHTML = GameState.isPaused ? "▶️ PLAY" : "⏸️ PAUSE";
    }
}

// --- ARENA CLICK & ARROW ATTACK ENGINE ---
function handleArenaClick(event) {
    if (GameState.isGameOver || GameState.isWin || GameState.isPaused) return;

    const clickX = event.clientX;
    const clickY = event.clientY;

    if (GameState.selectedWeapon === "arrow") {
        fireArrowAttack(clickX, clickY, null);
    }
}

function fireArrowAttack(clickX, clickY, directMonster = null) {
    if (GameState.isGameOver || GameState.isWin || GameState.isPaused) return;

    // Castle Turret Origin for arrows
    const startX = 220;
    const startY = window.innerHeight * 0.55;

    // Create Arrow Tracer FX & Impact Sparks
    createArrowTracerFX(startX, startY, clickX, clickY);

    Sounds.click.currentTime = 0;
    Sounds.click.play();

    let targetMonster = directMonster;
    if (!targetMonster && GameState.activeMonsters.length > 0) {
        let minDistance = Infinity;
        GameState.activeMonsters.forEach(m => {
            const dist = Math.hypot(m.x - clickX, m.y - clickY);
            if (dist < minDistance) {
                minDistance = dist;
                targetMonster = m;
            }
        });
    }

    if (targetMonster) {
        const weapon = GameConfig.weapons.arrow;
        damageMonster(targetMonster, calculateDamage(weapon.damage), false);
    }
}

// --- WAVE SYSTEM & RANDOM EVENTS ---
function startWave(waveNumber) {
    if (GameState.isGameOver || GameState.isWin) return;

    GameState.wave = waveNumber;
    updateHUD();

    const diff = GameConfig.difficulties[GameState.difficulty];
    const isBossWave = (waveNumber % 5 === 0);

    if (!isBossWave && waveNumber > 2 && Math.random() < 0.4) {
        triggerRandomWaveEvent();
    } else {
        document.getElementById("eventBanner").classList.add("hidden");
        GameState.currentEvent = null;
    }

    showWaveBanner(isBossWave ? `⚠️ BOSS WAVE ${waveNumber}` : `WAVE ${waveNumber}`, 
                   isBossWave ? "A Mighty Dragon Approaches!" : "Defend the Realm!");

    if (isBossWave) {
        document.getElementById("bossHpBanner").classList.remove("hidden");
    } else {
        document.getElementById("bossHpBanner").classList.add("hidden");
    }

    const spawnList = [];
    const baseCount = 5 + (waveNumber * 2);

    for (let i = 0; i < baseCount; i++) {
        let monsterType = 1;
        if (waveNumber >= 2 && Math.random() < 0.4) monsterType = 2;
        if (waveNumber >= 3 && Math.random() < 0.3) monsterType = 3;
        if (waveNumber >= 4 && Math.random() < 0.25) monsterType = 4;
        spawnList.push(monsterType);
    }

    if (isBossWave) {
        spawnList.push(5);
    }

    GameState.waveEnemiesToSpawn = spawnList;
    GameState.enemiesRemainingInWave = spawnList.length;
    updateHUD();

    let spawnInterval = setInterval(() => {
        if (GameState.isGameOver || GameState.isWin || GameState.isPaused) {
            if (GameState.isGameOver || GameState.isWin) clearInterval(spawnInterval);
            return;
        }

        if (GameState.waveEnemiesToSpawn.length > 0) {
            const nextMonsterType = GameState.waveEnemiesToSpawn.shift();
            spawnMonster(nextMonsterType);
        } else {
            clearInterval(spawnInterval);
        }
    }, Math.max(700, 2000 - (waveNumber * 65)));
}

function triggerRandomWaveEvent() {
    const events = [
        { id: "meteor", title: "☄️ METEOR SHOWER", sub: "Periodic Meteors Striking Field!" },
        { id: "frenzy", title: "🩸 MONSTER FRENZY", sub: "Fast Enemies Yield 2x Gold!" },
        { id: "double", title: "🪙 DOUBLE GOLD", sub: "All Kills Yield 2x Gold Rewards!" },
        { id: "blessing", title: "🛠️ CASTLE REPAIR", sub: "Castle Continuously Regenerating HP!" }
    ];

    const chosen = events[Math.floor(Math.random() * events.length)];
    GameState.currentEvent = chosen.id;

    const banner = document.getElementById("eventBanner");
    document.getElementById("eventBannerTitle").innerText = chosen.title;
    document.getElementById("eventBannerSub").innerText = chosen.sub;
    banner.classList.remove("hidden");
}

function showWaveBanner(title, sub) {
    const banner = document.getElementById("waveBanner");
    document.getElementById("waveBannerText").innerText = title;
    document.getElementById("waveBannerSub").innerText = sub;
    banner.classList.remove("hidden");

    setTimeout(() => {
        banner.classList.add("hidden");
    }, 2500);
}

// --- MONSTER CREATION & MANAGING ---
function spawnMonster(type) {
    const d10 = document.getElementById("d10");
    if (!d10) return;

    const baseStats = GameConfig.monsters[type];
    const diff = GameConfig.difficulties[GameState.difficulty];

    let speedMult = diff.speedMult;
    let goldMult = diff.rewardMult * GameState.upgrades.goldMult;

    if (GameState.currentEvent === "frenzy") {
        speedMult *= 1.35;
        goldMult *= 2.0;
    } else if (GameState.currentEvent === "double") {
        goldMult *= 2.0;
    }

    const maxHp = Math.round(baseStats.maxHp * diff.hpMult * (1 + (GameState.wave * 0.1)));
    const speed = baseStats.speed * speedMult;
    const damage = Math.round(baseStats.damage * diff.dmgMult);

    const monsterId = "monster_" + (GameState.monsterIdCounter++);

    const el = document.createElement("div");
    el.className = `monster-card ${baseStats.class}`;
    el.id = monsterId;

    const spawnY = Math.floor(Math.random() * 55) + 12;
    el.style.top = spawnY + "vh";
    el.style.left = "92vw";

    const hpBar = document.createElement("div");
    hpBar.className = "monster-hp-bar";
    const hpInner = document.createElement("div");
    hpInner.className = "monster-hp-inner";
    hpBar.appendChild(hpInner);
    el.appendChild(hpBar);

    d10.appendChild(el);

    const monsterObj = {
        id: monsterId,
        type: type,
        name: baseStats.name,
        el: el,
        hpInner: hpInner,
        hp: maxHp,
        maxHp: maxHp,
        speed: speed,
        damage: damage,
        gold: Math.round(baseStats.gold * goldMult),
        score: Math.round(baseStats.score * diff.rewardMult),
        isBoss: baseStats.isBoss || false,
        isFrozen: false,
        x: window.innerWidth * 0.92,
        y: (window.innerHeight * spawnY) / 100
    };

    el.onclick = (e) => {
        e.stopPropagation();
        handleMonsterClick(monsterObj, e);
    };

    GameState.activeMonsters.push(monsterObj);

    if (monsterObj.isBoss) {
        updateBossHpBanner(monsterObj);
    }
}

// --- MAIN GAME LOOP (MOVEMENT, EVENT EFFECTS & COLLISION) ---
let lastTime = performance.now();
let eventTickCounter = 0;

function gameLoop(now) {
    const delta = (now - lastTime) / 1000;
    lastTime = now;

    if (!GameState.isGameOver && !GameState.isWin && !GameState.isPaused) {
        const castleX = 300; // Updated for larger castle width

        for (let i = GameState.activeMonsters.length - 1; i >= 0; i--) {
            const m = GameState.activeMonsters[i];

            if (m.isFrozen) continue;

            m.x -= m.speed * 60 * delta;
            m.el.style.left = m.x + "px";

            if (m.x <= castleX) {
                takeCastleDamage(m.damage);
                removeMonster(m, false);
                Sounds.monsterAttack.play();
            }
        }

        eventTickCounter++;
        if (eventTickCounter % 180 === 0) {
            if (GameState.currentEvent === "meteor") {
                createExplosionFX(Math.random() * window.innerWidth * 0.7 + 200, Math.random() * window.innerHeight, 100);
            } else if (GameState.currentEvent === "blessing" && GameState.castleHp < GameState.castleMaxHp) {
                GameState.castleHp = Math.min(GameState.castleMaxHp, GameState.castleHp + 5);
                updateHUD();
            }
        }

        renderCanvasFX();
    }

    requestAnimationFrame(gameLoop);
}

// --- ATTACK & DAMAGE HANDLING ---
function handleMonsterClick(monster, e = null) {
    if (GameState.isGameOver || GameState.isWin || GameState.isPaused) return;

    if (GameState.selectedWeapon === "arrow") {
        const clickX = e ? e.clientX : monster.x;
        const clickY = e ? e.clientY : monster.y;
        fireArrowAttack(clickX, clickY, monster);
    } else {
        const weapon = GameConfig.weapons[GameState.selectedWeapon];
        damageMonster(monster, calculateDamage(weapon.damage), true);
    }
}

function calculateDamage(baseDmg) {
    let dmg = baseDmg * GameState.upgrades.damageMult;
    const isCrit = Math.random() < GameState.upgrades.critChance;
    if (isCrit) {
        dmg *= (GameState.activePerks.includes("crit") ? 3.0 : 2.0);
    }
    return { damage: Math.round(dmg), isCrit: isCrit };
}

function damageMonster(monster, dmgResult, playSound = true) {
    let finalDmg = dmgResult.damage;
    if (monster.isBoss && GameState.activePerks.includes("overload")) {
        finalDmg *= 2.0;
    }

    monster.hp -= finalDmg;

    showFloatingText(`-${finalDmg}`, monster.x, monster.y, dmgResult.isCrit ? "crit" : "damage");

    if (playSound) {
        Sounds.click.currentTime = 0;
        Sounds.click.play();
    }

    const hpPct = Math.max(0, (monster.hp / monster.maxHp) * 100);
    monster.hpInner.style.width = hpPct + "%";

    if (monster.isBoss) {
        updateBossHpBanner(monster);
    }

    if (monster.hp <= 0) {
        onMonsterKilled(monster);
    }
}

function onMonsterKilled(monster) {
    const comboMult = 1 + Math.floor(GameState.combo / 5) * 0.5;
    const earnedGold = Math.round(monster.gold * comboMult);
    const earnedScore = Math.round(monster.score * comboMult);

    GameState.gold += earnedGold;
    GameState.score += earnedScore;
    GameState.totalKills++;

    showFloatingText(`+${earnedGold} Gold`, monster.x, monster.y - 20, "gold");

    Sounds.die.currentTime = 0;
    Sounds.die.play();

    incrementCombo();
    checkAchievements();

    if (monster.isBoss) {
        GameState.bossDefeated = true;
        document.getElementById("bossHpBanner").classList.add("hidden");
    }

    removeMonster(monster, true);
}

function removeMonster(monster, isKilled) {
    if (monster.el && monster.el.parentNode) {
        monster.el.parentNode.removeChild(monster.el);
    }

    const index = GameState.activeMonsters.indexOf(monster);
    if (index !== -1) {
        GameState.activeMonsters.splice(index, 1);
    }

    GameState.enemiesRemainingInWave--;
    updateHUD();

    if (GameState.enemiesRemainingInWave <= 0 && GameState.waveEnemiesToSpawn.length === 0) {
        onWaveCompleted();
    }
}

function incrementCombo() {
    GameState.combo++;
    if (GameState.combo > GameState.maxCombo) {
        GameState.maxCombo = GameState.combo;
    }

    if (GameState.comboTimer) clearTimeout(GameState.comboTimer);
    GameState.comboTimer = setTimeout(() => {
        GameState.combo = 0;
        updateHUD();
    }, 2500);

    updateHUD();
}

function onWaveCompleted() {
    Sounds.levelUp.play();

    if (GameState.wave >= GameState.totalWaves) {
        triggerVictory();
    } else {
        if (GameState.wave % 3 === 0) {
            setTimeout(triggerPerkSelectionModal, 1200);
        } else {
            setTimeout(() => {
                startWave(GameState.wave + 1);
            }, 3000);
        }
    }
}

// --- ROGUELITE 3-CARD PERK SYSTEM ---
function triggerPerkSelectionModal() {
    const modal = document.getElementById("perkModal");
    const grid = document.getElementById("perkCardsGrid");
    if (!modal || !grid) return;

    const shuffled = GameConfig.perksPool.slice().sort(() => 0.5 - Math.random());
    const selected3 = shuffled.slice(0, 3);

    grid.innerHTML = selected3.map(p => `
        <div class="perk-card-choice" onclick="selectPerkCard('${p.id}')">
            <div class="perk-card-icon">${p.icon}</div>
            <div class="perk-card-title">${p.title}</div>
            <div class="perk-card-desc">${p.desc}</div>
        </div>
    `).join("");

    modal.classList.add("show");
}

function selectPerkCard(perkId) {
    GameState.activePerks.push(perkId);

    if (perkId === "pyro") GameState.upgrades.damageMult += 0.30;
    if (perkId === "haste") GameState.upgrades.hasteMult += 0.25;
    if (perkId === "walls") {
        GameState.castleMaxHp += 60;
        GameState.castleHp = GameState.castleMaxHp;
    }
    if (perkId === "crit") GameState.upgrades.critChance += 0.20;
    if (perkId === "gold") GameState.upgrades.goldMult += 0.50;
    if (perkId === "armor") GameState.upgrades.damageReduction += 0.25;

    document.getElementById("perkModal").classList.remove("show");
    updateHUD();

    startWave(GameState.wave + 1);
}

// --- CASTLE DAMAGE & GAME OVER ---
function takeCastleDamage(amount) {
    if (GameState.isGameOver || GameState.isWin) return;

    const actualDmg = Math.round(amount * (1 - GameState.upgrades.damageReduction));
    GameState.castleHp = Math.max(0, GameState.castleHp - actualDmg);
    updateHUD();

    Sounds.danger.play();
    shakeScreen(5);

    const d22 = document.getElementById("d22");
    d22.className = `d22 danger${GameState.realm}`;
    setTimeout(() => {
        if (!GameState.isGameOver) {
            d22.className = `d22 castle${GameState.realm}`;
        }
    }, 1200);

    if (GameState.castleHp <= 0) {
        triggerGameOver();
    }
}

function triggerGameOver() {
    GameState.isGameOver = true;
    saveHighScore();

    const d3 = document.getElementById("d3");
    const d10 = document.getElementById("d10");
    const d22 = document.getElementById("d22");
    const cancelModal = document.getElementById("d11");

    d3.className = "game-arena gameover";
    d10.style.display = "none";
    d22.style.display = "none";
    cancelModal.style.visibility = "visible";

    const playerName = localStorage.getItem("snapdragon_player_name") || "Hero";

    document.getElementById("gameOverStats").innerHTML = `
        <div>👤 Player: <strong>${playerName}</strong></div>
        <div>⚔️ Waves Survived: <strong>${GameState.wave} / ${GameState.totalWaves}</strong></div>
        <div>👹 Enemies Slain: <strong>${GameState.totalKills}</strong></div>
        <div>💰 Total Gold Earned: <strong>${GameState.gold}</strong></div>
        <div>🔥 Highest Combo: <strong>${GameState.maxCombo}x</strong></div>
        <div>🎯 Final Score: <strong>${GameState.score}</strong></div>
    `;
}

function triggerVictory() {
    GameState.isWin = true;
    saveHighScore();

    const d3 = document.getElementById("d3");
    const d10 = document.getElementById("d10");
    const d22 = document.getElementById("d22");
    const winModal = document.getElementById("d14");

    d3.className = "game-arena win";
    d10.style.display = "none";
    d22.style.display = "none";
    winModal.style.visibility = "visible";

    const playerName = localStorage.getItem("snapdragon_player_name") || "Hero";

    document.getElementById("victoryStats").innerHTML = `
        <div>🏆 VICTORY FOR <strong>${playerName.toUpperCase()}</strong>!</div>
        <div>🏆 ALL ${GameState.totalWaves} WAVES CLEARED!</div>
        <div>🏰 Castle Remaining HP: <strong>${GameState.castleHp} / ${GameState.castleMaxHp}</strong></div>
        <div>👹 Total Monsters Slain: <strong>${GameState.totalKills}</strong></div>
        <div>🔥 Max Combo: <strong>${GameState.maxCombo}x</strong></div>
        <div>⭐ Final Score: <strong>${GameState.score}</strong></div>
    `;

    unlockAchievement("perfect_defense");
}

// --- MULTIPLAYER CLOUD LEADERBOARD ENGINE ---
const LEADERBOARD_API_URL = "https://api.restful-api.dev/objects/ff808181a09d98f701a0ffffe42567f3";
const LEADERBOARD_STORAGE_KEY = "snapdragon_high_scores";

// Seed default player scores (including prakash and gowri from multiplayer sessions)
const DEFAULT_SCORES = [
    {
        playerName: "prakash",
        score: 2887,
        wave: 6,
        kills: 42,
        heroClass: "engineer",
        difficulty: "normal",
        date: "10/3/2026"
    },
    {
        playerName: "gowri",
        score: 1561,
        wave: 5,
        kills: 28,
        heroClass: "engineer",
        difficulty: "normal",
        date: "10/3/2026"
    }
];

// BroadcastChannel & Storage Event listener for real-time cross-tab sync
let leaderboardChannel = null;
try {
    if (typeof BroadcastChannel !== 'undefined') {
        leaderboardChannel = new BroadcastChannel('snapdragon_leaderboard_channel');
        leaderboardChannel.onmessage = (event) => {
            if (event.data === 'update') {
                renderLeaderboardUI();
            }
        };
    }
} catch (e) {
    console.warn("BroadcastChannel not supported", e);
}

window.addEventListener('storage', (e) => {
    if (e.key === LEADERBOARD_STORAGE_KEY) {
        renderLeaderboardUI();
    }
});

function getLocalScores() {
    let scores = [];
    try {
        const stored = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
        if (stored) {
            scores = JSON.parse(stored);
        }
    } catch (e) {
        console.error("Failed to parse local scores", e);
    }
    
    if (!Array.isArray(scores) || scores.length === 0) {
        scores = [...DEFAULT_SCORES];
        localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(scores));
    }
    return scores;
}

function mergeScores(localList, remoteList) {
    const combined = [...(localList || []), ...(remoteList || [])];
    const map = new Map();

    combined.forEach(item => {
        if (!item || !item.playerName || typeof item.score !== 'number') return;
        
        const key = item.playerName.trim().toLowerCase();
        const existing = map.get(key);

        if (!existing || item.score > existing.score) {
            map.set(key, {
                playerName: item.playerName.trim(),
                score: item.score,
                wave: item.wave || 1,
                kills: item.kills || 0,
                heroClass: item.heroClass || "archer",
                difficulty: item.difficulty || "normal",
                date: item.date || new Date().toLocaleDateString()
            });
        }
    });

    const result = Array.from(map.values());
    result.sort((a, b) => b.score - a.score);
    return result.slice(0, 15);
}

async function syncLeaderboardOnline(scores) {
    try {
        await fetch(LEADERBOARD_API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'SnapDragon Leaderboard',
                data: { scores: scores }
            })
        });
    } catch (err) {
        console.warn("Could not sync online scores:", err);
    }
}

async function fetchOnlineLeaderboard() {
    const statusEl = document.getElementById("leaderboardSyncStatus");
    if (statusEl) statusEl.innerText = "🔄 Syncing...";

    let localScores = getLocalScores();

    try {
        const response = await fetch(LEADERBOARD_API_URL, { cache: 'no-cache' });
        if (response.ok) {
            const json = await response.json();
            const remoteScores = (json && json.data && Array.isArray(json.data.scores)) ? json.data.scores : [];
            const merged = mergeScores(localScores, remoteScores);
            
            localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(merged));
            
            if (merged.length !== remoteScores.length) {
                syncLeaderboardOnline(merged);
            }

            if (statusEl) statusEl.innerText = "🌐 Online Synced";
            renderLeaderboardUI();
            return merged;
        }
    } catch (err) {
        console.warn("Fetch online scores failed, using cached scores", err);
    }

    if (statusEl) statusEl.innerText = "💾 Local Cached";
    renderLeaderboardUI();
    return localScores;
}

function saveHighScore() {
    const playerName = (localStorage.getItem("snapdragon_player_name") || "Hero").trim();
    if (!playerName || GameState.score <= 0) return;

    let localScores = getLocalScores();
    const newEntry = {
        playerName: playerName,
        score: GameState.score,
        wave: GameState.wave,
        kills: GameState.totalKills,
        heroClass: GameState.heroClass,
        difficulty: GameState.difficulty,
        date: new Date().toLocaleDateString()
    };

    const merged = mergeScores(localScores, [newEntry]);
    localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(merged));

    if (leaderboardChannel) {
        leaderboardChannel.postMessage('update');
    }

    syncLeaderboardOnline(merged);
}

function openLeaderboardModal() {
    const modal = document.getElementById('leaderboardModal');
    if (!modal) return;
    modal.classList.add('show');

    renderLeaderboardUI();
    fetchOnlineLeaderboard();
}

function closeLeaderboardModal() {
    const modal = document.getElementById('leaderboardModal');
    if (modal) modal.classList.remove('show');
}

function refreshLeaderboardOnline() {
    const statusEl = document.getElementById("leaderboardSyncStatus");
    if (statusEl) statusEl.innerText = "🔄 Syncing...";
    fetchOnlineLeaderboard();
}

function renderLeaderboardUI() {
    const list = document.getElementById('leaderboardList');
    if (!list) return;

    const savedScores = getLocalScores();
    const currentPlayer = (localStorage.getItem('snapdragon_player_name') || '').trim().toLowerCase();

    if (savedScores.length === 0) {
        list.innerHTML = `
            <div style="text-align:center; padding: 35px 20px; color:#94a3b8;">
                <div style="font-size: 36px; margin-bottom: 10px;">🎮</div>
                <div style="font-size: 16px; font-weight: 800; color: #f1f5f9;">No Real Game Records Yet!</div>
                <div style="font-size: 13px; margin-top: 6px; color: #94a3b8;">Enter your name and play a game to set the first score on the leaderboard!</div>
            </div>
        `;
    } else {
        list.innerHTML = savedScores.map((s, idx) => {
            const isCurrent = currentPlayer && (s.playerName && s.playerName.trim().toLowerCase() === currentPlayer);
            
            let rankBadge = `#${idx + 1}`;
            if (idx === 0) rankBadge = "🥇 #1";
            else if (idx === 1) rankBadge = "🥈 #2";
            else if (idx === 2) rankBadge = "🥉 #3";

            return `
                <div class="leaderboard-item ${isCurrent ? 'current-user-item' : ''}">
                    <div class="leaderboard-rank">${rankBadge}</div>
                    <div class="leaderboard-details">
                        <div class="leaderboard-title">👤 ${s.playerName || 'Hero'} ${isCurrent ? '<span class="you-tag">(YOU)</span>' : ''}</div>
                        <div class="leaderboard-sub">${(s.heroClass || 'Archer').toUpperCase()} • Wave ${s.wave || 1} (${(s.difficulty || 'Normal').toUpperCase()}) • ${s.date || 'Today'}</div>
                    </div>
                    <div class="leaderboard-score">⭐ ${s.score}</div>
                </div>
            `;
        }).join('');
    }
}

// --- AUTOMATIC REGULAR LEADERBOARD POLLING & SYNC ENGINE ---
let leaderboardPollInterval = null;

function startLeaderboardAutoSync() {
    // 1. Initial fetch & sync on page load / gamer entry
    fetchOnlineLeaderboard();

    // 2. Regularly poll every 10 seconds to auto-update scores across all active gamers
    if (!leaderboardPollInterval) {
        leaderboardPollInterval = setInterval(() => {
            fetchOnlineLeaderboard();
        }, 10000);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startLeaderboardAutoSync);
} else {
    startLeaderboardAutoSync();
}

// --- WEAPONS & SPELL ENGINE ---
function selectWeapon(weaponId) {
    GameState.selectedWeapon = weaponId;
    document.querySelectorAll(".spell-card").forEach(card => {
        card.classList.toggle("active", card.dataset.weapon === weaponId);
    });
}

function castSpell(spellId) {
    selectWeapon(spellId);

    const weapon = GameConfig.weapons[spellId];
    if (!weapon || weapon.type === "single") return;

    if (GameState.cooldowns[spellId] > 0) return;

    const cdDuration = weapon.cd / GameState.upgrades.hasteMult;
    GameState.cooldowns[spellId] = cdDuration;

    const dmgRes = calculateDamage(weapon.damage);

    if (spellId === "fireball") {
        if (GameState.activeMonsters.length > 0) {
            const target = GameState.activeMonsters[0];
            createExplosionFX(target.x, target.y, weapon.radius);
            shakeScreen(4);

            GameState.activeMonsters.slice().forEach(m => {
                const dist = Math.hypot(m.x - target.x, m.y - target.y);
                if (dist <= weapon.radius) {
                    damageMonster(m, dmgRes, false);
                }
            });
        }
    } else if (spellId === "lightning") {
        const targets = GameState.activeMonsters.slice(0, weapon.targets);
        if (targets.length > 0) {
            createLightningFX(targets);
            shakeScreen(3);
            targets.forEach(m => damageMonster(m, dmgRes, false));
        }
    } else if (spellId === "ice") {
        createIceFreezeFX();
        const duration = weapon.duration * (GameState.activePerks.includes("frost") ? 1.5 : 1.0);
        GameState.activeMonsters.forEach(m => {
            m.isFrozen = true;
            m.el.classList.add("frozen");
            damageMonster(m, dmgRes, false);

            setTimeout(() => {
                m.isFrozen = false;
                if (m.el) m.el.classList.remove("frozen");
            }, duration);
        });
    } else if (spellId === "meteor") {
        createMeteorFX();
        shakeScreen(10);
        GameState.activeMonsters.slice().forEach(m => {
            damageMonster(m, dmgRes, false);
        });
    }

    unlockAchievement("spellslinger");
}

function updateCooldowns() {
    if (GameState.isPaused) return;

    const keys = Object.keys(GameState.cooldowns);
    keys.forEach(k => {
        if (GameState.cooldowns[k] > 0) {
            GameState.cooldowns[k] = Math.max(0, GameState.cooldowns[k] - 0.1);
            const overlay = document.getElementById(`cd_${k}`);
            if (overlay) {
                if (GameState.cooldowns[k] > 0) {
                    overlay.classList.add("active");
                    overlay.innerText = GameState.cooldowns[k].toFixed(1) + "s";
                } else {
                    overlay.classList.remove("active");
                    overlay.innerText = "";
                }
            }
        }
    });
}

function handleKeyShortcuts(e) {
    if (e.key === "1") selectWeapon("arrow");
    if (e.key === "2") castSpell("fireball");
    if (e.key === "3") castSpell("lightning");
    if (e.key === "4") castSpell("ice");
    if (e.key === "5") castSpell("meteor");
    if (e.key.toLowerCase() === "p" || e.key === "Escape" || e.key === " ") togglePauseGame();
}

function shakeScreen(intensity) {
    const wrapper = document.getElementById("gameWrapper");
    if (!wrapper) return;
    wrapper.classList.add("screen-shake");
    setTimeout(() => {
        wrapper.classList.remove("screen-shake");
    }, 350);
}

// --- CANVAS FX ENGINE ---
let canvas, ctx, particles = [];

function initCanvasFX() {
    canvas = document.getElementById("fxCanvas");
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx = canvas.getContext("2d");

    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

function createArrowTracerFX(startX, startY, endX, endY) {
    particles.push({
        type: "arrow",
        x1: startX, y1: startY,
        x2: endX, y2: endY,
        life: 1.0
    });

    for (let i = 0; i < 8; i++) {
        particles.push({
            x: endX, y: endY,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            color: Math.random() < 0.5 ? "#ffd700" : "#ff5500",
            size: Math.random() * 4 + 2,
            life: 1.0
        });
    }
}

function createExplosionFX(x, y, radius) {
    for (let i = 0; i < 40; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12,
            color: Math.random() < 0.5 ? "#ff5500" : "#ffd700",
            size: Math.random() * 8 + 4,
            life: 1.0
        });
    }
}

function createLightningFX(targets) {
    if (targets.length < 1) return;
    for (let i = 0; i < targets.length - 1; i++) {
        const p1 = targets[i];
        const p2 = targets[i + 1];
        particles.push({
            type: "lightning",
            x1: p1.x, y1: p1.y,
            x2: p2.x, y2: p2.y,
            life: 1.0
        });
    }
}

function createIceFreezeFX() {
    for (let i = 0; i < 60; i++) {
        particles.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: 0, vy: -2,
            color: "#3afff5",
            size: Math.random() * 6 + 2,
            life: 1.0
        });
    }
}

function createMeteorFX() {
    for (let i = 0; i < 100; i++) {
        particles.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 20,
            vy: Math.random() * 20 + 5,
            color: "#ff2200",
            size: Math.random() * 12 + 6,
            life: 1.0
        });
    }
}

function renderCanvasFX() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= 0.04;

        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }

        if (p.type === "arrow") {
            ctx.strokeStyle = `rgba(255, 215, 0, ${p.life})`;
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(p.x1, p.y1);
            ctx.lineTo(p.x2, p.y2);
            ctx.stroke();

            // Arrowhead at target
            const angle = Math.atan2(p.y2 - p.y1, p.x2 - p.x1);
            const headLen = 14;
            ctx.fillStyle = `rgba(255, 230, 120, ${p.life})`;
            ctx.beginPath();
            ctx.moveTo(p.x2, p.y2);
            ctx.lineTo(p.x2 - headLen * Math.cos(angle - Math.PI / 6), p.y2 - headLen * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(p.x2 - headLen * Math.cos(angle + Math.PI / 6), p.y2 - headLen * Math.sin(angle + Math.PI / 6));
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
        } else if (p.type === "lightning") {
            ctx.strokeStyle = `rgba(58, 255, 245, ${p.life})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(p.x1, p.y1);
            ctx.lineTo(p.x2, p.y2);
            ctx.stroke();
        } else {
            p.x += p.vx || 0;
            p.y += p.vy || 0;
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }
}

// --- FLOATING TEXT ---
function showFloatingText(text, x, y, type) {
    const el = document.createElement("div");
    el.className = `floating-num ${type}`;
    el.innerText = text;
    el.style.left = x + "px";
    el.style.top = y + "px";
    document.getElementById("d3").appendChild(el);

    setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
    }, 850);
}

// --- HUD & UPGRADE SHOP ---
function updateHUD() {
    const hpPct = Math.max(0, (GameState.castleHp / GameState.castleMaxHp) * 100);
    const hpFill = document.getElementById("castleHpFill");
    const hpText = document.getElementById("castleHpText");

    if (hpFill && hpText) {
        hpFill.style.width = hpPct + "%";
        hpText.innerText = `${GameState.castleHp} / ${GameState.castleMaxHp}`;

        hpFill.className = "hp-bar-fill";
        if (hpPct <= 30) hpFill.classList.add("danger");
        else if (hpPct <= 60) hpFill.classList.add("warning");
    }

    const d8 = document.getElementById("d8");
    const d9 = document.getElementById("d9");
    const goldVal = document.getElementById("goldVal");
    const enemiesVal = document.getElementById("enemiesLeftVal");
    const comboBadge = document.getElementById("comboBadge");

    if (d8) d8.innerText = GameState.score;
    if (d9) d9.innerHTML = `${GameState.wave} <span class="wave-max">/ ${GameState.totalWaves}</span>`;
    if (goldVal) goldVal.innerText = `💰 ${GameState.gold}`;
    if (enemiesVal) enemiesVal.innerText = GameState.enemiesRemainingInWave;
    if (comboBadge) comboBadge.innerText = `🔥 ${GameState.combo} COMBO`;
}

function updateBossHpBanner(bossObj) {
    const banner = document.getElementById("bossHpBanner");
    const fill = document.getElementById("bossHpFill");
    const text = document.getElementById("bossHpText");

    if (banner && fill && text) {
        banner.classList.remove("hidden");
        const pct = Math.max(0, (bossObj.hp / bossObj.maxHp) * 100);
        fill.style.width = pct + "%";
        text.innerText = `${bossObj.hp} / ${bossObj.maxHp}`;
    }
}

// --- SHOP MODAL LOGIC ---
function openShopModal() {
    const modal = document.getElementById("shopModal");
    if (!modal) return;
    document.getElementById("shopGoldText").innerText = `💰 ${GameState.gold}`;
    modal.classList.add("show");
    updateShopButtons();
}

function closeShopModal() {
    const modal = document.getElementById("shopModal");
    if (modal) modal.classList.remove("show");
}

function updateShopButtons() {
    const btnRepair = document.getElementById("btnRepair");
    const btnMaxHp = document.getElementById("btnMaxHp");
    const btnDamage = document.getElementById("btnDamage");
    const btnHaste = document.getElementById("btnHaste");
    const btnCrit = document.getElementById("btnCrit");

    if (btnRepair) btnRepair.classList.toggle("disabled", GameState.gold < 50 || GameState.castleHp >= GameState.castleMaxHp);
    if (btnMaxHp) btnMaxHp.classList.toggle("disabled", GameState.gold < 100);
    if (btnDamage) btnDamage.classList.toggle("disabled", GameState.gold < 120);
    if (btnHaste) btnHaste.classList.toggle("disabled", GameState.gold < 150);
    if (btnCrit) btnCrit.classList.toggle("disabled", GameState.gold < 200);
}

function buyUpgrade(type) {
    if (type === "repair" && GameState.gold >= 50 && GameState.castleHp < GameState.castleMaxHp) {
        GameState.gold -= 50;
        GameState.castleHp = Math.min(GameState.castleMaxHp, GameState.castleHp + 30);
    } else if (type === "maxHp" && GameState.gold >= 100) {
        GameState.gold -= 100;
        GameState.castleMaxHp += 40;
        GameState.castleHp += 40;
    } else if (type === "damage" && GameState.gold >= 120) {
        GameState.gold -= 120;
        GameState.upgrades.damageMult += 0.25;
    } else if (type === "haste" && GameState.gold >= 150) {
        GameState.gold -= 150;
        GameState.upgrades.hasteMult += 0.15;
    } else if (type === "crit" && GameState.gold >= 200) {
        GameState.gold -= 200;
        GameState.upgrades.critChance += 0.15;
    }

    updateHUD();
    document.getElementById("shopGoldText").innerText = `💰 ${GameState.gold}`;
    updateShopButtons();
}

// --- ACHIEVEMENTS TRACKER ---
function unlockAchievement(id) {
    let unlocked = JSON.parse(localStorage.getItem("snapdragon_unlocked_achievements") || "[]");
    if (!unlocked.includes(id)) {
        unlocked.push(id);
        localStorage.setItem("snapdragon_unlocked_achievements", JSON.stringify(unlocked));
    }
}

function checkAchievements() {
    if (GameState.totalKills >= 1) unlockAchievement("first_blood");
    if (GameState.totalKills >= 100) unlockAchievement("monster_slayer");
    if (GameState.maxCombo >= 15) unlockAchievement("combo_master");
    if (GameState.bossDefeated) unlockAchievement("dragon_slayer");
}

// --- AUDIO HELPERS ---
function toggleAudio() {
    isAudioMuted = !isAudioMuted;
    localStorage.setItem("snapdragon_muted", isAudioMuted);
    if (isAudioMuted) {
        Sounds.main.pause();
    } else {
        mainSound();
    }
}

function playBtnMusic() {
    if (!isAudioMuted) {
        Sounds.click.currentTime = 0;
        Sounds.click.play();
    }
}

function clickSound() {
    playBtnMusic();
}

function mainSound() {
    if (isAudioMuted) return;
    Sounds.main.play();
    Sounds.main.volume = 0.4;
    Sounds.main.loop = true;
}

function playBtn() { window.location = "home.html"; }
function menuBtn() { window.location = "home.html"; }
function closeBtn() {
    if (GameState.score > 0 && !GameState.isGameOver && !GameState.isWin) {
        saveHighScore();
    }
    window.location = "index.html";
}