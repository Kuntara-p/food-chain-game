// --- Premium V.9 Additions ---

// 1. TTS System
function playTTSChime() {
    try {
        if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    } catch(e) {}
}

function speakTTS(text) {
    playTTSChime();
    setTimeout(() => {
        try {
            // Use Google Translate TTS as it guarantees a Thai voice on any device
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=th&q=${encodeURIComponent(text)}`;
            const audio = new Audio(url);
            audio.play().catch(err => {
                // Fallback to local OS TTS if Google API fails (e.g., offline)
                if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.lang = 'th-TH';
                    const voices = window.speechSynthesis.getVoices();
                    const thaiVoice = voices.find(v => v.lang.includes('th') || v.name.includes('Thai'));
                    if (thaiVoice) utterance.voice = thaiVoice;
                    window.speechSynthesis.speak(utterance);
                }
            });
        } catch(e) {}
    }, 300); // Wait 300ms for the chime to play first
}

// 2. Particle System
function createParticles(x, y) {
    for (let i = 0; i < 15; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const colors = ['#ffca28', '#ff7043', '#4caf50', '#2196f3', '#9c27b0'];
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = 50 + Math.random() * 50;
        const dx = Math.cos(angle) * velocity;
        const dy = Math.sin(angle) * velocity;
        
        p.style.setProperty('--dx', `${dx}px`);
        p.style.setProperty('--dy', `${dy}px`);
        
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 800);
    }
}

// 3. Encyclopedia System
let unlockedAnimals = new Set(JSON.parse(localStorage.getItem('foodChainUnlocked') || '[]'));
const animalFacts = {
    'carrot': 'แครอทอุดมไปด้วยวิตามินเอ ช่วยบำรุงสายตา!',
    'rabbit': 'น้องกระต่ายเป็นผู้บริโภคอันดับ 1 ที่น่ารักและวิ่งเร็ว',
    'fox': 'สุนัขจิ้งจอกหูไวตาไว เป็นนักล่าที่ฉลาดมาก',
    'grass': 'หญ้าสร้างอาหารเองได้จากแสงแดด เป็นผู้ผลิตที่สำคัญ',
    'grasshopper': 'ตั๊กแตนกระโดดได้ไกลมาก ชอบกินใบพืชเป็นอาหาร',
    'frog': 'น้องกบชอบใช้ลิ้นยาวๆ ตวัดจับแมลงกิน',
    'stork': 'นกกระสาขายาว ชอบเดินลุยน้ำตื้นหาปลาและกบกิน',
    'seaweed': 'สาหร่ายทะเลเป็นผู้ผลิตในน้ำที่มีประโยชน์มากมาย',
    'shrimp': 'กุ้งตัวเล็กๆ เป็นอาหารจานโปรดของสัตว์ทะเลหลายชนิด',
    'octopus': 'หมึกพ่นน้ำหมึกหนีศัตรูได้ และฉลาดสุดๆ',
    'shark': 'ฉลามคือผู้ล่าสูงสุดในท้องทะเล ฟันคมกริบ!',
    'leaf': 'ใบไม้คือโรงงานผลิตอาหารของต้นไม้',
    'caterpillar': 'หนอนผีเสื้อกินเก่งมาก เพื่อสะสมพลังงานรอวันลอกคราบ',
    'bird': 'นกน้อยบินเก่ง ช่วยคุมประชากรหนอนและแมลง',
    'snake': 'งูไม่มีขาแต่เลื้อยไวมาก เป็นผู้ล่าที่น่าเกรงขาม',
    'snake2': 'งูอีกชนิดที่ชอบกินหนูตามทุ่งนา',
    'owl': 'นกฮูกตื่นกลางคืน ตาโตมองเห็นในที่มืดได้ดีเยี่ยม',
    'corn': 'ข้าวโพดหวานอร่อย ให้พลังงานสูง',
    'mouse': 'หนูแฮมสเตอร์หรือหนูนาตัวจิ๋ว ชอบแทะเมล็ดพืช',
    'hawk': 'เหยี่ยวตาไวมาก บินโฉบเหยื่อจากที่สูงได้อย่างแม่นยำ',
    'mushroom': 'เห็ดคือผู้ย่อยสลายที่ช่วยเปลี่ยนซากให้เป็นปุ๋ย'
};

const levelDataNames = {
    'carrot': 'แครอท', 'rabbit': 'กระต่าย', 'fox': 'สุนัขจิ้งจอก',
    'grass': 'หญ้า', 'grasshopper': 'ตั๊กแตน', 'frog': 'กบ', 'stork': 'นกกระสา',
    'seaweed': 'สาหร่าย', 'shrimp': 'กุ้ง', 'octopus': 'หมึก', 'shark': 'ฉลาม',
    'leaf': 'ใบไม้', 'caterpillar': 'หนอนผีเสื้อ', 'bird': 'นก', 'snake': 'งู', 'owl': 'นกฮูก',
    'corn': 'ข้าวโพด', 'mouse': 'หนู', 'snake2': 'งู', 'hawk': 'เหยี่ยว', 'mushroom': 'เห็ด'
};

function renderEncyclopedia() {
    const grid = document.getElementById('encyclopedia-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const allAnimals = Object.keys(animalFacts);
    allAnimals.forEach(animal => {
        const isUnlocked = unlockedAnimals.has(animal);
        const item = document.createElement('div');
        item.className = `encyclopedia-item ${isUnlocked ? 'active' : 'locked'}`;
        item.innerHTML = `
            ${getAnimalHTML(animal)}
            <div style="font-weight: bold; margin-top: 5px;">${isUnlocked ? (levelDataNames[animal] || animal) : '???'}</div>
            <div class="fact">${isUnlocked ? animalFacts[animal] : 'ยังไม่พบเจอในด่าน'}</div>
        `;
        grid.appendChild(item);
    });
}

// 4. Owl Hint System
let hintTimer;
function resetHintTimer() {
    clearTimeout(hintTimer);
    const hintEl = document.getElementById('owl-hint');
    if(hintEl) {
        hintEl.classList.add('hidden');
        hintEl.style.display = 'none';
    }
    hintTimer = setTimeout(showHint, 10000); // 10 seconds idle
}
function stopHintTimer() {
    clearTimeout(hintTimer);
    const hintEl = document.getElementById('owl-hint');
    if(hintEl) {
        hintEl.classList.add('hidden');
        hintEl.style.display = 'none';
    }
}
function showHint() {
    if (typeof currentLevelIndex === 'undefined' || typeof levels === 'undefined') return;
    const level = levels[currentLevelIndex];
    if(!level) return;
    const unfilledAnimals = document.querySelectorAll('.animal-zone:not(.filled)');
    const unfilledArrows = document.querySelectorAll('.arrow-zone:not(.filled)');
    if (unfilledAnimals.length === 0 && unfilledArrows.length === 0) return; // Finished
    
    // Determine what's next based on currentStepIndex
    let targetItem = null;
    let targetName = "ลูกศร";
    
    const allZones = Array.from(document.querySelectorAll('.drop-zone, .arrow-zone'));
    const currentZone = allZones.find(z => parseInt(z.dataset.stepIndex) === currentStepIndex);
    
    if (currentZone) {
        targetItem = currentZone.dataset.target;
        if (targetItem !== 'right' && targetItem !== 'left') {
            targetName = level.names[targetItem] || levelDataNames[targetItem] || "สิ่งมีชีวิต";
        }
    }
    
    document.getElementById('owl-hint-text').innerHTML = `เอ๊ะ... ต้องใส่ <b>${targetName}</b> ต่อไปนะ!
        <div style="content: ''; position: absolute; bottom: -10px; right: 40px; border-width: 10px 10px 0; border-style: solid; border-color: #ff9800 transparent transparent transparent;"></div>`;
    document.getElementById('owl-hint-avatar').innerHTML = getAnimalHTML('owl');
    const owlEl = document.getElementById('owl-hint');
    if(owlEl) {
        owlEl.classList.remove('hidden');
        owlEl.style.display = 'flex';
    }
    speakTTS(`เอ๊ะ... ต้องใส่ ${targetName} ต่อไปนะ`);
}

const levels = [
    {
        id: 1,
        title: "Level 1: แก๊งฟาร์มแสนสนุก",
        bgImage: "url('bg_farm.png')",
        chain: ["carrot", "rabbit", "fox"],
        names: {"carrot": "แครอท", "rabbit": "กระต่าย", "fox": "หมาจิ้งจอก"},
        message: ""
    },
    {
        id: 2,
        title: "Level 2: ปาร์ตี้ริมบึง",
        bgImage: "url('bg_pond.png')",
        chain: ["grass", "grasshopper", "frog", "stork"],
        names: {"grass": "ต้นหญ้า", "grasshopper": "ตั๊กแตน", "frog": "กบ", "stork": "นกกระสา"},
        message: ""
    },
    {
        id: 3,
        title: "Level 3: โลกใต้น้ำสุดหรรษา",
        bgImage: "url('bg_ocean.png')",
        chain: ["seaweed", "shrimp", "octopus", "shark"],
        names: {"seaweed": "สาหร่าย", "shrimp": "กุ้งจิ๋ว", "octopus": "ปลาหมึก", "shark": "ฉลามอ้วน"},
        message: ""
    },
    {
        id: 4,
        title: "Level 4: การผจญภัยในป่าลึก",
        bgImage: "url('bg_forest.png')",
        chain: ["leaf", "caterpillar", "bird", "snake", "owl"],
        names: {"leaf": "ใบไม้", "caterpillar": "หนอนแก้ว", "bird": "นกจิบ", "snake": "งูเขียว", "owl": "นกฮูก"},
        message: ""
    },
    {
        id: 5,
        title: "Level 5: วงจรชีวิต",
        bgImage: "url('bg_sunset.png')",
        chain: ["corn", "mouse", "snake2", "hawk", "mushroom"],
        names: {"corn": "ข้าวโพด", "mouse": "หนูนา", "snake2": "งู", "hawk": "เหยี่ยว", "mushroom": "เห็ดรา"},
        message: "เห็ดราช่วยย่อยสลายสารอาหารกลับสู่ดิน ให้ข้าวโพดเติบโตต่อไป",
        isCycle: true
    }
];

function getRoleData(id) {
    const producers = ["carrot", "grass", "seaweed", "leaf", "corn"];
    const decomposers = ["mushroom"];
    
    if (producers.includes(id)) {
        return { text: "ผู้ผลิต", class: "role-producer" };
    } else if (decomposers.includes(id)) {
        return { text: "ผู้ย่อยสลาย", class: "role-decomposer" };
    } else {
        return { text: "ผู้บริโภค", class: "role-consumer" };
    }
}

function getAnimalHTML(id) {
    const face = `<circle cx="40" cy="45" r="4" fill="#333"/><circle cx="60" cy="45" r="4" fill="#333"/><path d="M 45 52 Q 50 58 55 52" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round"/><ellipse cx="32" cy="48" rx="5" ry="3" fill="#ff8a80" opacity="0.6"/><ellipse cx="68" cy="48" rx="5" ry="3" fill="#ff8a80" opacity="0.6"/>`;
    const svgs = {
        "carrot": `<svg viewBox="0 0 100 100"><path d="M 50 85 C 25 50, 30 20, 50 20 C 70 20, 75 50, 50 85" fill="#ff9800"/><path d="M 50 20 Q 30 0 40 20 M 50 20 Q 50 0 50 20 M 50 20 Q 70 0 60 20" stroke="#4caf50" stroke-width="4" fill="none"/>${face}</svg>`,
        
        "rabbit": `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="65" rx="30" ry="25" fill="#fff"/><circle cx="50" cy="45" r="22" fill="#fff"/><ellipse cx="38" cy="20" rx="6" ry="18" fill="#fff" transform="rotate(-15 38 20)"/><ellipse cx="38" cy="20" rx="3" ry="12" fill="#f48fb1" transform="rotate(-15 38 20)"/><ellipse cx="62" cy="20" rx="6" ry="18" fill="#fff" transform="rotate(15 62 20)"/><ellipse cx="62" cy="20" rx="3" ry="12" fill="#f48fb1" transform="rotate(15 62 20)"/><circle cx="25" cy="75" r="8" fill="#fff"/><circle cx="75" cy="75" r="8" fill="#fff"/><circle cx="50" cy="48" r="2" fill="#f48fb1"/>${face}</svg>`,
        
        "fox": `<svg viewBox="0 0 100 100"><path d="M 20 70 Q 10 50 30 50 L 70 50 Q 90 50 80 70 L 50 90 Z" fill="#ff5722"/><path d="M 75 60 Q 95 60 90 80 Q 70 85 70 70 Z" fill="#ff5722"/><circle cx="90" cy="80" r="5" fill="#fff"/><circle cx="50" cy="50" r="25" fill="#ff5722"/><polygon points="25,25 35,40 45,30" fill="#ff5722"/><polygon points="75,25 65,40 55,30" fill="#ff5722"/><ellipse cx="50" cy="75" rx="15" ry="10" fill="#fff"/><ellipse cx="50" cy="60" rx="20" ry="15" fill="#fff"/><circle cx="50" cy="52" r="3" fill="#333"/>${face}</svg>`,
        
        "grass": `<svg viewBox="0 0 100 100"><path d="M 20 80 Q 15 40 30 30 Q 30 60 40 80 M 40 80 Q 40 30 50 20 Q 55 50 60 80 M 60 80 Q 75 30 80 40 Q 75 60 80 80" stroke="#4caf50" stroke-width="8" stroke-linecap="round" fill="none"/><ellipse cx="50" cy="70" rx="20" ry="15" fill="#81c784"/>${face}</svg>`,
        
        "grasshopper": `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="60" rx="30" ry="15" fill="#4caf50"/><circle cx="30" cy="50" r="15" fill="#81c784"/><path d="M 60 60 L 80 30 L 85 70" fill="none" stroke="#388e3c" stroke-width="4" stroke-linejoin="round"/><path d="M 25 35 Q 15 20 10 30 M 35 35 Q 45 20 50 30" fill="none" stroke="#388e3c" stroke-width="2"/>${face.replace(/40/g, '23').replace(/60/g,'37').replace(/45/g,'48')}</svg>`,
        
        "frog": `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="65" rx="35" ry="25" fill="#4caf50"/><circle cx="35" cy="35" r="12" fill="#4caf50"/><circle cx="65" cy="35" r="12" fill="#4caf50"/><ellipse cx="50" cy="70" rx="25" ry="15" fill="#c8e6c9"/><path d="M 20 70 Q 10 50 15 85 M 80 70 Q 90 50 85 85" fill="none" stroke="#4caf50" stroke-width="8" stroke-linecap="round"/>${face.replace(/45/g,'40')}</svg>`,
        
        "stork": `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="55" rx="25" ry="30" fill="#fff"/><circle cx="50" cy="25" r="15" fill="#fff"/><path d="M 45 25 L 10 30 L 45 35 Z" fill="#ff9800"/><path d="M 40 80 L 40 95 M 60 80 L 60 95" stroke="#ff9800" stroke-width="4"/><ellipse cx="70" cy="55" rx="10" ry="20" fill="#e0e0e0" transform="rotate(-20 70 55)"/>${face.replace(/45/g,'20')}</svg>`,
        
        "seaweed": `<svg viewBox="0 0 100 100"><path d="M 50 90 Q 30 70 50 50 T 50 10" fill="none" stroke="#4caf50" stroke-width="15" stroke-linecap="round"/><path d="M 30 90 Q 10 60 30 40" fill="none" stroke="#81c784" stroke-width="10" stroke-linecap="round"/><ellipse cx="50" cy="70" rx="15" ry="10" fill="#4caf50"/>${face.replace(/45/g,'70')}</svg>`,
        
        "shrimp": `<svg viewBox="0 0 100 100"><path d="M 70 30 C 90 50, 90 80, 50 80 C 30 80, 20 60, 30 40" fill="none" stroke="#ff8a80" stroke-width="15" stroke-linecap="round"/><path d="M 30 40 L 15 30 M 30 40 L 20 50" stroke="#ff8a80" stroke-width="4"/><path d="M 50 80 L 40 95 M 60 75 L 55 90 M 70 65 L 70 80" stroke="#ff8a80" stroke-width="3"/>${face.replace(/45/g,'45').replace(/40/g,'25').replace(/60/g,'35')}</svg>`,
        
        "octopus": `<svg viewBox="0 0 100 100"><circle cx="50" cy="40" r="30" fill="#ab47bc"/><path d="M 25 60 Q 10 80 20 90 M 40 65 Q 30 85 40 95 M 60 65 Q 70 85 60 95 M 75 60 Q 90 80 80 90" fill="none" stroke="#ab47bc" stroke-width="10" stroke-linecap="round"/>${face}</svg>`,
        
        "shark": `<svg viewBox="0 0 100 100"><path d="M 90 50 Q 50 20 10 50 Q 50 80 90 50 Z" fill="#29b6f6"/><path d="M 10 50 L 5 30 L 20 45 Z M 10 50 L 5 70 L 20 55 Z" fill="#29b6f6"/><polygon points="45,35 55,10 65,35" fill="#29b6f6"/><path d="M 30 50 Q 50 70 80 50 Z" fill="#fff"/>${face.replace(/45/g,'45').replace(/40/g,'65').replace(/60/g,'80')}</svg>`,
        
        "leaf": `<svg viewBox="0 0 100 100"><path d="M 50 10 C 90 30, 90 70, 50 90 C 10 70, 10 30, 50 10 Z" fill="#4caf50"/><path d="M 50 10 L 50 95" stroke="#388e3c" stroke-width="4"/><path d="M 50 40 L 30 30 M 50 60 L 70 50" stroke="#388e3c" stroke-width="4"/>${face}</svg>`,
        
        "caterpillar": `<svg viewBox="0 0 100 100"><circle cx="20" cy="50" r="15" fill="#81c784"/><circle cx="40" cy="45" r="15" fill="#4caf50"/><circle cx="60" cy="50" r="15" fill="#81c784"/><circle cx="80" cy="40" r="18" fill="#4caf50"/><path d="M 80 22 Q 75 10 70 15 M 80 22 Q 85 10 90 15" stroke="#333" stroke-width="2" fill="none"/>${face.replace(/40/g,'75').replace(/60/g,'85').replace(/45/g,'35')}</svg>`,
        
        "bird": `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="55" rx="30" ry="25" fill="#03a9f4"/><circle cx="50" cy="35" r="20" fill="#03a9f4"/><polygon points="65,35 85,30 65,40" fill="#ffeb3b"/><ellipse cx="25" cy="55" rx="15" ry="10" fill="#0288d1" transform="rotate(-20 25 55)"/><path d="M 40 80 L 35 95 M 60 80 L 65 95" stroke="#ffeb3b" stroke-width="4"/>${face.replace(/45/g,'30')}</svg>`,
        
        "snake": `<svg viewBox="0 0 100 100"><path d="M 20 80 Q 50 95 80 80 Q 95 60 80 40 Q 50 20 30 40 Q 15 60 30 70" fill="none" stroke="#4caf50" stroke-width="15" stroke-linecap="round"/><circle cx="30" cy="70" r="15" fill="#4caf50"/><path d="M 30 75 L 45 80 M 45 80 L 50 75 M 45 80 L 50 85" stroke="#f44336" stroke-width="2" fill="none"/>${face.replace(/40/g,'25').replace(/60/g,'35').replace(/45/g,'65')}</svg>`,
        
        "snake2": `<svg viewBox="0 0 100 100"><path d="M 20 80 Q 50 95 80 80 Q 95 60 80 40 Q 50 20 30 40 Q 15 60 30 70" fill="none" stroke="#4caf50" stroke-width="15" stroke-linecap="round"/><circle cx="30" cy="70" r="15" fill="#4caf50"/><path d="M 30 75 L 45 80 M 45 80 L 50 75 M 45 80 L 50 85" stroke="#f44336" stroke-width="2" fill="none"/>${face.replace(/40/g,'25').replace(/60/g,'35').replace(/45/g,'65')}</svg>`,
        
        "owl": `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="60" rx="30" ry="35" fill="#795548"/><ellipse cx="50" cy="65" rx="20" ry="25" fill="#d7ccc8"/><polygon points="20,25 35,35 45,20" fill="#795548"/><polygon points="80,25 65,35 55,20" fill="#795548"/><circle cx="35" cy="45" r="12" fill="#fff"/><circle cx="65" cy="45" r="12" fill="#fff"/><circle cx="35" cy="45" r="4" fill="#333"/><circle cx="65" cy="45" r="4" fill="#333"/><polygon points="45,50 55,50 50,60" fill="#ffb300"/><path d="M 40 95 L 40 100 M 60 95 L 60 100" stroke="#ffb300" stroke-width="4"/></svg>`,
        
        "corn": `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="20" ry="40" fill="#ffeb3b"/><path d="M 50 90 Q 20 60 10 30 Q 30 70 50 90 Z" fill="#81c784"/><path d="M 50 90 Q 80 60 90 30 Q 70 70 50 90 Z" fill="#4caf50"/>${face}</svg>`,
        
        "mouse": `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="65" rx="25" ry="20" fill="#9e9e9e"/><circle cx="35" cy="45" r="15" fill="#9e9e9e"/><circle cx="65" cy="45" r="15" fill="#9e9e9e"/><circle cx="35" cy="45" r="8" fill="#f48fb1"/><circle cx="65" cy="45" r="8" fill="#f48fb1"/><path d="M 75 65 Q 95 65 90 40" fill="none" stroke="#9e9e9e" stroke-width="4"/><circle cx="50" cy="55" r="3" fill="#333"/>${face.replace(/45/g,'55')}</svg>`,
        
        "hawk": `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="55" rx="25" ry="35" fill="#5d4037"/><path d="M 25 55 Q 10 40 5 60 Q 20 70 25 55 Z" fill="#8d6e63"/><path d="M 75 55 Q 90 40 95 60 Q 80 70 75 55 Z" fill="#8d6e63"/><circle cx="50" cy="30" r="18" fill="#5d4037"/><polygon points="45,30 65,30 55,45" fill="#ffca28"/><ellipse cx="50" cy="65" rx="15" ry="20" fill="#d7ccc8"/><path d="M 40 90 L 35 100 M 60 90 L 65 100" stroke="#ffca28" stroke-width="4"/>${face.replace(/45/g,'25')}</svg>`,
        
        "mushroom": `<svg viewBox="0 0 100 100"><path d="M 40 50 L 40 90 Q 50 95 60 90 L 60 50 Z" fill="#ffe082"/><path d="M 10 50 Q 50 0 90 50 Z" fill="#f44336"/><circle cx="30" cy="35" r="8" fill="#fff"/><circle cx="50" cy="20" r="6" fill="#fff"/><circle cx="70" cy="40" r="10" fill="#fff"/>${face.replace(/45/g,'70')}</svg>`
    };
    return svgs[id] || svgs["leaf"];
}

// --- Audio System ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let isMusicPlaying = false;
let nextNoteTime = 0;
let currentNote = 0;
let bgmInterval = null;

const bgmNotes = [
    {f: 261.63, d: 0.2}, {f: 329.63, d: 0.2}, {f: 392.00, d: 0.4},
    {f: 261.63, d: 0.2}, {f: 329.63, d: 0.2}, {f: 392.00, d: 0.4},
    {f: 440.00, d: 0.2}, {f: 392.00, d: 0.2}, {f: 329.63, d: 0.4},
    {f: 293.66, d: 0.4}, {f: 261.63, d: 0.8}
];

function playTone(freq, type = 'sine', duration = 0.1, slide = false) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = type;
    
    if (slide) {
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq / 2, audioCtx.currentTime + duration);
    } else {
        osc.frequency.value = freq;
    }

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playSuccess() {
    playTone(523.25, 'sine', 0.1); 
    setTimeout(() => playTone(659.25, 'sine', 0.1), 100); 
    setTimeout(() => playTone(783.99, 'sine', 0.2), 200); 
}

function playArrowSuccess() {
    playTone(659.25, 'sine', 0.1); 
    setTimeout(() => playTone(1046.50, 'sine', 0.2), 100); 
}

function playFail() {
    playTone(300, 'triangle', 0.4, true); 
}

function playBGMStep() {
    if(!isMusicPlaying) return;
    if (audioCtx.currentTime >= nextNoteTime) {
        let note = bgmNotes[currentNote];
        playTone(note.f, 'triangle', note.d * 0.8);
        nextNoteTime = audioCtx.currentTime + note.d;
        currentNote = (currentNote + 1) % bgmNotes.length;
    }
}

function toggleMusic() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    isMusicPlaying = !isMusicPlaying;
    const btn = document.getElementById('btn-music');
    if (isMusicPlaying) {
        btn.style.opacity = 1;
        nextNoteTime = audioCtx.currentTime + 0.1;
        bgmInterval = setInterval(playBGMStep, 50);
    } else {
        btn.style.opacity = 0.5;
        clearInterval(bgmInterval);
    }
}

// --- Game State ---
let currentLevelIndex = 0;
let score = 0;
let levelStartTime = 0;
let currentStepIndex = 0;

// --- DOM Elements ---
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const victoryScreen = document.getElementById('victory-screen');
const cardInventory = document.getElementById('card-inventory');
const bgLayer = document.getElementById('bg-layer');
const levelCompleteModal = document.getElementById('level-complete-modal');

// --- Initialization ---
const decors = ['rabbit', 'frog', 'bird', 'shark', 'owl', 'carrot'];
decors.forEach((animal, i) => {
    const el = document.getElementById(`decor-${i+1}`);
    if(el) el.innerHTML = getAnimalHTML(animal);
});

document.getElementById('btn-start').addEventListener('click', () => {
    startScreen.classList.remove('active');
    startScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    gameScreen.classList.add('active');
    if(audioCtx.state === 'suspended') audioCtx.resume();
    loadLevel();
});
document.getElementById('btn-how-to').addEventListener('click', () => {
    document.getElementById('modal-how-to').classList.remove('hidden');
});
document.getElementById('btn-close-how-to').addEventListener('click', () => {
    document.getElementById('modal-how-to').classList.add('hidden');
});

document.getElementById('btn-encyclopedia').addEventListener('click', () => {
    renderEncyclopedia();
    document.getElementById('modal-encyclopedia').classList.remove('hidden');
});
document.getElementById('btn-close-encyclopedia').addEventListener('click', () => {
    document.getElementById('modal-encyclopedia').classList.add('hidden');
});
document.getElementById('btn-reset-encyclopedia').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('modal-confirm-reset').classList.remove('hidden');
});

document.getElementById('btn-confirm-no').addEventListener('click', () => {
    document.getElementById('modal-confirm-reset').classList.add('hidden');
});

document.getElementById('btn-confirm-yes').addEventListener('click', () => {
    unlockedAnimals.clear();
    localStorage.removeItem('foodChainUnlocked');
    renderEncyclopedia();
    document.getElementById('modal-confirm-reset').classList.add('hidden');
});
document.getElementById('btn-home').addEventListener('click', () => {
    stopHintTimer();
    gameScreen.classList.remove('active');
    gameScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    startScreen.classList.add('active');
});
document.getElementById('btn-toggle-aspect').addEventListener('click', () => {
    document.body.classList.toggle('aspect-16-9');
});
document.getElementById('btn-music').addEventListener('click', toggleMusic);
document.getElementById('btn-play-again').addEventListener('click', () => {
    score = 0;
    currentLevelIndex = 0;
    document.getElementById('score-text').innerText = score;
    victoryScreen.classList.remove('active');
    victoryScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    gameScreen.classList.add('active');
    loadLevel();
});
document.getElementById('btn-home').addEventListener('click', () => {
    location.reload();
});
document.getElementById('btn-next-level').addEventListener('click', () => {
    levelCompleteModal.classList.add('hidden');
    currentLevelIndex++;
    loadLevel();
});

// --- Level Loading ---
function loadLevel() {
    if (currentLevelIndex >= levels.length) {
        showVictory();
        return;
    }
    const level = levels[currentLevelIndex];
    levelStartTime = Date.now();
    currentStepIndex = 0;
    
    // Apply background image instead of just solid color
    bgLayer.style.backgroundImage = level.bgImage;
    
    document.getElementById('level-indicator').innerText = level.title;
    document.getElementById('level-message').classList.add('hidden');
    document.getElementById('btn-check-score').classList.add('hidden');
    cardInventory.classList.remove('hidden');
    
    const dropZonesContainer = document.getElementById('drop-zones');
    dropZonesContainer.innerHTML = '';
    cardInventory.innerHTML = '';
    
    // Create Drop Zones & Arrow Zones
    let stepCount = 0;
    level.chain.forEach((itemId, index) => {
        const zone = document.createElement('div');
        zone.className = 'drop-zone animal-zone';
        zone.dataset.target = itemId;
        zone.dataset.stepIndex = stepCount++;
        dropZonesContainer.appendChild(zone);

        if (index < level.chain.length - 1) {
            const arrZone = document.createElement('div');
            arrZone.className = 'arrow-zone'; 
            arrZone.dataset.target = 'right'; // Correct direction is right
            arrZone.dataset.stepIndex = stepCount++;
            dropZonesContainer.appendChild(arrZone);
        }
    });

    if (level.isCycle) {
        const curvedArrow = document.createElement('div');
        curvedArrow.className = 'arrow-curved';
        curvedArrow.innerHTML = `<svg preserveAspectRatio="none"><path d="M 80 0 Q 50 100 20 0" /></svg>`;
        dropZonesContainer.appendChild(curvedArrow);
    }

    // Populate Inventory (shuffled)
    const shuffledCards = [...level.chain].sort(() => Math.random() - 0.5);
    shuffledCards.forEach(itemId => {
        const card = document.createElement('div');
        card.className = 'card animal-card breathe';
        card.dataset.id = itemId;
        card.dataset.type = 'animal';
        const roleData = getRoleData(itemId);
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front">
                    ${getAnimalHTML(itemId)}
                    <div class="card-label">${level.names[itemId] || itemId}</div>
                </div>
                <div class="card-back ${roleData.class}">
                    ${roleData.text}
                </div>
            </div>
        `;
        setupDraggable(card);
        cardInventory.appendChild(card);
    });

    // Create Draggable Arrows 
    const numArrows = level.chain.length - 1;
    for(let i=0; i<numArrows; i++) {
        const arrRight = document.createElement('div');
        arrRight.className = 'card arrow-card breathe';
        arrRight.dataset.id = 'right';
        arrRight.dataset.type = 'arrow';
        arrRight.innerHTML = `
            <div class="card-inner">
                <div class="card-front">
                    <div class="arrow">➡️</div>
                </div>
                <div class="card-back" style="background: #2196f3; color: white; display: flex; align-items: center; justify-content: center; font-size: 1rem; border-radius: 15px;">
                    ส่งพลังงาน
                </div>
            </div>
        `;
        setupDraggable(arrRight);
        cardInventory.appendChild(arrRight);
    }
    const arrLeft = document.createElement('div');
    arrLeft.className = 'card arrow-card breathe';
    arrLeft.dataset.id = 'left';
    arrLeft.dataset.type = 'arrow';
    arrLeft.innerHTML = `
        <div class="card-inner">
            <div class="card-front">
                <div class="arrow">⬅️</div>
            </div>
            <div class="card-back" style="background: #f44336; color: white; display: flex; align-items: center; justify-content: center; font-size: 1rem; border-radius: 15px;">
                หลอกย้อนกลับ
            </div>
        </div>
    `;
    setupDraggable(arrLeft);
    cardInventory.appendChild(arrLeft);
    
    highlightCurrentZone();
    resetHintTimer();
}

function highlightCurrentZone() {
    document.querySelectorAll('.drop-zone, .arrow-zone').forEach(zone => {
        zone.classList.remove('active-zone');
        if (parseInt(zone.dataset.stepIndex) === currentStepIndex) {
            zone.classList.add('active-zone');
        }
    });
}

// --- Drag and Drop / Flip Logic ---
function setupDraggable(el) {
    let isDragging = false;
    let startX, startY, initialX, initialY;

    // Flip logic using native single click event
    el.addEventListener('click', (e) => {
        if (!el.classList.contains('filled')) return;
        if (el.dataset.type === 'arrow') return;
        if (el.parentElement && el.parentElement.id === 'card-inventory') return; // Restrict flip in inventory
        
        // Only allow flip when the food chain is fully completed
        const btnCheckScore = document.getElementById('btn-check-score');
        if (btnCheckScore && btnCheckScore.classList.contains('hidden')) return;
        
        if (el.classList.contains('flipped')) {
            el.classList.remove('flipped');
        } else {
            el.classList.add('flipped');
        }
        createParticles(e.clientX, e.clientY);
        playSuccess();
    });

    el.addEventListener('pointerdown', (e) => {
        if (el.classList.contains('filled')) return;
        if (el.classList.contains('flipped')) return; // Prevent drag while flipped
        
        resetHintTimer();
        
        isDragging = true;
        el.classList.add('dragging');
        el.classList.remove('breathe');
        
        const rect = el.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = rect.left;
        initialTop = rect.top;
        
        el.style.position = 'fixed';
        el.style.left = initialLeft + 'px';
        el.style.top = initialTop + 'px';
        el.style.margin = 0;
        
        el.setPointerCapture(e.pointerId);
    });

    el.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        el.style.left = initialLeft + dx + 'px';
        el.style.top = initialTop + dy + 'px';

        // Hover effects
        const targetSelector = el.dataset.type === 'animal' ? '.animal-zone' : '.arrow-zone';
        document.querySelectorAll(targetSelector).forEach(zone => {
            if (!zone.classList.contains('filled') && isOverlapping(el, zone)) {
                zone.classList.add('hovered');
            } else {
                zone.classList.remove('hovered');
            }
        });
    });

    el.addEventListener('pointerup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        el.classList.remove('dragging');
        el.releasePointerCapture(e.pointerId);

        let dropped = false;
        const targetSelector = el.dataset.type === 'animal' ? '.animal-zone' : '.arrow-zone';
        const zones = document.querySelectorAll(targetSelector);
        
        for (let zone of zones) {
            zone.classList.remove('hovered');
            if (!zone.classList.contains('filled') && isOverlapping(el, zone)) {
                // Check if it's the correct sequential step
                if (parseInt(zone.dataset.stepIndex) !== currentStepIndex) {
                    continue; // Skip if not the active zone
                }
                
                if (zone.dataset.target === el.dataset.id) {
                    snapToZone(el, zone);
                    dropped = true;
                    currentStepIndex++;
                    highlightCurrentZone();
                    
                    if(el.dataset.type === 'animal') {
                        playSuccess();
                        createSparkles(zone);
                        score += 10;
                    } else {
                        playArrowSuccess();
                        createSparkles(zone);
                        score += 15;
                        triggerEnergyEffect(zone);
                    }
                    document.getElementById('score-text').innerText = score;
                    checkLevelComplete();
                    break;
                }
            }
        }

        if (!dropped) {
            playFail();
            el.classList.add('shake');
            setTimeout(() => el.classList.remove('shake'), 400);
            
            el.style.transition = 'all 0.3s ease';
            el.style.position = 'relative';
            el.style.left = '0px';
            el.style.top = '0px';
            setTimeout(() => {
                el.style.transition = '';
                if(el.dataset.type === 'animal') el.classList.add('breathe');
            }, 300);
        }
    });
}

function isOverlapping(el1, el2) {
    const r1 = el1.getBoundingClientRect();
    const r2 = el2.getBoundingClientRect();
    return !(r1.right < r2.left || r1.left > r2.right || r1.bottom < r2.top || r1.top > r2.bottom);
}

function snapToZone(card, zone) {
    zone.classList.add('filled');
    zone.appendChild(card);
    card.style.position = 'relative';
    card.style.left = '0px';
    card.style.top = '0px';
    card.classList.add('filled'); // Prevent dragging but allow clicking
    card.classList.remove('breathe');
    if(card.dataset.type === 'arrow') {
        card.style.background = 'transparent';
        card.style.boxShadow = 'none';
        const nameSpan = card.querySelector('.card-name');
        if(nameSpan) nameSpan.style.display = 'none';
    }
}

function createSparkles(zone) {
    const rect = zone.getBoundingClientRect();
    for (let i = 0; i < 8; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.left = (rect.left + rect.width/2) + 'px';
        sparkle.style.top = (rect.top + rect.height/2) + 'px';
        const tx = (Math.random() - 0.5) * 100 + 'px';
        const ty = (Math.random() - 0.5) * 100 + 'px';
        sparkle.style.setProperty('--tx', tx);
        sparkle.style.setProperty('--ty', ty);
        document.body.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 500);
    }
}

function triggerEnergyEffect(arrowZone) {
    const nextZone = arrowZone.nextElementSibling;
    if(!nextZone) return;

    const startRect = arrowZone.getBoundingClientRect();
    const endRect = nextZone.getBoundingClientRect();

    const ball = document.createElement('div');
    ball.className = 'energy-ball';
    ball.style.setProperty('--start-x', (startRect.left + startRect.width/2) + 'px');
    ball.style.setProperty('--start-y', (startRect.top + startRect.height/2) + 'px');
    ball.style.setProperty('--end-x', (endRect.left + endRect.width/2) + 'px');
    ball.style.setProperty('--end-y', (endRect.top + endRect.height/2) + 'px');
    
    document.body.appendChild(ball);

    setTimeout(() => {
        ball.remove();
        const animalCard = nextZone.querySelector('.card');
        if(animalCard) {
            animalCard.classList.add('happy-eat');
            setTimeout(() => animalCard.classList.remove('happy-eat'), 800);
        }
    }, 1000);
}

let savedTimeTaken = 0;

function checkLevelComplete() {
    const unfilledAnimals = document.querySelectorAll('.animal-zone:not(.filled)');
    const unfilledArrows = document.querySelectorAll('.arrow-zone:not(.filled)');
    
    if (unfilledAnimals.length === 0 && unfilledArrows.length === 0) {
        stopHintTimer();
        // Update Encyclopedia
        const level = levels[currentLevelIndex];
        if (level && level.chain) {
            level.chain.forEach(animal => unlockedAnimals.add(animal));
            localStorage.setItem('foodChainUnlocked', JSON.stringify([...unlockedAnimals]));
        }

        // Stop timer and save time
        savedTimeTaken = Math.floor((Date.now() - levelStartTime) / 1000);
        
        // Show Check Score button instead of immediate modal
        document.getElementById('btn-check-score').classList.remove('hidden');
        playSuccess(); // small pop sound to indicate completion
    }
}

// Check Score Button Event
document.getElementById('btn-check-score').addEventListener('click', () => {
    document.getElementById('btn-check-score').classList.add('hidden');
    
    const level = levels[currentLevelIndex];
    let stars = 1;
    let starMsg = "พยายามได้ดีมาก!";
    if (savedTimeTaken <= 15) {
        stars = 3;
        starMsg = "ยอดเยี่ยม! เร็วสุด ๆ เลย!";
        speakTTS("ยอดเยี่ยม! เร็วสุด ๆ เลย!");
    } else if (savedTimeTaken <= 30) {
        stars = 2;
        starMsg = "เก่งมากเลย!";
        speakTTS("เก่งมากเลย!");
    } else {
        speakTTS("พยายามได้ดีมาก!");
    }

    // Add Educational Message if exists
    if (level.message) {
        starMsg += `<br><br><span style="font-size: 1rem; color: #4caf50;">💡 ${level.message}</span>`;
    }

    document.getElementById('time-text').innerText = `ใช้เวลาไป: ${savedTimeTaken} วินาที`;
    document.getElementById('star-message').innerHTML = starMsg;
    
    const nextBtn = document.getElementById('btn-next-level');
    if (currentLevelIndex === levels.length - 1) {
        nextBtn.innerText = 'จบเกม';
    } else {
        nextBtn.innerText = 'ลุยด่านต่อไป!';
    }
    
    const starContainer = document.getElementById('star-container');
    starContainer.innerHTML = '';
    
    levelCompleteModal.classList.remove('hidden');
    
    // Animate stars popping in
    for(let i = 0; i < 3; i++) {
        setTimeout(() => {
            const star = document.createElement('span');
            star.innerText = '⭐';
            if (i < stars) {
                star.className = 'star-filled';
                playSuccess(); // small pop sound
            } else {
                star.className = 'star-empty';
            }
            starContainer.appendChild(star);
        }, i * 300 + 500);
    }
});

// --- Victory Screen & Confetti ---
function showVictory() {
    gameScreen.classList.remove('active');
    gameScreen.classList.add('hidden');
    victoryScreen.classList.remove('hidden');
    victoryScreen.classList.add('active');
    
    let allMascots = '';
    levels.forEach(lvl => lvl.chain.forEach(id => {
        allMascots += `<div class="card" style="position:relative; width:60px; height:60px; transform:scale(0.8);">${getAnimalHTML(id)}</div>`;
    }));
    document.getElementById('victory-mascots').innerHTML = allMascots;
    
    startConfetti();
}

function startConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const colors = ['#ffca28', '#81d4fa', '#ff8a80', '#b3e5fc', '#c8e6c9'];
    
    for(let i=0; i<150; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            w: Math.random() * 10 + 5,
            h: Math.random() * 10 + 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            vy: Math.random() * 3 + 2,
            vr: (Math.random() - 0.5) * 0.2,
            angle: Math.random() * Math.PI * 2
        });
    }
    
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.y += p.vy;
            p.angle += p.vr;
            if(p.y > canvas.height) p.y = -20;
            
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
            ctx.restore();
        });
        if(victoryScreen.classList.contains('active')) {
            requestAnimationFrame(render);
        }
    }
    render();
}
