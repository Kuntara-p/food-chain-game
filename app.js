// --- Premium V.9 Additions ---

// 1. TTS System
let ttsRequestId = 0;
let isSfxEnabled = true;

function playTTSChime(force = false) {
    if (!isSfxEnabled && !force) return;
    try {
        if (!audioCtx) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();
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

window.currentTTSAudio = new Audio();

function unlockAudio() {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    if (!window.audioUnlocked) {
        window.audioUnlocked = true;
        try {
            if (!window.currentTTSAudio) window.currentTTSAudio = new Audio();
            window.currentTTSAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
            window.currentTTSAudio.play().catch(() => {});
        } catch(e) {}
        
        if ('speechSynthesis' in window) {
            try {
                const utterance = new SpeechSynthesisUtterance('');
                window.speechSynthesis.speak(utterance);
            } catch(e) {}
        }
    }
}

function speakLocalTTS(text) {
    if (!('speechSynthesis' in window)) return;
    try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'th-TH';
        const voices = window.speechSynthesis.getVoices();
        const thaiVoice = voices.find(v => v.lang.includes('th') || v.name.includes('Thai'));
        if (thaiVoice) utterance.voice = thaiVoice;
        window.speechSynthesis.speak(utterance);
    } catch(e) {}
}

function stopTTS() {
    ttsRequestId++;
    try {
        if (window.currentTTSAudio) {
            window.currentTTSAudio.onerror = null;
            window.currentTTSAudio.pause();
            window.currentTTSAudio.currentTime = 0;
        }
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    } catch(e) {}
}

function speakTTS(text, force = false) {
    if (!isSfxEnabled && !force) return;
    playTTSChime(force);
    const currentId = ++ttsRequestId;
    try {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=th&q=${encodeURIComponent(text)}`;
        if (!window.currentTTSAudio) window.currentTTSAudio = new Audio();
        window.currentTTSAudio.pause();
        window.currentTTSAudio.onerror = () => {
            if (currentId !== ttsRequestId) return;
            speakLocalTTS(text);
        };
        window.currentTTSAudio.src = url;
        window.currentTTSAudio.play().catch(() => {
            if (currentId !== ttsRequestId) return;
            speakLocalTTS(text);
        });
    } catch(e) {
        speakLocalTTS(text);
    }
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
    'snake': 'งูเขียวปีนต้นไม้เก่ง ล่าหนอน นก และสัตว์เล็กในป่าเป็นอาหาร',
    'snake2': 'งูสิงออกหากินตามทุ่งนาและไร่ข้าวโพด ชอบล่าหนูนาเป็นอาหาร',
    'owl': 'นกฮูกตื่นกลางคืน ตาโตมองเห็นในที่มืดได้ดีเยี่ยม',
    'corn': 'ข้าวโพดหวานอร่อย ให้พลังงานสูง',
    'mouse': 'หนูแฮมสเตอร์หรือหนูนาตัวจิ๋ว ชอบแทะเมล็ดพืช',
    'hawk': 'เหยี่ยวตาไวมาก บินโฉบเหยื่อจากที่สูงได้อย่างแม่นยำ',
    'mushroom': 'เห็ดคือผู้ย่อยสลายที่ช่วยเปลี่ยนซากให้เป็นปุ๋ย',
    'rice': 'ต้นข้าวเป็นพืชอาหารสำคัญ ใช้แสงแดดสร้างเมล็ดข้าวให้เราทาน',
    'crab': 'ปูนาอาศัยในนาข้าว มีก้ามแข็งแรง กินยอดข้าวอ่อนและสัตว์น้ำเล็กๆ',
    'duck': 'เป็ดไล่ทุ่งช่วยชาวนาจับปูนา หอยเชอรี่ และแมลงในนาข้าวได้เก่งมาก',
    'python': 'งูเหลือมเป็นงูขนาดใหญ่ ไม่มีพิษ แต่รัดเหยื่อเก่งมาก',
    'cactus': 'กระบองเพชรเปลี่ยนใบเป็นหนามเพื่อลดการคายน้ำ ทนร้อนในทะเลทรายได้ดี',
    'beetle': 'ด้วงทะเลทรายเก็บความชื้นจากหมอกตอนเช้า และกินพืชทะเลทราย',
    'scorpion': 'แมงป่องออกหากินตอนกลางคืน ใช้ก้ามและหางช่วยป้องกันตัวและจับแมลง',
    'fennec': 'จิ้งจอกเฟนเนกมีใบหูใหญ่ช่วยระบายความร้อนและฟังเสียงเหยื่อใต้ทราย',
    'phytoplankton': 'แพลงก์ตอนพืชเป็นสิ่งมีชีวิตจิ๋วในทะเลที่สังเคราะห์แสงและผลิตออกซิเจนให้โลก',
    'krill': 'ตัวเคยเป็นสัตว์ทะเลขนาดจิ๋วคล้ายกุ้ง เป็นอาหารหลักของสัตว์ขั้วโลก',
    'cod': 'ปลาค็อดขั้วโลกทนน้ำเย็นจัดได้เพราะมีโปรตีนป้องกันการแข็งตัวในเลือด',
    'seal': 'แมวน้ำมีชั้นไขมันหนาช่วยให้อบอุ่น ดำน้ำจับปลาเก่งสุดๆ',
    'polarbear': 'หมีขั้วโลกขนสีขาวช่วยพรางตัวกับหิมะ และเป็นนักล่าอันดับสูงสุดของขั้วโลกเหนือ',
    'acacia': 'ต้นอะคาเชียทรงร่มทนแล้งได้ดีในทุ่งหญ้าสะวันนา ใบเขียวเป็นอาหารของยีราฟ',
    'giraffe': 'ยีราฟคอยาวที่สุดในโลก ใช้ลิ้นยาวเอื้อมเด็ดใบอะคาเชียบนยอดไม้สูง',
    'lion': 'สิงโตอยู่รวมกันเป็นฝูงและช่วยกันล่าเหยื่อในทุ่งหญ้าสะวันนา',
    'vulture': 'แร้งเป็นผู้กินซากที่ช่วยเก็บกวาดธรรมชาติไม่ให้เกิดโรคระบาด',
    'cabbage': 'กะหล่ำปลีเป็นผักใบเขียวที่สร้างอาหารเองได้ด้วยแสงแดด',
    'snail': 'หอยทากเดินช้าๆ ด้วยกล้ามเนื้อเท้า และชอบกัดกินใบผักอ่อนๆ',
    'myna': 'นกเอี้ยงส่งเสียงร้องเก่ง ชอบเดินตามพื้นหญ้าหาหนอนและหอยทากกิน',
    'cat': 'แมวหูไวตาไว มีหนวดช่วยวัดระยะ ชอบไล่จับหนูและนกตัวเล็กๆ',
    'earthworm': 'ไส้เดือนดินช่วยพรวนดินและย่อยสลายซากใบไม้ให้เป็นปุ๋ยชั้นดีแก่พืช'
};

const levelDataNames = {
    'carrot': 'แครอท', 'rabbit': 'กระต่าย', 'fox': 'สุนัขจิ้งจอก',
    'grass': 'หญ้า', 'grasshopper': 'ตั๊กแตน', 'frog': 'กบ', 'stork': 'นกกระสา',
    'seaweed': 'สาหร่าย', 'shrimp': 'กุ้ง', 'octopus': 'หมึก', 'shark': 'ฉลาม',
    'leaf': 'ใบไม้', 'caterpillar': 'หนอนผีเสื้อ', 'bird': 'นก', 'snake': 'งูเขียว', 'owl': 'นกฮูก',
    'corn': 'ข้าวโพด', 'mouse': 'หนู', 'snake2': 'งูสิง', 'hawk': 'เหยี่ยว', 'mushroom': 'เห็ด',
    'rice': 'ต้นข้าว', 'crab': 'ปูนา', 'duck': 'เป็ด', 'python': 'งูเหลือม',
    'cactus': 'กระบองเพชร', 'beetle': 'ด้วงทะเลทราย', 'scorpion': 'แมงป่อง', 'fennec': 'จิ้งจอกเฟนเนก',
    'phytoplankton': 'แพลงก์ตอนพืช', 'krill': 'ตัวเคย', 'cod': 'ปลาค็อด', 'seal': 'แมวน้ำ', 'polarbear': 'หมีขั้วโลก',
    'acacia': 'ต้นอะคาเชีย', 'giraffe': 'ยีราฟ', 'lion': 'สิงโต', 'vulture': 'แร้ง',
    'cabbage': 'กะหล่ำปลี', 'snail': 'หอยทาก', 'myna': 'นกเอี้ยง', 'cat': 'แมว', 'earthworm': 'ไส้เดือนดิน'
};

function renderEncyclopedia() {
    const grid = document.getElementById('encyclopedia-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const allAnimals = Object.keys(animalFacts);
    allAnimals.forEach(animal => {
        const isUnlocked = unlockedAnimals.has(animal);
        const name = levelDataNames[animal] || animal;
        const item = document.createElement('div');
        item.className = `encyclopedia-item ${isUnlocked ? 'active' : 'locked'}`;
        item.innerHTML = `
            ${getAnimalHTML(animal)}
            <div style="font-weight: bold; margin-top: 5px;">${isUnlocked ? name : '???'}</div>
            <div class="fact">${isUnlocked ? animalFacts[animal] : 'ยังไม่พบเจอในด่าน'}</div>
            ${isUnlocked ? '<div class="audio-hint">🔊 กดฟังเสียง</div>' : ''}
        `;
        if (isUnlocked) {
            item.title = `กดเพื่อฟังความรู้เรื่อง${name}`;
            item.addEventListener('click', () => {
                unlockAudio();
                grid.querySelectorAll('.speaking').forEach(el => el.classList.remove('speaking'));
                item.classList.add('speaking');
                speakTTS(`${name}... ${animalFacts[animal]}`, true);
                setTimeout(() => item.classList.remove('speaking'), 3500);
            });
        }
        grid.appendChild(item);
    });
}

// 4. Owl Hint System
let hintTimer;
function resetHintTimer() {
    clearTimeout(hintTimer);
    const hintEl = document.getElementById('owl-hint');
    if (hintEl) {
        hintEl.classList.add('hidden');
    }
    hintTimer = setTimeout(showHint, 10000); // 10 seconds idle
}
function stopHintTimer() {
    clearTimeout(hintTimer);
    const hintEl = document.getElementById('owl-hint');
    if (hintEl) {
        hintEl.classList.add('hidden');
    }
}
function showHint() {
    if (!gameScreen || !gameScreen.classList.contains('active')) return;
    if (levelCompleteModal && !levelCompleteModal.classList.contains('hidden')) return;
    if (typeof currentLevelIndex === 'undefined' || typeof levels === 'undefined') return;
    const level = levels[currentLevelIndex];
    if (!level) return;
    const unfilledAnimals = document.querySelectorAll('.animal-zone:not(.filled)');
    const unfilledArrows = document.querySelectorAll('.arrow-zone:not(.filled)');
    if (unfilledAnimals.length === 0 && unfilledArrows.length === 0) return; // Finished
    
    // Determine what's next based on currentStepIndex (practice) or first unfilled zone (challenge)
    let targetItem = null;
    
    const allZones = Array.from(document.querySelectorAll('.drop-zone, .arrow-zone'));
    const currentZone = gameMode === 'practice'
        ? allZones.find(z => parseInt(z.dataset.stepIndex) === currentStepIndex)
        : allZones.find(z => !z.classList.contains('filled'));
    
    if (currentZone) {
        targetItem = currentZone.dataset.target;
    }
    
    let hintMsg = "";
    let speakMsg = "";
    
    if (targetItem === 'right' || targetItem === 'left') {
        hintMsg = "อย่าลืมใส่ <b>ลูกศร</b> เพื่อแสดงการถ่ายทอดพลังงานนะ!";
        speakMsg = "อย่าลืมใส่ลูกศร เพื่อแสดงการถ่ายทอดพลังงานนะ";
    } else {
        const chainIndex = level.chain.indexOf(targetItem);
        if (chainIndex === 0) {
            hintMsg = "ห่วงโซ่อาหารต้องเริ่มต้นด้วย <b>ผู้ผลิต (พืช)</b> เสมอนะ!";
            speakMsg = "ห่วงโซ่อาหารต้องเริ่มต้นด้วย ผู้ผลิต เสมอนะ";
        } else if (chainIndex > 0) {
            const prevItem = level.chain[chainIndex - 1];
            const prevName = level.names[prevItem] || levelDataNames[prevItem] || "สิ่งมีชีวิตก่อนหน้า";
            hintMsg = `ตัวอะไรเอ่ย ที่จะมากิน <b>${prevName}</b> ต่อไป?`;
            speakMsg = `ตัวอะไรเอ่ย ที่จะมากิน ${prevName} ต่อไป`;
        } else {
            hintMsg = "ลองคิดดูดีๆ ว่าตัวอะไรควรจะอยู่ตรงนี้นะ!";
            speakMsg = "ลองคิดดูดีๆ ว่าตัวอะไรควรจะอยู่ตรงนี้นะ";
        }
    }
    
    document.getElementById('owl-hint-text').innerHTML = `เอ๊ะ... ${hintMsg}
        <div class="owl-hint-tail"></div>`;
    document.getElementById('owl-hint-avatar').innerHTML = getAnimalHTML('owl');
    const owlEl = document.getElementById('owl-hint');
    if (owlEl) {
        owlEl.classList.remove('hidden');
    }
    speakTTS(`เอ๊ะ... ${speakMsg}`);
}

const levels = [
    {
        id: 1,
        title: "Level 1: แก๊งฟาร์มแสนสนุก",
        bgImage: "url('bg_farm.png')",
        chain: ["carrot", "rabbit", "fox"],
        distractors: ["shark", "seaweed"],
        names: {"carrot": "แครอท", "rabbit": "กระต่าย", "fox": "หมาจิ้งจอก"},
        message: ""
    },
    {
        id: 2,
        title: "Level 2: ปาร์ตี้ริมบึง",
        bgImage: "url('bg_pond.png')",
        chain: ["grass", "grasshopper", "frog", "stork"],
        distractors: ["octopus", "carrot"],
        names: {"grass": "ต้นหญ้า", "grasshopper": "ตั๊กแตน", "frog": "กบ", "stork": "นกกระสา"},
        message: ""
    },
    {
        id: 3,
        title: "Level 3: โลกใต้น้ำสุดหรรษา",
        bgImage: "url('bg_ocean.png')",
        chain: ["seaweed", "shrimp", "octopus", "shark"],
        distractors: ["rabbit", "grasshopper"],
        names: {"seaweed": "สาหร่าย", "shrimp": "กุ้งจิ๋ว", "octopus": "ปลาหมึก", "shark": "ฉลามอ้วน"},
        message: ""
    },
    {
        id: 4,
        title: "Level 4: การผจญภัยในป่าลึก",
        bgImage: "url('bg_forest.png')",
        chain: ["leaf", "caterpillar", "bird", "snake", "owl"],
        distractors: ["shrimp", "corn"],
        names: {"leaf": "ใบไม้", "caterpillar": "หนอนแก้ว", "bird": "นกจิบ", "snake": "งูเขียว", "owl": "นกฮูก"},
        message: ""
    },
    {
        id: 5,
        title: "Level 5: วงจรชีวิต",
        bgImage: "url('bg_sunset.png')",
        chain: ["corn", "mouse", "snake2", "hawk", "mushroom"],
        distractors: ["frog", "seaweed"],
        names: {"corn": "ข้าวโพด", "mouse": "หนูนา", "snake2": "งูสิง", "hawk": "เหยี่ยว", "mushroom": "เห็ดรา"},
        message: "เห็ดราช่วยย่อยสลายสารอาหารกลับสู่ดิน ให้ข้าวโพดเติบโตต่อไป",
        isCycle: true
    },
    {
        id: 6,
        title: "Level 6: ทุ่งนาบ้านเรา",
        bgImage: "url('bg_ricefield.png')",
        chain: ["rice", "crab", "duck", "python"],
        distractors: ["shark", "cactus"],
        names: {"rice": "ต้นข้าว", "crab": "ปูนา", "duck": "เป็ด", "python": "งูเหลือม"},
        message: "เป็ดไล่ทุ่งช่วยควบคุมปริมาณปูนาและศัตรูข้าวตามธรรมชาติ"
    },
    {
        id: 7,
        title: "Level 7: ทะเลทรายสุดร้อน",
        bgImage: "url('bg_desert.png')",
        chain: ["cactus", "beetle", "scorpion", "fennec"],
        distractors: ["polarbear", "seaweed"],
        names: {"cactus": "กระบองเพชร", "beetle": "ด้วงทะเลทราย", "scorpion": "แมงป่อง", "fennec": "จิ้งจอกเฟนเนก"},
        message: "สัตว์ทะเลทรายส่วนใหญ่ออกหากินตอนกลางคืนเพื่อหลีกเลี่ยงอากาศร้อนจัด"
    },
    {
        id: 8,
        title: "Level 8: ขั้วโลกหนาวจับใจ",
        bgImage: "url('bg_arctic.png')",
        chain: ["phytoplankton", "krill", "cod", "seal", "polarbear"],
        distractors: ["cactus", "crab"],
        names: {"phytoplankton": "แพลงก์ตอนพืช", "krill": "ตัวเคย", "cod": "ปลาค็อด", "seal": "แมวน้ำ", "polarbear": "หมีขั้วโลก"},
        message: "แม้ในทะเลน้ำแข็งที่หนาวจัด พลังงานก็ยังส่งต่อจากแพลงก์ตอนพืชไปถึงหมีขั้วโลก!"
    },
    {
        id: 9,
        title: "Level 9: ทุ่งหญ้าสะวันนา",
        bgImage: "url('bg_savanna.png')",
        chain: ["acacia", "giraffe", "lion", "vulture"],
        distractors: ["polarbear", "shrimp"],
        names: {"acacia": "ต้นอะคาเชีย", "giraffe": "ยีราฟ", "lion": "สิงโต", "vulture": "แร้ง"},
        message: "แร้งช่วยกินซากที่เหลือจากผู้ล่า ทำให้ทุ่งหญ้าสะวันนาสะอาดสมดุล"
    },
    {
        id: 10,
        title: "Level 10: สวนผักและวงจรดิน",
        bgImage: "url('bg_garden.png')",
        chain: ["cabbage", "snail", "myna", "cat", "earthworm"],
        distractors: ["scorpion", "cod"],
        names: {"cabbage": "กะหล่ำปลี", "snail": "หอยทาก", "myna": "นกเอี้ยง", "cat": "แมว", "earthworm": "ไส้เดือนดิน"},
        message: "ไส้เดือนดินช่วยย่อยสลายซากพืชซากสัตว์เป็นปุ๋ยกลับสู่ดิน ให้กะหล่ำปลีเติบโตต่อไป",
        isCycle: true
    }
];

function getRoleData(id, chainIndex = -1) {
    const producers = ["carrot", "grass", "seaweed", "leaf", "corn", "rice", "cactus", "phytoplankton", "acacia", "cabbage"];
    const decomposers = ["mushroom", "earthworm"];
    
    if (producers.includes(id)) {
        return { text: "ผู้ผลิต", shortText: "ผู้ผลิต", class: "role-producer" };
    } else if (decomposers.includes(id)) {
        return { text: "ผู้ย่อยสลาย", shortText: "ผู้ย่อยสลาย", class: "role-decomposer" };
    } else if (id === "vulture" && chainIndex > 0) {
        return {
            text: `ผู้กินซาก<span class="role-sub">ลำดับที่ ${chainIndex}</span>`,
            shortText: `ผู้กินซาก (ลำดับ ${chainIndex})`,
            class: "role-consumer"
        };
    } else if (chainIndex === 1) {
        return {
            text: `ผู้บริโภค<span class="role-sub">ลำดับที่ 1 (กินพืช)</span>`,
            shortText: "ผู้บริโภคลำดับที่ 1",
            class: "role-consumer"
        };
    } else if (chainIndex > 1) {
        return {
            text: `ผู้บริโภค<span class="role-sub">ลำดับที่ ${chainIndex}</span>`,
            shortText: `ผู้บริโภคลำดับที่ ${chainIndex}`,
            class: "role-consumer"
        };
    } else {
        return { text: "ผู้บริโภค", shortText: "ผู้บริโภค", class: "role-consumer" };
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
        
        "snake2": `<svg viewBox="0 0 100 100"><path d="M 20 80 Q 50 95 80 80 Q 95 60 80 40 Q 50 20 30 40 Q 15 60 30 70" fill="none" stroke="#8d6e63" stroke-width="15" stroke-linecap="round"/><path d="M 32 82 Q 55 91 78 78 M 82 45 Q 60 28 38 36" fill="none" stroke="#ffb74d" stroke-width="4" stroke-dasharray="4 6" stroke-linecap="round"/><circle cx="30" cy="70" r="15" fill="#8d6e63"/><path d="M 30 75 L 45 80 M 45 80 L 50 75 M 45 80 L 50 85" stroke="#f44336" stroke-width="2" fill="none"/>${face.replace(/40/g,'25').replace(/60/g,'35').replace(/45/g,'65')}</svg>`,
        
        "owl": `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="60" rx="30" ry="35" fill="#795548"/><ellipse cx="50" cy="65" rx="20" ry="25" fill="#d7ccc8"/><polygon points="20,25 35,35 45,20" fill="#795548"/><polygon points="80,25 65,35 55,20" fill="#795548"/><circle cx="35" cy="45" r="12" fill="#fff"/><circle cx="65" cy="45" r="12" fill="#fff"/><circle cx="35" cy="45" r="4" fill="#333"/><circle cx="65" cy="45" r="4" fill="#333"/><polygon points="45,50 55,50 50,60" fill="#ffb300"/><path d="M 40 95 L 40 100 M 60 95 L 60 100" stroke="#ffb300" stroke-width="4"/></svg>`,
        
        "corn": `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="20" ry="40" fill="#ffeb3b"/><path d="M 50 90 Q 20 60 10 30 Q 30 70 50 90 Z" fill="#81c784"/><path d="M 50 90 Q 80 60 90 30 Q 70 70 50 90 Z" fill="#4caf50"/>${face}</svg>`,
        
        "mouse": `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="65" rx="25" ry="20" fill="#9e9e9e"/><circle cx="35" cy="45" r="15" fill="#9e9e9e"/><circle cx="65" cy="45" r="15" fill="#9e9e9e"/><circle cx="35" cy="45" r="8" fill="#f48fb1"/><circle cx="65" cy="45" r="8" fill="#f48fb1"/><path d="M 75 65 Q 95 65 90 40" fill="none" stroke="#9e9e9e" stroke-width="4"/><circle cx="50" cy="55" r="3" fill="#333"/>${face.replace(/45/g,'55')}</svg>`,
        
        "hawk": `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="55" rx="25" ry="35" fill="#5d4037"/><path d="M 25 55 Q 10 40 5 60 Q 20 70 25 55 Z" fill="#8d6e63"/><path d="M 75 55 Q 90 40 95 60 Q 80 70 75 55 Z" fill="#8d6e63"/><circle cx="50" cy="30" r="18" fill="#5d4037"/><polygon points="45,30 65,30 55,45" fill="#ffca28"/><ellipse cx="50" cy="65" rx="15" ry="20" fill="#d7ccc8"/><path d="M 40 90 L 35 100 M 60 90 L 65 100" stroke="#ffca28" stroke-width="4"/>${face.replace(/45/g,'25')}</svg>`,
        
        "mushroom": `<svg viewBox="0 0 100 100"><path d="M 40 50 L 40 90 Q 50 95 60 90 L 60 50 Z" fill="#ffe082"/><path d="M 10 50 Q 50 0 90 50 Z" fill="#f44336"/><circle cx="30" cy="35" r="8" fill="#fff"/><circle cx="50" cy="20" r="6" fill="#fff"/><circle cx="70" cy="40" r="10" fill="#fff"/>${face.replace(/45/g,'70')}</svg>`,

        "rice": `<svg viewBox="0 0 100 100"><path d="M 50 90 Q 45 55 30 30 M 50 90 Q 52 50 50 20 M 50 90 Q 60 55 72 32" stroke="#7cb342" stroke-width="5" stroke-linecap="round" fill="none"/><ellipse cx="26" cy="34" rx="7" ry="12" fill="#ffca28" transform="rotate(-35 26 34)"/><ellipse cx="50" cy="22" rx="7" ry="13" fill="#ffd54f"/><ellipse cx="75" cy="36" rx="7" ry="12" fill="#ffca28" transform="rotate(35 75 36)"/><ellipse cx="50" cy="65" rx="18" ry="14" fill="#aed581"/>${face.replace(/45/g,'65').replace(/52/g,'72').replace(/58/g,'77').replace(/48/g,'68')}</svg>`,

        "crab": `<svg viewBox="0 0 100 100"><path d="M 28 60 L 12 54 M 26 68 L 10 70 M 30 76 L 16 84 M 72 60 L 88 54 M 74 68 L 90 70 M 70 76 L 84 84" stroke="#e53935" stroke-width="5" stroke-linecap="round"/><path d="M 32 45 Q 20 30 24 18" stroke="#e53935" stroke-width="5" fill="none"/><circle cx="24" cy="18" r="9" fill="#ef5350"/><path d="M 68 45 Q 80 30 76 18" stroke="#e53935" stroke-width="5" fill="none"/><circle cx="76" cy="18" r="9" fill="#ef5350"/><ellipse cx="50" cy="62" rx="28" ry="20" fill="#ff5252"/>${face.replace(/45/g,'60').replace(/52/g,'67').replace(/58/g,'72').replace(/48/g,'63')}</svg>`,

        "duck": `<svg viewBox="0 0 100 100"><ellipse cx="52" cy="65" rx="28" ry="22" fill="#fffde7"/><circle cx="44" cy="36" r="18" fill="#fff9c4"/><polygon points="26,36 10,41 28,45" fill="#ff9800"/><ellipse cx="62" cy="65" rx="14" ry="9" fill="#fff59d" transform="rotate(-15 62 65)"/><path d="M 42 86 L 40 95 M 60 86 L 62 95" stroke="#ff9800" stroke-width="4" stroke-linecap="round"/>${face.replace(/40/g,'37').replace(/60/g,'51').replace(/45/g,'34').replace(/52/g,'41').replace(/58/g,'45').replace(/32/g,'30').replace(/68/g,'57').replace(/48/g,'38')}</svg>`,

        "python": `<svg viewBox="0 0 100 100"><path d="M 20 82 Q 50 94 78 78 Q 92 58 78 38 Q 52 20 32 38 Q 16 56 32 68" fill="none" stroke="#a1887f" stroke-width="15" stroke-linecap="round"/><path d="M 26 84 Q 52 92 76 78 M 78 40 Q 56 26 36 38" fill="none" stroke="#5d4037" stroke-width="6" stroke-dasharray="5 7" stroke-linecap="round"/><circle cx="32" cy="68" r="15" fill="#a1887f"/><path d="M 32 76 L 46 82 M 46 82 L 51 78 M 46 82 L 51 86" stroke="#f44336" stroke-width="2" fill="none"/>${face.replace(/40/g,'27').replace(/60/g,'37').replace(/45/g,'64').replace(/52/g,'71').replace(/58/g,'75').replace(/48/g,'67')}</svg>`,

        "cactus": `<svg viewBox="0 0 100 100"><rect x="38" y="20" width="24" height="70" rx="12" fill="#4caf50"/><path d="M 38 56 L 24 56 Q 18 56 18 46 L 18 38" stroke="#4caf50" stroke-width="12" stroke-linecap="round" fill="none"/><path d="M 62 50 L 76 50 Q 82 50 82 40 L 82 32" stroke="#4caf50" stroke-width="12" stroke-linecap="round" fill="none"/><circle cx="50" cy="18" r="7" fill="#f48fb1"/><circle cx="50" cy="18" r="3" fill="#ffeb3b"/>${face.replace(/40/g,'44').replace(/60/g,'56').replace(/45/g,'44').replace(/52/g,'51').replace(/58/g,'55').replace(/48/g,'48')}</svg>`,

        "beetle": `<svg viewBox="0 0 100 100"><path d="M 26 52 L 14 44 M 24 64 L 10 64 M 28 76 L 16 84 M 74 52 L 86 44 M 76 64 L 90 64 M 72 76 L 84 84" stroke="#4a148c" stroke-width="4" stroke-linecap="round"/><path d="M 42 22 Q 34 10 26 14 M 58 22 Q 66 10 74 14" stroke="#4a148c" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="50" cy="58" rx="26" ry="30" fill="#7b1fa2"/><path d="M 50 40 L 50 88" stroke="#4a148c" stroke-width="3"/><circle cx="50" cy="32" r="16" fill="#6a1b9a"/>${face.replace(/45/g,'32').replace(/52/g,'39').replace(/58/g,'44').replace(/48/g,'35')}</svg>`,

        "scorpion": `<svg viewBox="0 0 100 100"><path d="M 66 64 Q 88 58 88 36 Q 86 18 70 18" stroke="#ff7043" stroke-width="8" stroke-linecap="round" fill="none"/><polygon points="70,12 60,20 72,24" fill="#d84315"/><path d="M 32 48 Q 16 38 18 24 M 64 48 Q 74 36 68 26" stroke="#ff7043" stroke-width="6" stroke-linecap="round" fill="none"/><ellipse cx="46" cy="64" rx="22" ry="18" fill="#ff7043"/><path d="M 30 74 L 20 84 M 42 78 L 38 90 M 54 78 L 58 90" stroke="#e64a19" stroke-width="4" stroke-linecap="round"/>${face.replace(/40/g,'38').replace(/60/g,'52').replace(/45/g,'60').replace(/52/g,'67').replace(/58/g,'71').replace(/48/g,'63')}</svg>`,

        "fennec": `<svg viewBox="0 0 100 100"><polygon points="18,10 38,34 20,48" fill="#ffcc80"/><polygon points="22,16 35,34 22,42" fill="#f48fb1"/><polygon points="82,10 62,34 80,48" fill="#ffcc80"/><polygon points="78,16 65,34 78,42" fill="#f48fb1"/><ellipse cx="50" cy="72" rx="22" ry="18" fill="#ffe0b2"/><circle cx="50" cy="48" r="22" fill="#ffe0b2"/><ellipse cx="50" cy="54" rx="14" ry="10" fill="#fff8e1"/><circle cx="50" cy="50" r="3" fill="#3e2723"/>${face.replace(/45/g,'44').replace(/52/g,'55').replace(/58/g,'59')}</svg>`,

        "phytoplankton": `<svg viewBox="0 0 100 100"><polygon points="50,8 61,32 88,35 68,54 74,82 50,68 26,82 32,54 12,35 39,32" fill="#66bb6a" stroke="#2e7d32" stroke-width="3" stroke-linejoin="round"/><circle cx="50" cy="50" r="20" fill="#a5d6a7"/>${face}</svg>`,

        "krill": `<svg viewBox="0 0 100 100"><path d="M 74 34 C 92 50 86 78 50 78 C 30 78 22 60 32 42" fill="none" stroke="#ffab91" stroke-width="14" stroke-linecap="round"/><path d="M 32 42 L 12 32 M 32 44 L 14 48 M 44 76 L 38 90 M 54 76 L 52 90 M 64 72 L 66 86" stroke="#ff7043" stroke-width="3" stroke-linecap="round"/>${face.replace(/40/g,'28').replace(/60/g,'40').replace(/45/g,'48').replace(/52/g,'55').replace(/58/g,'59')}</svg>`,

        "cod": `<svg viewBox="0 0 100 100"><ellipse cx="48" cy="52" rx="32" ry="20" fill="#90caf9"/><polygon points="78,52 95,36 95,68" fill="#64b5f6"/><polygon points="44,32 54,18 62,33" fill="#64b5f6"/><ellipse cx="48" cy="58" rx="22" ry="10" fill="#e3f2fd"/>${face.replace(/40/g,'28').replace(/60/g,'44').replace(/45/g,'48').replace(/52/g,'55').replace(/58/g,'59')}</svg>`,

        "seal": `<svg viewBox="0 0 100 100"><ellipse cx="52" cy="68" rx="30" ry="20" fill="#cfd8dc"/><circle cx="46" cy="40" r="22" fill="#eceff1"/><ellipse cx="26" cy="74" rx="12" ry="7" fill="#b0bec5" transform="rotate(-20 26 74)"/><ellipse cx="76" cy="74" rx="12" ry="7" fill="#b0bec5" transform="rotate(20 76 74)"/><circle cx="46" cy="44" r="3" fill="#37474f"/>${face.replace(/40/g,'37').replace(/60/g,'55').replace(/45/g,'37').replace(/52/g,'47').replace(/58/g,'52')}</svg>`,

        "polarbear": `<svg viewBox="0 0 100 100"><circle cx="30" cy="26" r="10" fill="#ffffff" stroke="#cfd8dc" stroke-width="2"/><circle cx="70" cy="26" r="10" fill="#ffffff" stroke="#cfd8dc" stroke-width="2"/><ellipse cx="50" cy="72" rx="28" ry="20" fill="#ffffff"/><circle cx="50" cy="46" r="24" fill="#ffffff" stroke="#eceff1" stroke-width="2"/><ellipse cx="50" cy="52" rx="11" ry="8" fill="#eceff1"/><circle cx="50" cy="49" r="3.5" fill="#263238"/>${face.replace(/45/g,'42').replace(/52/g,'54').replace(/58/g,'58')}</svg>`,

        "acacia": `<svg viewBox="0 0 100 100"><path d="M 46 92 L 46 48 L 30 34 M 54 92 L 54 48 L 70 34" stroke="#795548" stroke-width="7" stroke-linecap="round" fill="none"/><ellipse cx="50" cy="32" rx="38" ry="16" fill="#66bb6a"/><ellipse cx="34" cy="24" rx="20" ry="11" fill="#81c784"/><ellipse cx="66" cy="24" rx="20" ry="11" fill="#81c784"/>${face.replace(/45/g,'30').replace(/52/g,'37').replace(/58/g,'41').replace(/48/g,'33')}</svg>`,

        "giraffe": `<svg viewBox="0 0 100 100"><rect x="40" y="42" width="20" height="48" rx="8" fill="#ffd54f"/><circle cx="46" cy="64" r="4" fill="#8d6e63"/><circle cx="54" cy="78" r="4" fill="#8d6e63"/><line x1="42" y1="18" x2="40" y2="10" stroke="#8d6e63" stroke-width="3"/><line x1="58" y1="18" x2="60" y2="10" stroke="#8d6e63" stroke-width="3"/><circle cx="40" cy="10" r="3" fill="#8d6e63"/><circle cx="60" cy="10" r="3" fill="#8d6e63"/><ellipse cx="50" cy="34" rx="18" ry="16" fill="#ffe082"/>${face.replace(/40/g,'42').replace(/60/g,'58').replace(/45/g,'32').replace(/52/g,'39').replace(/58/g,'43').replace(/48/g,'35')}</svg>`,

        "lion": `<svg viewBox="0 0 100 100"><circle cx="50" cy="48" r="34" fill="#ef6c00"/><circle cx="30" cy="24" r="8" fill="#ffa726"/><circle cx="70" cy="24" r="8" fill="#ffa726"/><circle cx="50" cy="50" r="22" fill="#ffcc80"/><polygon points="46,52 54,52 50,57" fill="#5d4037"/>${face.replace(/45/g,'44').replace(/52/g,'58').replace(/58/g,'62')}</svg>`,

        "vulture": `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="64" rx="26" ry="24" fill="#4e342e"/><ellipse cx="50" cy="66" rx="16" ry="18" fill="#795548"/><path d="M 38 44 Q 50 38 62 44" stroke="#eceff1" stroke-width="8" stroke-linecap="round"/><circle cx="50" cy="30" r="15" fill="#f8bbd0"/><polygon points="44,30 30,36 46,38" fill="#ffca28"/>${face.replace(/45/g,'26').replace(/52/g,'33').replace(/58/g,'37').replace(/48/g,'29')}</svg>`,

        "cabbage": `<svg viewBox="0 0 100 100"><circle cx="50" cy="54" r="34" fill="#66bb6a"/><circle cx="34" cy="56" r="22" fill="#81c784"/><circle cx="66" cy="56" r="22" fill="#81c784"/><circle cx="50" cy="52" r="24" fill="#a5d6a7"/>${face.replace(/45/g,'50').replace(/52/g,'57').replace(/58/g,'62').replace(/48/g,'53')}</svg>`,

        "snail": `<svg viewBox="0 0 100 100"><path d="M 16 78 Q 50 86 86 76 Q 90 66 76 66 L 26 68 Q 14 70 16 78 Z" fill="#ffe0b2"/><circle cx="48" cy="52" r="24" fill="#ff9800"/><path d="M 48 52 m -14 0 a 14 14 0 1 0 28 0 a 10 10 0 1 0 -20 0" fill="none" stroke="#e65100" stroke-width="4" stroke-linecap="round"/><line x1="72" y1="68" x2="76" y2="54" stroke="#ffcc80" stroke-width="3"/><line x1="80" y1="68" x2="86" y2="54" stroke="#ffcc80" stroke-width="3"/><circle cx="76" cy="54" r="3" fill="#333"/><circle cx="86" cy="54" r="3" fill="#333"/>${face.replace(/40/g,'68').replace(/60/g,'80').replace(/45/g,'72').replace(/52/g,'76').replace(/58/g,'80').replace(/48/g,'74')}</svg>`,

        "myna": `<svg viewBox="0 0 100 100"><ellipse cx="52" cy="60" rx="26" ry="22" fill="#37474f"/><circle cx="44" cy="36" r="18" fill="#263238"/><ellipse cx="38" cy="34" rx="7" ry="5" fill="#ffeb3b"/><polygon points="26,36 12,40 28,44" fill="#ffca28"/><path d="M 44 82 L 42 94 M 58 82 L 60 94" stroke="#ffca28" stroke-width="4" stroke-linecap="round"/><circle cx="38" cy="34" r="3" fill="#111"/><circle cx="52" cy="34" r="3" fill="#111"/>${face.replace(/40/g,'38').replace(/60/g,'52').replace(/45/g,'34').replace(/52/g,'42').replace(/58/g,'46').replace(/48/g,'38')}</svg>`,

        "cat": `<svg viewBox="0 0 100 100"><polygon points="28,40 24,14 44,28" fill="#ffb74d"/><polygon points="72,40 76,14 56,28" fill="#ffb74d"/><ellipse cx="50" cy="72" rx="24" ry="20" fill="#ffb74d"/><circle cx="50" cy="46" r="22" fill="#ffcc80"/><path d="M 22 46 L 34 48 M 22 52 L 34 52 M 78 46 L 66 48 M 78 52 L 66 52" stroke="#8d6e63" stroke-width="2" stroke-linecap="round"/><polygon points="47,49 53,49 50,53" fill="#f48fb1"/>${face.replace(/45/g,'44').replace(/52/g,'55').replace(/58/g,'59')}</svg>`,

        "earthworm": `<svg viewBox="0 0 100 100"><path d="M 16 70 Q 32 45 50 65 Q 68 85 84 55" fill="none" stroke="#f48fb1" stroke-width="18" stroke-linecap="round"/><path d="M 28 58 L 32 64 M 44 59 L 42 66 M 62 72 L 65 65" stroke="#ec407a" stroke-width="3" stroke-linecap="round"/>${face.replace(/40/g,'74').replace(/60/g,'84').replace(/45/g,'52').replace(/52/g,'59').replace(/58/g,'63').replace(/32/g,'70').replace(/68/g,'88').replace(/48/g,'55')}</svg>`
    };
    return svgs[id] || svgs["leaf"];
}

// --- Audio System ---
let audioCtx = null;
try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
} catch(e) {}
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

function playTone(freq, type = 'sine', duration = 0.1, slide = false, isBGM = false) {
    if (!audioCtx) return;
    if (!isBGM && !isSfxEnabled) return;
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

    gainNode.gain.setValueAtTime(isBGM ? 0.06 : 0.1, audioCtx.currentTime);
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
    if (!isMusicPlaying || !audioCtx) return;
    if (audioCtx.currentTime >= nextNoteTime) {
        let note = bgmNotes[currentNote];
        playTone(note.f, 'triangle', note.d * 0.8, false, true);
        nextNoteTime = audioCtx.currentTime + note.d;
        currentNote = (currentNote + 1) % bgmNotes.length;
    }
}

function toggleMusic() {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    isMusicPlaying = !isMusicPlaying;
    const btn = document.getElementById('btn-music');
    clearInterval(bgmInterval);
    bgmInterval = null;
    if (isMusicPlaying) {
        if (btn) btn.style.opacity = 1;
        nextNoteTime = audioCtx.currentTime + 0.1;
        bgmInterval = setInterval(playBGMStep, 50);
    } else {
        if (btn) btn.style.opacity = 0.5;
    }
}

function toggleSfx() {
    isSfxEnabled = !isSfxEnabled;
    const btn = document.getElementById('btn-sfx');
    if (btn) {
        btn.innerText = isSfxEnabled ? '🔊' : '🔇';
        btn.style.opacity = isSfxEnabled ? 1 : 0.5;
    }
    if (!isSfxEnabled) {
        stopTTS();
    } else {
        playTone(659.25, 'sine', 0.08);
    }
}

// --- Game State ---
let gameMode = 'practice'; // 'practice' | 'challenge'
let currentLevelIndex = 0;
let score = 0;
let levelStartTime = 0;
let currentStepIndex = 0;
let levelMistakes = 0;
let totalMistakes = 0;
let sessionStars = 0;

function loadProgress() {
    try {
        const parsed = JSON.parse(localStorage.getItem('foodChainProgress') || '{}');
        return {
            starsByLevel: parsed.starsByLevel || {},
            bestScore: parsed.bestScore || 0
        };
    } catch (e) {
        return { starsByLevel: {}, bestScore: 0 };
    }
}
let levelProgress = loadProgress();

// --- DOM Elements ---
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const victoryScreen = document.getElementById('victory-screen');
const cardInventory = document.getElementById('card-inventory');
const bgLayer = document.getElementById('bg-layer');
const levelCompleteModal = document.getElementById('level-complete-modal');

// --- Initialization ---
const btnMusicEl = document.getElementById('btn-music');
if (btnMusicEl) btnMusicEl.style.opacity = '0.5';

const decors = ['rabbit', 'frog', 'bird', 'shark', 'owl', 'carrot'];
decors.forEach((animal, i) => {
    const el = document.getElementById(`decor-${i+1}`);
    if(el) el.innerHTML = getAnimalHTML(animal);
});

function setGameMode(mode) {
    gameMode = mode;
    document.querySelectorAll('.mode-pill').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    const modeLabel = document.getElementById('level-select-mode-label');
    if (modeLabel) {
        modeLabel.innerText = mode === 'challenge'
            ? 'โหมดปัจจุบัน: 🔥 โหมดทดสอบ'
            : 'โหมดปัจจุบัน: 🌱 โหมดฝึกหัด';
    }
}

document.querySelectorAll('.mode-pill').forEach(btn => {
    btn.addEventListener('click', () => setGameMode(btn.dataset.mode));
});

function startSession(levelIndex = 0) {
    stopHintTimer();
    stopTTS();
    score = 0;
    totalMistakes = 0;
    sessionStars = 0;
    currentLevelIndex = levelIndex;
    document.getElementById('score-text').innerText = score;
    document.getElementById('modal-level-select').classList.add('hidden');
    startScreen.classList.remove('active');
    startScreen.classList.add('hidden');
    victoryScreen.classList.remove('active');
    victoryScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    gameScreen.classList.add('active');
    unlockAudio();
    loadLevel();
}

function renderLevelSelect() {
    const grid = document.getElementById('level-select-grid');
    if (!grid) return;
    grid.innerHTML = '';
    setGameMode(gameMode);

    levels.forEach((lvl, idx) => {
        const earned = levelProgress.starsByLevel[lvl.id] || 0;
        const starStr = '⭐'.repeat(earned) + '☆'.repeat(3 - earned);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'level-select-card';
        btn.innerHTML = `
            <div class="level-select-title">${lvl.title}</div>
            <div class="level-select-stars" title="สถิติดาวสูงสุด: ${earned}/3">${starStr}</div>
        `;
        btn.addEventListener('click', () => startSession(idx));
        grid.appendChild(btn);
    });
}

document.getElementById('btn-start').addEventListener('click', () => startSession(0));
document.getElementById('btn-level-select').addEventListener('click', () => {
    renderLevelSelect();
    document.getElementById('modal-level-select').classList.remove('hidden');
});
document.getElementById('btn-close-level-select').addEventListener('click', () => {
    document.getElementById('modal-level-select').classList.add('hidden');
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
    stopTTS();
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
    stopTTS();
    gameScreen.classList.remove('active');
    gameScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    startScreen.classList.add('active');
});
document.getElementById('owl-hint').addEventListener('click', () => {
    resetHintTimer();
});
document.getElementById('btn-toggle-aspect').addEventListener('click', () => {
    document.body.classList.toggle('aspect-16-9');
});
document.getElementById('btn-sfx').addEventListener('click', toggleSfx);
document.getElementById('btn-music').addEventListener('click', toggleMusic);
document.getElementById('btn-play-again').addEventListener('click', () => startSession(0));
document.getElementById('btn-victory-home').addEventListener('click', () => {
    stopHintTimer();
    stopTTS();
    score = 0;
    totalMistakes = 0;
    sessionStars = 0;
    currentLevelIndex = 0;
    document.getElementById('score-text').innerText = score;
    victoryScreen.classList.remove('active');
    victoryScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    startScreen.classList.add('active');
});
document.getElementById('btn-next-level').addEventListener('click', () => {
    levelCompleteModal.classList.add('hidden');
    currentLevelIndex++;
    loadLevel();
});

// --- Level Loading ---
function loadLevel() {
    stopTTS();
    if (currentLevelIndex >= levels.length) {
        showVictory();
        return;
    }
    const level = levels[currentLevelIndex];
    levelStartTime = Date.now();
    currentStepIndex = 0;
    levelMistakes = 0;
    
    // Apply background image instead of just solid color
    bgLayer.style.backgroundImage = level.bgImage;
    
    document.getElementById('level-indicator').innerText = gameMode === 'challenge'
        ? `${level.title} (ทดสอบ)`
        : level.title;
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
        curvedArrow.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><marker id="cycle-arrowhead" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto"><polygon points="0,1 9,5 0,9" fill="#2196f3" /></marker></defs><path d="M 90 10 Q 50 95 10 10" marker-end="url(#cycle-arrowhead)" /></svg>`;
        dropZonesContainer.appendChild(curvedArrow);
    }

    // Populate Inventory (shuffled; add distractors in challenge mode)
    const animalPool = gameMode === 'challenge'
        ? [...level.chain, ...(level.distractors || [])]
        : [...level.chain];
    const shuffledCards = animalPool.sort(() => Math.random() - 0.5);
    shuffledCards.forEach(itemId => {
        const card = document.createElement('div');
        card.className = 'card animal-card breathe';
        card.dataset.id = itemId;
        card.dataset.type = 'animal';
        const chainIndex = level.chain.indexOf(itemId);
        const roleData = getRoleData(itemId, chainIndex);
        const displayName = level.names[itemId] || levelDataNames[itemId] || itemId;
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front">
                    ${getAnimalHTML(itemId)}
                    <div class="card-label">${displayName}</div>
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

    cardInventory.classList.toggle('many-cards', cardInventory.children.length > 10);
    
    highlightCurrentZone();
    resetHintTimer();
}

function highlightCurrentZone() {
    document.querySelectorAll('.drop-zone, .arrow-zone').forEach(zone => {
        zone.classList.remove('active-zone');
        if (gameMode === 'practice' && parseInt(zone.dataset.stepIndex) === currentStepIndex) {
            zone.classList.add('active-zone');
        }
    });
}

// --- Drag and Drop / Flip Logic ---
function setupDraggable(el) {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    function resetDraggedCard(withFailFeedback) {
        if (withFailFeedback) {
            playFail();
            el.classList.add('shake');
            setTimeout(() => el.classList.remove('shake'), 400);
        }
        el.style.transition = 'all 0.3s ease';
        el.style.position = 'relative';
        el.style.left = '0px';
        el.style.top = '0px';
        el.style.margin = '';
        setTimeout(() => {
            el.style.transition = '';
            if (!el.classList.contains('filled') && el.dataset.type === 'animal') {
                el.classList.add('breathe');
            }
        }, 300);
    }

    // Flip logic using native single click event (allowed immediately once placed)
    el.addEventListener('click', (e) => {
        if (!el.classList.contains('filled')) return;
        if (el.dataset.type === 'arrow') return;
        if (el.parentElement && el.parentElement.id === 'card-inventory') return; // Restrict flip in inventory
        
        if (el.classList.contains('flipped')) {
            el.classList.remove('flipped');
        } else {
            el.classList.add('flipped');
        }
        createParticles(e.clientX, e.clientY);
        playSuccess();
    });

    el.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (el.classList.contains('filled')) return;
        if (el.classList.contains('flipped')) return; // Prevent drag while flipped
        
        resetHintTimer();
        
        isDragging = true;
        el.classList.add('dragging');
        el.classList.remove('breathe');
        el.style.transition = '';
        
        const rect = el.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = rect.left;
        initialTop = rect.top;
        
        el.style.position = 'fixed';
        el.style.left = initialLeft + 'px';
        el.style.top = initialTop + 'px';
        el.style.margin = '0';
        
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

    el.addEventListener('pointercancel', (e) => {
        if (!isDragging) return;
        isDragging = false;
        el.classList.remove('dragging');
        if (el.hasPointerCapture(e.pointerId)) {
            el.releasePointerCapture(e.pointerId);
        }
        document.querySelectorAll('.hovered').forEach(z => z.classList.remove('hovered'));
        resetDraggedCard(false);
        resetHintTimer();
    });

    el.addEventListener('pointerup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        el.classList.remove('dragging');
        if (el.hasPointerCapture(e.pointerId)) {
            el.releasePointerCapture(e.pointerId);
        }

        let dropped = false;
        const targetSelector = el.dataset.type === 'animal' ? '.animal-zone' : '.arrow-zone';
        const zones = document.querySelectorAll(targetSelector);
        
        for (let zone of zones) {
            zone.classList.remove('hovered');
            if (!zone.classList.contains('filled') && isOverlapping(el, zone)) {
                // In practice mode, enforce sequential step; in challenge mode allow any matching zone
                if (gameMode === 'practice' && parseInt(zone.dataset.stepIndex) !== currentStepIndex) {
                    continue;
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
                    if (!checkLevelComplete()) {
                        resetHintTimer();
                    }
                    break;
                }
            }
        }

        if (!dropped) {
            levelMistakes++;
            totalMistakes++;
            resetDraggedCard(true);
            resetHintTimer();
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
    card.style.margin = '';
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
        return true;
    }
    return false;
}

// Check Score Button Event
document.getElementById('btn-check-score').addEventListener('click', () => {
    document.getElementById('btn-check-score').classList.add('hidden');
    
    const level = levels[currentLevelIndex];
    const totalDrops = level.chain.length * 2 - 1;
    const threeStarTime = totalDrops * 3;
    const twoStarTime = totalDrops * 6;
    let stars = 1;
    let starMsg = "พยายามได้ดีมาก!";
    if (savedTimeTaken <= threeStarTime) {
        stars = 3;
        starMsg = "ยอดเยี่ยม! เร็วสุด ๆ เลย!";
        speakTTS("ยอดเยี่ยม! เร็วสุด ๆ เลย!");
    } else if (savedTimeTaken <= twoStarTime) {
        stars = 2;
        starMsg = "เก่งมากเลย!";
        speakTTS("เก่งมากเลย!");
    } else {
        speakTTS("พยายามได้ดีมาก!");
    }

    if (levelMistakes === 0) {
        score += 20;
        document.getElementById('score-text').innerText = score;
        starMsg += `<br><span style="font-size: 1rem; color: #ff7043;">🏆 โบนัสไม่พลาดเลย +20 คะแนน!</span>`;
    }

    sessionStars += stars;
    levelProgress.starsByLevel[level.id] = Math.max(levelProgress.starsByLevel[level.id] || 0, stars);
    levelProgress.bestScore = Math.max(levelProgress.bestScore || 0, score);
    localStorage.setItem('foodChainProgress', JSON.stringify(levelProgress));

    // Add Educational Message if exists
    if (level.message) {
        starMsg += `<br><br><span style="font-size: 1rem; color: #4caf50;">💡 ${level.message}</span>`;
    }

    document.getElementById('time-text').innerText = `ใช้เวลาไป: ${savedTimeTaken} วินาที • วางพลาด: ${levelMistakes} ครั้ง`;
    document.getElementById('star-message').innerHTML = starMsg;

    // Render completed food chain role summary
    const summaryEl = document.getElementById('level-role-summary');
    if (summaryEl) {
        summaryEl.innerHTML = level.chain.map((id, idx) => {
            const roleData = getRoleData(id, idx);
            const name = level.names[id] || levelDataNames[id] || id;
            const chip = `<span class="role-chip ${roleData.class}">${name}<small>${roleData.shortText}</small></span>`;
            return idx < level.chain.length - 1 ? `${chip}<span class="role-chip-arrow">➡️</span>` : chip;
        }).join('');
    }
    
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
    stopHintTimer();
    gameScreen.classList.remove('active');
    gameScreen.classList.add('hidden');
    victoryScreen.classList.remove('hidden');
    victoryScreen.classList.add('active');
    
    let allMascots = '';
    levels.forEach(lvl => lvl.chain.forEach(id => {
        allMascots += `<div class="card">${getAnimalHTML(id)}</div>`;
    }));
    document.getElementById('victory-mascots').innerHTML = allMascots;

    const totalSavedStars = Object.values(levelProgress.starsByLevel).reduce((sum, s) => sum + s, 0);
    const maxStars = levels.length * 3;
    const statsEl = document.getElementById('victory-stats');
    if (statsEl) {
        statsEl.innerHTML = `
            <div class="victory-stat-pill">🏆 คะแนนรอบนี้: ${score}</div>
            <div class="victory-stat-pill">⭐ ดาวรอบนี้: ${sessionStars} (สะสมรวม ${totalSavedStars}/${maxStars})</div>
            <div class="victory-stat-pill">🎯 วางพลาดรวม: ${totalMistakes} ครั้ง</div>
        `;
    }

    const victoryStarsEl = document.getElementById('victory-stars');
    if (victoryStarsEl) {
        const starRatio = sessionStars > 0 ? Math.min(3, Math.max(1, Math.ceil((sessionStars / maxStars) * 3))) : 1;
        victoryStarsEl.innerHTML = [0, 1, 2].map(i => {
            const cls = i < starRatio ? 'star-big bounce' : 'star-big star-empty';
            return `<span class="${cls}" style="animation-delay: ${i * 0.2}s">⭐</span>`;
        }).join('');
    }
    
    startConfetti();
}

function startConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    const resizeCanvas = () => {
        canvas.width = victoryScreen.clientWidth || window.innerWidth;
        canvas.height = victoryScreen.clientHeight || window.innerHeight;
    };
    resizeCanvas();
    
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
    
    window.addEventListener('resize', resizeCanvas);

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
        } else {
            window.removeEventListener('resize', resizeCanvas);
        }
    }
    render();
}
