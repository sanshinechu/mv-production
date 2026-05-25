import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc as firestoreDoc,
  initializeFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
  firebaseConfig,
  firestoreDatabaseId
} from "./firebase-config.js";

const steps = [
  {
    id: "Step_01",
    title: "構思歌詞和曲風",
    purpose: "產生一首適合用 Suno 生成音樂的歌詞，並同時產出可貼到 Suno 的英文 Style 描述。",
    inputs: ["主題", "曲風", "情緒", "語言", "男聲、女聲或合唱"],
    tools: ["ChatGPT", "Suno"],
    outputs: ["完整歌詞", "歌曲段落標籤", "Suno Style 英文描述"],
    prompt: `你是一位經驗豐富的專業詞曲創作人，請根據我提供的【主題】完成以下兩個任務。

任務一：創作一首適合用在 Suno 生成音樂的歌詞。

請在歌詞的每個段落前使用方括號標示歌曲結構，例如：
[Verse]
[Pre-Chorus]
[Chorus]
[Bridge]
[Outro]

如有需要，可在方括號內加入情緒、人聲、樂器等標籤，並用逗號分隔，例如：
[Chorus, sad, soft piano, female vocal]

歌詞內可使用圓括號加入隨興人聲，例如：
(耶 ~)
(喔 ~ Baby)
(啦啦啦 ~)

任務二：根據主題和曲風，為這首歌寫一段可用於 Suno 的英文 Style 描述。

Style 撰寫規則：
1. 使用英文撰寫。
2. 使用完整句子，不要條列。
3. 詳細說明節奏、律動、樂器、人聲、情緒與整體氛圍。

【主題】：
【曲風】：
【情緒】：
【語言】：
【人聲設定】：`
  },
  {
    id: "Step_02",
    title: "主角設計",
    purpose: "根據歌曲內容設計 MV 主角，產出可用於 AI 生圖工具的角色提示詞。",
    inputs: ["性別", "曲風", "歌詞", "年齡感", "個性氣質"],
    tools: ["ChatGPT", "Gemini", "Midjourney", "Leonardo AI"],
    outputs: ["英文影像提示詞", "中文翻譯", "主角外觀設定", "Split Screen 角色設計圖"],
    prompt: `你是一位經驗豐富的影視項目創意總監與角色造型設計師。

請根據我提供的【性別】、【曲風】和【歌詞】，設計一個 MV 的主角造型，並產出英文影像提示詞與中文翻譯。

構思角色時，請包含以下要素：
1. 種族：東亞 East Asian。
2. 髮型：例如黑色短髮、挑染狼尾頭、隨性長卷髮等。
3. 穿著：描述服裝風格、材質與主要單品。
4. 氣質：描述角色的氛圍或性格。

圖片生成要求：
- Split Screen，垂直分割畫面。
- 柔和攝影棚燈光。
- 簡單單色背景。
- 左側畫面：主角臉部特寫 Close-up Portrait，五官清楚，雙眼注視鏡頭。
- 右側畫面：主角全身照 Full-body Shot，完整呈現身形、服裝與姿態。

【性別】：
【曲風】：
【歌詞】：`
  },
  {
    id: "Step_03",
    title: "場景提示詞設計",
    purpose: "把歌曲概念、歌詞段落或參考圖片，轉換成更完整的圖片生成提示詞。",
    inputs: ["概念", "歌詞段落", "主角圖", "場景想法", "情緒氛圍"],
    tools: ["ChatGPT", "Gemini", "Midjourney", "Leonardo AI"],
    outputs: ["中文影像提示詞", "生圖提示詞", "分鏡畫面描述"],
    prompt: `你是一位擅長視覺敘事與情感鋪陳的 MV 導演。

請依據我提供的【概念】或圖片，生成一段中文影像提示詞。提示詞即可，不需要生成圖片。

請包含以下內容：
1. 主題：視覺焦點、角色表情、姿勢、情緒、服裝與道具細節。
2. 構圖：主體比例與位置、相機視角、畫面平衡與留白。
3. 場景：背景環境、光照、霧氣、水滴、煙霧等細節。
4. 風格：整體藝術風格、色彩搭配、材質質感。
5. 鏡頭：鏡頭焦段與景深，例如 50mm f/1.8、淺景深、電影感散景。

【概念】：`
  },
  {
    id: "Step_04",
    title: "九宮格多角度設計圖",
    purpose: "把主角和場景延伸成 9 張不同角度的分鏡圖，建立 MV 的視覺節奏。",
    inputs: ["主角圖片", "MV 主題", "場景設定", "歌曲情緒"],
    tools: ["Gemini", "ChatGPT", "圖片生成工具"],
    outputs: ["3 x 3 九宮格分鏡圖", "多種景別與視角", "可截取放大的候選畫面"],
    prompt: `你是一位資深的 MV 創意總監。

請根據我上傳的圖片生成一張專業的 MV 九宮格分鏡圖。

請先詢問我這支 MV 的【主題】，再開始設計。

這 9 張圖必須維持高度視覺一致性，確保是同一位主角、同一套造型、同一個 MV 世界觀。

每一個圖格請靈活運用不同鏡頭和視角，讓畫面有節奏感。請盡可能涵蓋：
1. 廣闊視野：大遠景 Extreme Long Shot、全身鏡頭 Full Shot。
2. 敘事中景：腰上中景 Medium Shot、胸上近景 Medium Close-Up。
3. 情緒特寫：臉部特寫 Close-Up、微距鏡頭 Macro Detail。
4. 戲劇角度：低角度仰拍 Low Angle、高角度俯拍 High Angle。`
  },
  {
    id: "Step_05",
    title: "截取九宮格影像並放大",
    purpose: "從九宮格中挑出最好的單張分鏡，放大成可以拿去做圖生影片的高畫質圖片。",
    inputs: ["九宮格圖片", "Row 編號", "Column 編號"],
    tools: ["圖片編輯工具", "AI 圖片放大工具", "Gemini"],
    outputs: ["單張高畫質分鏡圖", "可用於影片生成的起始圖片"],
    prompt: `請截取出九宮格圖片中 [Row X、Column X] 的影像，將其放大至整個畫面並提升畫質。

放大後請保持原角色的臉部特徵、髮型、服裝、場景、光影與畫面情緒一致，不要重新設計角色，也不要改變原本的構圖精神。

請先詢問我要截取的 Row 和 Column，再開始處理。

【Row】：
【Column】：`
  },
  {
    id: "Step_06",
    title: "生成影片提示詞",
    purpose: "將靜態圖片或分鏡畫面轉成影片生成提示詞，讓畫面動起來。",
    inputs: ["分鏡圖片", "主題", "歌詞段落", "角色動作", "想要的運鏡"],
    tools: ["ChatGPT", "Gemini", "Google Flow", "Runway", "Pika", "Luma"],
    outputs: ["中文影片提示詞", "角色動態描述", "環境動態描述", "運鏡描述"],
    prompt: `你是一位專業的影片生成提示詞工程師。

請依據我提供的【主題】或圖片，撰寫一個專業且具備電影感的中文影片提示詞。

請包含以下內容：
1. 角色動態：詳細描述角色的肢體動作、面部表情變化。
2. 環境氛圍：描述光影、塵埃、雲朵、霓虹燈等動態元素。
3. 運鏡方式：如果我沒有指定，請依據主題設計適合的運鏡，例如 Push In、Pan、Orbit Shot、Pull Out。
4. 影片質感：加入電影感、自然動態、穩定鏡頭、細膩光影。

【主題】：
【圖片說明】：
【指定運鏡，如果沒有請自動設計】：`
  },
  {
    id: "Step_07",
    title: "空拍視角和細節",
    purpose: "將 MV 主角轉成 Q 版、插畫風、宣傳圖或社群封面。",
    inputs: ["主角圖片", "想轉換的風格", "使用情境"],
    tools: ["ChatGPT", "圖片生成工具", "圖片編輯工具"],
    outputs: ["Q 版角色提示詞", "宣傳圖提示詞", "保持主角特色的風格化版本"],
    prompt: `你是一位擁有 20 年經驗的角色插畫與 MV 視覺設計師。

請根據我提供的主角圖片，設計 2 到 3 個適合 MV 宣傳使用的 Q 版或插畫風變體。

請保留主角的核心特徵，例如髮型、服裝、氣質、主要配色與表情特色。

請根據用途提供不同版本：
1. YouTube 縮圖版本。
2. 簡報插圖版本。
3. 社群貼文版本。

【使用情境】：
【想要風格】：`
  },
  {
    id: "Step_08",
    title: "電影感打光優化",
    purpose: "從原本的場景圖延伸出更高、更遠、更壯闊的空拍視角。",
    inputs: ["原圖", "場景描述", "想要的空拍運鏡"],
    tools: ["Gemini", "Google Flow", "影片生成工具"],
    outputs: ["空拍視角圖片", "空拍影片提示詞", "FPV 或拉遠揭曉鏡頭"],
    prompt: `請先等待我上傳原圖。

請基於這張照片生成一個空拍視角。請提供更寬廣的廣角視野，位置要比原圖更高、更遠，以捕捉更壯闊的周邊環境。

請保持原圖中的主要地點、主體、建築、地景與光線方向一致，不要改成另一個場景。

請依據畫面特性，選擇一種最適合的空拍運鏡：
1. Orbit 環繞運鏡。
2. Push In 推鏡。
3. Pull Out 拉鏡。
4. 圖幀轉影片。
5. FPV 概念。`
  },
  {
    id: "Step_09",
    title: "FFmpeg 組裝與驗證",
    purpose: "使用 Google Flow 的首尾幀功能，製作一鏡到底、無縫轉場或短篇微電影片段。",
    inputs: ["MV 主題", "主角類別", "主角設定", "場景設定", "想要的影片長度"],
    tools: ["Google Flow", "ChatGPT", "Gemini"],
    outputs: ["微電影腳本", "首幀圖片提示詞", "尾幀圖片提示詞", "影片生成提示詞"],
    prompt: `我要使用 Google Flow 製作一段微電影，並使用首尾幀功能創造一鏡到底或無縫轉場效果。

請先詢問我以下資訊：
1. MV 主題是什麼？
2. 主角是什麼類別？
3. 想要的情緒是什麼？
4. 想要的場景是什麼？
5. 影片長度大約幾秒？

等我回答後，請幫我設計：
1. 微電影腳本。
2. 首幀圖片提示詞。
3. 尾幀圖片提示詞。
4. Google Flow 影片提示詞。

請特別注意首幀與尾幀必須保持同一位主角。`
  },
  {
    id: "Step_10",
    title: "打包與資產整理",
    purpose: "為圖片或影片加入明確打光風格，讓畫面更有電影感。",
    inputs: ["場景", "角色", "情緒", "想要的光線感"],
    tools: ["圖片生成工具", "影片生成工具", "ChatGPT", "Gemini"],
    outputs: ["打光風格提示詞", "中英文對照說明"],
    prompt: `請根據我提供的【場景】、【角色】與【情緒】，從 20 種電影感打光風格中選出最適合的 3 種。

每一種請提供：
1. 適合原因。
2. 英文打光提示詞。
3. 可直接加入圖片或影片生成 Prompt 的完整句子。

可參考風格：英雄光、暖色溫控制、戲劇性冷夜、蝴蝶光、倫勃朗光、黃金時刻、藍色時刻、體積光、月光反射、賽博龐克雙色、螢幕反光、高調照明、輪廓光、圖案投影、反派底光、書本光、負補光、虛無隔離、剪影打光、黑色對峙光。

【場景】：
【角色】：
【情緒】：`
  }

  },
  {
    id: "Step_11",
    title: "打包與資產整理",
    purpose: "準備 YouTube 上傳所需的所有文件和元數據。",
    inputs: ["完整 MV.mp4", "相關素材"],
    tools: ["FFmpeg", "文本編輯器", "Firebase（可選）"],
    outputs: ["MP4 + 封面 PNG + metadata.md"],
    time: "5-10 分鐘",
    cost: "$0",
    prompt: `整理完成的 MV 及相關元數據，為 YouTube 上傳做準備。

準備以下文件：
1. MV 完整檔 (MP4)
2. 封面圖片 (PNG, 1920×1080)
3. Metadata 文檔
4. 製作說明 (README.md)
5. 製作人員清單 (CREDITS.md)

【MV 標題】：
【製作工具清單】：`
  },
  {
    id: "Step_12",
    title: "YouTube 上傳與發布",
    purpose: "上傳到 YouTube 並配置完整的視頻信息。",
    inputs: ["MP4 文件", "metadata", "封面圖"],
    tools: ["YouTube Studio"],
    outputs: ["YouTube 視頻連結"],
    time: "15-30 分鐘",
    cost: "$0",
    prompt: `上傳到 YouTube 並配置完整的視頻信息。

上傳前檢查清單：
- 標題簡潔吸引
- 描述前 100 字包含主關鍵詞
- 章節時間碼標記
- 標籤最多 30 個

【視頻標題】：
【主要關鍵詞】：`
  }
];
const checklistItems = [
  "主角是否一致？",
  "髮型是否一致？",
  "服裝是否一致？",
  "場景是否符合歌曲情緒？",
  "是否有近景、中景、遠景？",
  "影片提示詞是否包含角色動作？",
  "影片提示詞是否包含環境動態？",
  "影片提示詞是否包含運鏡？",
  "打光風格是否明確？",
  "是否已經保存這次使用的 Prompt？"
];

let activeIndex = 0;
let currentUser = null;
let unsubscribeProjects = null;
const stepOutputs = {};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {}, firestoreDatabaseId);

const els = {
  stepNav: document.getElementById("stepNav"),
  activeMeta: document.getElementById("activeMeta"),
  activeTitle: document.getElementById("activeTitle"),
  activeCount: document.getElementById("activeCount"),
  activePurpose: document.getElementById("activePurpose"),
  activeInputs: document.getElementById("activeInputs"),
  activeTools: document.getElementById("activeTools"),
  activeOutputs: document.getElementById("activeOutputs"),
  activePrompt: document.getElementById("activePrompt"),
  generatedPrompt: document.getElementById("generatedPrompt"),
  copyStatus: document.getElementById("copyStatus"),
  checklist: document.getElementById("checklist"),
  topicInput: document.getElementById("topicInput"),
  styleInput: document.getElementById("styleInput"),
  moodInput: document.getElementById("moodInput"),
  characterInput: document.getElementById("characterInput"),
  sceneInput: document.getElementById("sceneInput"),
  cameraInput: document.getElementById("cameraInput")
};

els.projectNameInput = document.getElementById("projectNameInput");
els.projectNoteInput = document.getElementById("projectNoteInput");
els.firebaseStatus = document.getElementById("firebaseStatus");
els.saveProject = document.getElementById("saveProject");
els.savedProjects = document.getElementById("savedProjects");
els.outputInput = document.getElementById("outputInput");
els.outputHint = document.getElementById("outputHint");
els.copyOutput = document.getElementById("copyOutput");

function listItems(target, items) {
  target.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    target.appendChild(li);
  });
}

function renderNav() {
  els.stepNav.innerHTML = "";
  steps.forEach((step, index) => {
    const button = document.createElement("button");
    button.className = `nav-btn${index === activeIndex ? " active" : ""}`;
    button.type = "button";
    button.innerHTML = `<strong>${step.id}</strong><span>${step.title}</span>`;
    button.addEventListener("click", () => {
      stepOutputs[steps[activeIndex].id] = els.outputInput.value;
      activeIndex = index;
      renderStep();
    });
    els.stepNav.appendChild(button);
  });
}

function renderStep() {
  const step = steps[activeIndex];
  els.activeMeta.textContent = step.id;
  els.activeTitle.textContent = step.title;
  els.activeCount.textContent = `${activeIndex + 1} / ${steps.length}`;
  els.activePurpose.textContent = step.purpose;
  els.activePrompt.textContent = step.prompt;
  listItems(els.activeInputs, step.inputs);
  listItems(els.activeTools, step.tools);
  listItems(els.activeOutputs, step.outputs);
  els.outputHint.textContent = `產出：${step.outputs.join("、")}`;
  els.outputInput.value = stepOutputs[step.id] || "";
  renderNav();
}

function buildPrompt() {
  const topic = els.topicInput.value.trim() || "（請填入主題）";
  const style = els.styleInput.value.trim() || "（請填入曲風）";
  const mood = els.moodInput.value.trim() || "（請填入情緒）";
  const character = els.characterInput.value.trim() || "（請填入主角）";
  const scene = els.sceneInput.value.trim() || "（請填入場景）";
  const camera = els.cameraInput.value.trim() || "（請填入運鏡）";

  els.generatedPrompt.textContent = `請協助我製作一支 AI MV。

主題：${topic}
曲風：${style}
情緒：${mood}
主角：${character}
場景：${scene}
運鏡：${camera}

請依照目前選擇的 MV 製作步驟，產生可以直接複製到 AI 工具的提示詞，並注意角色一致性、場景氛圍、電影感光影與清楚的輸出格式。`;
}

function getProjectPayload() {
  return {
    name: els.projectNameInput.value.trim() || "未命名 MV 專案",
    note: els.projectNoteInput.value.trim(),
    stepOutputs: { ...stepOutputs, [steps[activeIndex].id]: els.outputInput.value },
    activeStepId: steps[activeIndex].id,
    activeStepTitle: steps[activeIndex].title,
    topic: els.topicInput.value.trim(),
    style: els.styleInput.value.trim(),
    mood: els.moodInput.value.trim(),
    character: els.characterInput.value.trim(),
    scene: els.sceneInput.value.trim(),
    camera: els.cameraInput.value.trim(),
    generatedPrompt: els.generatedPrompt.textContent,
    stepPrompt: steps[activeIndex].prompt,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  };
}

function applySavedProject(project) {
  els.projectNameInput.value = project.name || "";
  els.projectNoteInput.value = project.note || "";
  els.topicInput.value = project.topic || "";
  els.styleInput.value = project.style || "";
  els.moodInput.value = project.mood || "";
  els.characterInput.value = project.character || "";
  els.sceneInput.value = project.scene || "";
  els.cameraInput.value = project.camera || "";

  if (project.stepOutputs) {
    Object.assign(stepOutputs, project.stepOutputs);
  }
  const stepIndex = steps.findIndex((step) => step.id === project.activeStepId);
  if (stepIndex >= 0) {
    activeIndex = stepIndex;
    renderStep();
  }
  buildPrompt();
}

function formatTime(timestamp) {
  if (!timestamp?.toDate) {
    return "剛剛";
  }
  return timestamp.toDate().toLocaleString("zh-TW", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function renderSavedProjects(snapshot) {
  els.savedProjects.innerHTML = "";

  if (snapshot.empty) {
    els.savedProjects.innerHTML = '<div class="saved-item"><span>目前還沒有儲存的 MV 專案。</span></div>';
    return;
  }

  snapshot.forEach((doc) => {
    const project = doc.data();
    const item = document.createElement("div");
    item.className = "saved-item";
    item.innerHTML = `
      <strong>${project.name || "未命名 MV 專案"}</strong>
      <span>${project.activeStepId || "MV"}｜${project.topic || "未填主題"}｜${formatTime(project.createdAt)}</span>
      <span>${project.note || "沒有備註"}</span>
    `;

    const loadButton = document.createElement("button");
    loadButton.className = "secondary-btn";
    loadButton.type = "button";
    loadButton.textContent = "載入";
    loadButton.addEventListener("click", () => applySavedProject(project));
    item.appendChild(loadButton);

    const docId = doc.id;
    const deleteButton = document.createElement("button");
    deleteButton.className = "secondary-btn danger-btn";
    deleteButton.type = "button";
    deleteButton.textContent = "刪除";
    deleteButton.addEventListener("click", async () => {
      if (!confirm(`確定要刪除「${project.name || "未命名 MV 專案"}」嗎？`)) return;
      try {
        await deleteDoc(firestoreDoc(db, "users", currentUser.uid, "mvProjects", docId));
      } catch (error) {
        els.firebaseStatus.textContent = `刪除失敗：${error.message}`;
      }
    });
    item.appendChild(deleteButton);
    els.savedProjects.appendChild(item);
  });
}

function watchSavedProjects(user) {
  if (unsubscribeProjects) {
    unsubscribeProjects();
  }

  const projectsRef = collection(db, "users", user.uid, "mvProjects");
  const projectsQuery = query(projectsRef, orderBy("createdAt", "desc"), limit(8));

  unsubscribeProjects = onSnapshot(
    projectsQuery,
    renderSavedProjects,
    (error) => {
      els.firebaseStatus.textContent = `Firestore 讀取失敗：${error.message}`;
    }
  );
}

async function saveProject() {
  if (!currentUser) {
    els.firebaseStatus.textContent = "Firebase 尚未登入完成，請稍候再試。";
    return;
  }

  els.saveProject.disabled = true;
  els.firebaseStatus.textContent = "正在儲存到 Firestore...";

  try {
    await addDoc(collection(db, "users", currentUser.uid, "mvProjects"), getProjectPayload());
    els.firebaseStatus.textContent = "已儲存到 Firestore。";
  } catch (error) {
    els.firebaseStatus.textContent = `儲存失敗：${error.message}`;
  } finally {
    els.saveProject.disabled = false;
  }
}

function initFirebase() {
  els.saveProject.disabled = true;

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      return;
    }

    currentUser = user;
    els.saveProject.disabled = false;
    els.firebaseStatus.textContent = `已連線 Firebase，匿名 ID：${user.uid.slice(0, 8)}...`;
    watchSavedProjects(user);
  });

  signInAnonymously(auth).catch((error) => {
    els.firebaseStatus.textContent = `Firebase 匿名登入失敗：${error.message}`;
  });
}

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    els.copyStatus.textContent = "已複製";
    window.setTimeout(() => {
      els.copyStatus.textContent = "可繼續複製";
    }, 1600);
  } catch (error) {
    els.copyStatus.textContent = "複製失敗，請手動選取";
  }
}

function renderChecklist() {
  els.checklist.innerHTML = "";
  checklistItems.forEach((text, index) => {
    const label = document.createElement("label");
    label.className = "check-item";
    label.innerHTML = `<input type="checkbox" id="check-${index}"><span>${text}</span>`;
    els.checklist.appendChild(label);
  });
}

document.getElementById("copyStepPrompt").addEventListener("click", () => {
  copyText(steps[activeIndex].prompt);
});

els.copyOutput.addEventListener("click", () => {
  copyText(els.outputInput.value);
});

document.getElementById("copyActivePrompt").addEventListener("click", () => {
  copyText(steps[activeIndex].prompt);
});

document.getElementById("copyGenerated").addEventListener("click", () => {
  copyText(els.generatedPrompt.textContent);
});

document.getElementById("resetForm").addEventListener("click", () => {
  [
    els.topicInput,
    els.styleInput,
    els.moodInput,
    els.characterInput,
    els.sceneInput,
    els.cameraInput
  ].forEach((input) => {
    input.value = "";
  });
  buildPrompt();
});

els.saveProject.addEventListener("click", saveProject);

[
  els.topicInput,
  els.styleInput,
  els.moodInput,
  els.characterInput,
  els.sceneInput,
  els.cameraInput
].forEach((input) => {
  input.addEventListener("input", buildPrompt);
});

renderChecklist();
renderStep();
buildPrompt();
initFirebase();
