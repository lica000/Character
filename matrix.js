/* ============================================================
   雙軸座標圖
   ============================================================ */

let characters = getCharacters();
let matrixAxes = loadMatrixAxes();

let currentXAxisId = matrixAxes[0]?.id || "";
let currentYAxisId = matrixAxes[1]?.id || matrixAxes[0]?.id || "";

let isMatrixDragEnabled = false;

const MATRIX_LABEL_STORAGE_KEY = "oc_matrix_label_positions";
const MATRIX_DIAGONAL_STORAGE_KEY = "oc_matrix_show_diagonal";
const MATRIX_SVG_NS = "http://www.w3.org/2000/svg";

let matrixLabelPositions = loadMatrixLabelPositions();
let matrixShowDiagonal = loadMatrixDiagonalSetting();


document.addEventListener("DOMContentLoaded", () => {
    renderMatrixView();
});


/* ============================================================
   儲存與載入設定
   ============================================================ */

function loadMatrixAxes() {
    try {
        const raw = localStorage.getItem("oc_matrix_axes");

        if (raw) {
            const saved = JSON.parse(raw);

            if (Array.isArray(saved) && saved.length >= 2) {
                return saved;
            }
        }
    } catch (error) {
        console.error("讀取座標軸失敗：", error);
    }

    const defaults = [
        {
            id: "axis_1",
            leftTop: "理性",
            rightBottom: "感性"
        },
        {
            id: "axis_2",
            leftTop: "秩序",
            rightBottom: "混沌"
        }
    ];

    localStorage.setItem(
        "oc_matrix_axes",
        JSON.stringify(defaults)
    );

    return defaults;
}


function saveMatrixAxes() {
    localStorage.setItem(
        "oc_matrix_axes",
        JSON.stringify(matrixAxes)
    );
}


function loadMatrixLabelPositions() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(MATRIX_LABEL_STORAGE_KEY) || "{}"
        );

        return saved && typeof saved === "object" ? saved : {};
    } catch (error) {
        console.error("讀取角色名稱位置失敗：", error);
        return {};
    }
}


function saveMatrixLabelPositions() {
    localStorage.setItem(
        MATRIX_LABEL_STORAGE_KEY,
        JSON.stringify(matrixLabelPositions)
    );
}


function removeMatrixEmoji(value) {
    return String(value ?? "").replace(
        /\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?)*|\p{Regional_Indicator}{2}/gu,
        ""
    );
}


function normalizeMatrixCharacterName(value) {
    return removeMatrixEmoji(value).trim();
}


/* ============================================================
   拖移模式開關
   ============================================================ */

function toggleMatrixDragLock() {
    isMatrixDragEnabled = !isMatrixDragEnabled;

    const btn = document.getElementById("dragLockBtn");

    if (btn) {
        btn.innerText = isMatrixDragEnabled
            ? "拖移模式啟用中"
            : "啟用拖移編輯";

        btn.style.backgroundColor = isMatrixDragEnabled
            ? "#212529"
            : "#ffffff";

        btn.style.color = isMatrixDragEnabled
            ? "#ffffff"
            : "#212529";
    }

    drawMatrixChart();
}


/* ============================================================
   取得角色座標
   空值回傳 null，不再自動轉成 50
   ============================================================ */

function getMatrixValue(char, axisId) {
    if (!char.matrixValues ||
        char.matrixValues[axisId] === undefined ||
        char.matrixValues[axisId] === null ||
        char.matrixValues[axisId] === "") {
        return null;
    }

    const value = Number(char.matrixValues[axisId]);

    if (!Number.isFinite(value)) return null;

    return Math.max(0, Math.min(100, value));
}


function getMatrixDisplayValue(char, axisId) {
    const value = getMatrixValue(char, axisId);
    return value === null ? 50 : value;
}


/* ============================================================
   SVG 工具
   ============================================================ */

function createMatrixSvgElement(name, attributes = {}) {
    const element = document.createElementNS(MATRIX_SVG_NS, name);

    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, String(value));
    });

    return element;
}


/* ============================================================
   名稱位置識別
   ============================================================ */

function getMatrixLabelPositionKey(char) {
    return [
        String(char.id),
        String(currentXAxisId),
        String(currentYAxisId)
    ].join("::");
}


function getMatrixLabelPosition(char) {
    const key = getMatrixLabelPositionKey(char);
    const saved = matrixLabelPositions[key];

    if (
        saved &&
        Number.isFinite(Number(saved.x)) &&
        Number.isFinite(Number(saved.y))
    ) {
        return {
            x: Math.max(0, Math.min(100, Number(saved.x))),
            y: Math.max(0, Math.min(100, Number(saved.y)))
        };
    }

    return null;
}

/* ============================================================
   新增角色
   ============================================================ */

function addCharacterFromMatrix() {
    const defaultColor = DEFAULT_COLORS[
        characters.length % DEFAULT_COLORS.length
    ];

    const newChar = createCharacterData({
        id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
        name: `新角色_${characters.length + 1}`,
        color: defaultColor,
        avatar: "",
        fullBodyAvatar: "",
        tags: [],
        quote: "",
        bio: "",
        matrixValues: {},
        radarValues: {}
    });

    characters.push(newChar);
    saveCharacters(characters);
    renderMatrixView();
}


/* ============================================================
   座標軸管理
   ============================================================ */

function reverseMatrixAxis(axisId) {
    const axis = matrixAxes.find(
        a => String(a.id) === String(axisId)
    );

    if (!axis) return;

    [axis.leftTop, axis.rightBottom] = [
        axis.rightBottom,
        axis.leftTop
    ];

    characters.forEach(char => {
        if (!char.matrixValues) return;

        const value = getMatrixValue(char, axisId);

        if (value !== null) {
            char.matrixValues[axisId] = 100 - value;
        }
    });

    // 讓已手動移動的名稱也跟著反轉的軸鏡射。
    Object.entries(matrixLabelPositions).forEach(([key, position]) => {
        const parts = key.split("::");

        if (parts.length !== 3) return;

        if (String(parts[1]) === String(axisId)) {
            position.x = 100 - Number(position.x);
        }

        if (String(parts[2]) === String(axisId)) {
            position.y = 100 - Number(position.y);
        }
    });

    saveMatrixAxes();
    saveCharacters(characters);
    saveMatrixLabelPositions();

    renderMatrixView();
}


function addNewAxisFromInput() {
    const leftInput = document.getElementById("newAxisLeftInput");
    const rightInput = document.getElementById("newAxisRightInput");

    if (!leftInput || !rightInput) return;

    const left = removeMatrixEmoji(leftInput.value).trim();
    const right = removeMatrixEmoji(rightInput.value).trim();

    if (!left || !right) {
        alert("請輸入座標軸兩端名稱！");
        return;
    }

    matrixAxes.push({
        id: `axis_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        leftTop: left,
        rightBottom: right
    });

    saveMatrixAxes();

    leftInput.value = "";
    rightInput.value = "";

    renderMatrixView();
}


function deleteMatrixAxis(axisId) {
    if (matrixAxes.length <= 2) {
        alert("最少保留兩個座標軸！");
        return;
    }

    const axis = matrixAxes.find(a => String(a.id) === String(axisId));
    if (!axis) return;

    if (!confirm(`確定要刪除「${axis.leftTop} / ${axis.rightBottom}」嗎？`)) {
        return;
    }

    matrixAxes = matrixAxes.filter(a => String(a.id) !== String(axisId));

    characters.forEach(char => {
        if (char.matrixValues) delete char.matrixValues[axisId];
    });

    Object.keys(matrixLabelPositions).forEach(key => {
        if (key.split("::").includes(String(axisId))) {
            delete matrixLabelPositions[key];
        }
    });

    ensureCurrentAxes();

    saveMatrixAxes();
    saveCharacters(characters);
    saveMatrixLabelPositions();

    renderMatrixView();
}


/* ============================================================
   常用座標軸
   ============================================================ */

const COMMON_AXES_PRESETS = [
    ["理性", "感性"],
    ["秩序", "混沌"],
    ["外向", "內向"],
    ["怪人", "常識人"],
    ["其實是怪人", "其實是常識人"],
    ["攻", "受"],
    ["胸部大", "胸部小"],
    ["現實主義", "浪漫主義"]
];


function renderCommonAxes() {
    const container = document.getElementById("commonAxesList");
    if (!container) return;

    container.innerHTML = "";

    COMMON_AXES_PRESETS.forEach(pair => {
        const btn = document.createElement("button");
        btn.className = "common-axis-btn";
        btn.textContent = `＋ ${pair[0]} / ${pair[1]}`;

        btn.onclick = () => {
            const exists = matrixAxes.some(
                axis =>
                    axis.leftTop === pair[0] &&
                    axis.rightBottom === pair[1]
            );

            if (exists) return;

            matrixAxes.push({
                id: `axis_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                leftTop: pair[0],
                rightBottom: pair[1]
            });

            saveMatrixAxes();
            renderMatrixView();
        };

        container.appendChild(btn);
    });
}

/* ============================================================
   匯出文字
   ============================================================ */

function generateExportText() {
    const headers = [
        "角色",
        ...matrixAxes.map(axis => `${axis.leftTop}/${axis.rightBottom}`),
        "標籤"
    ];

    const lines = [headers.join(" ")];

    characters.forEach(char => {
        const values = matrixAxes.map(axis => {
            const value = getMatrixValue(char, axis.id);
            return value === null ? "" : value;
        });

        const tags = Array.isArray(char.tags)
            ? char.tags.map(tag => `#${removeMatrixEmoji(tag)}`)
            : [];

        lines.push(
            [normalizeMatrixCharacterName(char.name) || "未命名", ...values, ...tags].join(" ")
        );
    });

    const area = document.getElementById("matrixIOTextarea");
    if (area) area.value = lines.join("\n");
}


async function copyExportText() {
    const area = document.getElementById("matrixIOTextarea");
    if (!area) return;

    if (!area.value) generateExportText();

    try {
        await navigator.clipboard.writeText(area.value);
        alert("複製成功！");
    } catch (error) {
        area.select();
        document.execCommand("copy");
        alert("複製成功！");
    }
}


/* ============================================================
   從文字匯入
   同名角色更新數值，不建立重複角色
   ============================================================ */
function importDataFromText() {
    const area = document.getElementById("matrixIOTextarea");
    if (!area) return;

    const text = area.value.trim();
    if (!text) return;

    const lines = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

    if (lines.length < 2) {
        alert("格式不足！");
        return;
    }

    const headers = lines[0].split(/\s+/);

    if (headers[0] !== "角色") {
        alert("第一欄必須是「角色」！");
        return;
    }

    // 依照匯入標題尋找或建立座標軸
    const axisHeaders = headers
        .slice(1)
        .filter(header => header !== "標籤");

    const importedAxes = axisHeaders.map(header => {
        const normalizedHeader = header.replace(/\s*\/\s*/g, "/");

        // 尋找名稱相同的既有座標軸
        let axis = matrixAxes.find(existing => {
            const existingHeader =
                `${ existing.leftTop }/${existing.rightBottom}`
    .replace(/\s*\/\s*/g, "/");

return existingHeader === normalizedHeader;
        });

// 找不到就新增座標軸
if (!axis) {
    const separator = normalizedHeader.indexOf("/");
    const leftTop = separator >= 0
        ? normalizedHeader.slice(0, separator).trim()
        : normalizedHeader.trim();
    const rightBottom = separator >= 0
        ? normalizedHeader.slice(separator + 1).trim()
        : "";

    axis = {
        id: `axis_${Date.now()}_${Math.random()
            .toString(36).substring(2, 8)}`,
        leftTop,
        rightBottom
    };

    matrixAxes.push(axis);
}

return axis;
    });

// 儲存新增的座標軸
saveMatrixAxes();

let addedCount = 0;
let updatedCount = 0;

lines.slice(1).forEach(line => {
    const tagMatches = line.match(/#[^\s#]+/g) || [];
    const cleanLine = line.replace(/#[^\s#]+/g, "").trim();
    const parts = cleanLine.split(/\s+/);

    const name = normalizeMatrixCharacterName(parts.shift());
    if (!name) return;

    const existingChar = characters.find(
        char => normalizeMatrixCharacterName(char.name) === name
    );

    const target = existingChar || createCharacterData({
        id: Date.now().toString() +
            Math.random().toString(36).substring(2, 7),
        name,
        color: DEFAULT_COLORS[
            characters.length % DEFAULT_COLORS.length
        ],
        avatar: "",
        fullBodyAvatar: "",
        quote: "",
        bio: "",
        tags: [],
        matrixValues: {},
        radarValues: {}
    });

    target.name = name;

    if (!target.matrixValues ||
        typeof target.matrixValues !== "object") {
        target.matrixValues = {};
    }

    // 數值依照匯入標題對應的軸 ID 寫入
    importedAxes.forEach((axis, index) => {
        const raw = parts[index];

        // 空白數值不覆蓋既有資料
        if (raw === undefined || raw === "") return;

        const value = Number(raw);

        if (Number.isFinite(value)) {
            target.matrixValues[axis.id] = Math.max(
                0,
                Math.min(100, Math.round(value))
            );
        }
    });

    target.tags = [
        ...new Set(
            tagMatches
                .map(tag =>
                    removeMatrixEmoji(tag.slice(1)).trim()
                )
                .filter(Boolean)
        )
    ];

    if (existingChar) {
        updatedCount++;
    } else {
        characters.push(target);
        addedCount++;
    }
});

saveCharacters(characters);
renderMatrixView();

alert(
    `匯入完成！\n新增角色：${addedCount}` +
    `\n更新角色：${updatedCount}`
);
}



/* ============================================================
   HTML 跳脫（供其他功能使用）
   ============================================================ */

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeHtmlAttribute(value) {
    return escapeHtml(value);
}

/* ============================================================
   整合補充功能：篩選、角色管理、隱藏座標軸、固定表格、單一對角線
   ============================================================ */

const MATRIX_SELECTED_TAGS_KEY = "oc_matrix_selected_tags";
let matrixSelectedTags = loadMatrixSelectedTags();
const MATRIX_TAG_MATCH_MODE_KEY = "oc_matrix_tag_match_mode";

let matrixTagMatchMode =
    localStorage.getItem(MATRIX_TAG_MATCH_MODE_KEY) === "all"
        ? "all"
        : "any";


function loadMatrixSelectedTags() {
    try {
        const value = JSON.parse(
            localStorage.getItem(MATRIX_SELECTED_TAGS_KEY) || "[]"
        );

        return Array.isArray(value) ? value : [];
    } catch (_) {
        return [];
    }
}


function saveMatrixSelectedTags() {
    localStorage.setItem(
        MATRIX_SELECTED_TAGS_KEY,
        JSON.stringify(matrixSelectedTags)
    );
}


function loadMatrixDiagonalSetting() {
    const value = localStorage.getItem(MATRIX_DIAGONAL_STORAGE_KEY);

    if (value === "up" || value === "down" || value === "none") {
        return value;
    }

    return value === "true" ? "down" : "none";
}


function saveMatrixDiagonalSetting() {
    localStorage.setItem(
        MATRIX_DIAGONAL_STORAGE_KEY,
        matrixShowDiagonal
    );
}


function getVisibleMatrixAxes() {
    return matrixAxes.filter(axis => !axis.matrixHidden);
}

const MATRIX_HIDDEN_CHARACTERS_KEY = "oc_matrix_hidden_characters";

function loadMatrixHiddenCharacterIds() {
    try {
        const ids = JSON.parse(
            localStorage.getItem(MATRIX_HIDDEN_CHARACTERS_KEY) || "[]"
        );
        return new Set(Array.isArray(ids) ? ids.map(String) : []);
    } catch (_) {
        return new Set();
    }
}

function saveMatrixHiddenCharacterIds(ids) {
    localStorage.setItem(
        MATRIX_HIDDEN_CHARACTERS_KEY,
        JSON.stringify([...ids])
    );
}

function isMatrixCharacterHidden(char) {
    return Boolean(char.matrixHidden) ||
        loadMatrixHiddenCharacterIds().has(String(char.id));
}

function getVisibleMatrixCharacters() {
    const selected = new Set(matrixSelectedTags);

    return characters.filter(char => {
        if (isMatrixCharacterHidden(char)) return false;
        if (selected.size === 0) return true;

        const tags = new Set(
            (Array.isArray(char.tags) ? char.tags : [])
                .map(tag => removeMatrixEmoji(tag).trim().replace(/^#+/, ""))
                .filter(Boolean)
        );

        if (matrixTagMatchMode === "all") {
            return [...selected].every(tag => tags.has(tag));
        }

        return [...selected].some(tag => tags.has(tag));
    });
}


/* ============================================================
   注入樣式
   ============================================================ */

function injectMatrixStyles() {
    if (document.getElementById("matrixExtraStyles")) return;

    const style = document.createElement("style");
    style.id = "matrixExtraStyles";

    style.textContent = `
      .matrix-extra-panel {
        margin: 10px 0;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 8px;
      }

      .matrix-extra-title {
        font-weight: 700;
        margin-bottom: 8px;
      }

      .matrix-tag-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .matrix-tag-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        border: 1px solid #ddd;
        border-radius: 14px;
        font-size: 12px;
      }

      .matrix-character-admin-row,
      .matrix-axis-admin-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        padding: 7px 0;
        border-bottom: 1px solid #eee;
      }

      .matrix-character-admin-row:last-child,
      .matrix-axis-admin-row:last-child {
        border-bottom: 0;
      }

      .matrix-character-admin-row .matrix-admin-name,
      .matrix-axis-admin-row .matrix-admin-name {
        flex: 1;
        min-width: 100px;
        overflow-wrap: anywhere;
      }

      .matrix-admin-btn {
        border: 1px solid #ccc;
        border-radius: 6px;
        background: #fff;
        padding: 4px 8px;
        cursor: pointer;
        font-size: 12px;
      }

      .matrix-admin-danger {
        color: #b42318;
        border-color: #e4a6a1;
      }

      .matrix-table-scroll-wrapper {
        max-width: 100%;
        max-height: 420px;
        overflow: auto;
        position: relative;
        border: 1px solid #ddd;
        border-radius: 6px;
      }

      .matrix-table-scroll-wrapper table {
        border-collapse: separate !important;
        border-spacing: 0 !important;
        min-width: max-content;
      }

      .matrix-table-scroll-wrapper th,
      .matrix-table-scroll-wrapper td {
        background: var(--matrix-table-cell-bg, #fff);
        position: relative;
      }

      .matrix-table-scroll-wrapper thead th {
        position: sticky;
        top: 0;
        z-index: 5;
        background: var(--matrix-table-head-bg, #f4f4f4);
      }

      .matrix-table-scroll-wrapper th:first-child,
      .matrix-table-scroll-wrapper td:first-child {
        position: sticky;
        left: 0;
        z-index: 4;
        background: var(--matrix-table-cell-bg, #fff);
      }

      .matrix-table-scroll-wrapper thead th:first-child {
        z-index: 7;
        background: var(--matrix-table-head-bg, #f4f4f4);
      }

      .matrix-table-scroll-wrapper input[type=number] {
        width: 76px;
        max-width: 100%;
      }

      .matrix-chart-svg line.matrix-connector {
        pointer-events: none;
      }
    /* 圖表控制項與面板 */
 #matrixExtraPanels {
 display: block;
  width: 100%;
   box-sizing: border-box;
    margin-top: 8px;
 }

#matrixDiagonalControl {
display: inline-flex !important;
 align-items: center;
  gap: 8px;
  max-width: 100%;
   box-sizing: border-box;
}

/* 強制角色點有尺寸，避免只有空的 div 而看不見 */
#chartCanvas .character-dot {
display: block !important;
width: 10px !important;
height: 10px !important;
border: 2px solid #ffffff;
border-radius: 50%;
box-shadow: 0 0 0 1px #555555;
 box-sizing: border-box;
 transform: translate(-50%, -50%);
  pointer-events: auto;
}

/* 強制角色名稱可見 */
#chartCanvas .character-name-label {
display: block !important;
 max-width: 180px;
 padding: 2px 5px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.35);
  color: #222222;
  font-size: 12px;
  line-height: 1.4;
  white-space: nowrap;
  overflow: visible;
   pointer-events: auto;
    box-sizing: border-box;
    }

#chartCanvas .matrix-chart-svg {
 pointer-events: none;
 }
    `;

    document.head.appendChild(style);
}



/* ============================================================
   表格捲動容器
   ============================================================ */

function ensureMatrixTableScrollWrapper() {
    const head = document.getElementById("matrixTableHead");
    const body = document.getElementById("matrixTableBody");

    if (!head || !body) return;

    const table = head.closest("table") || body.closest("table");

    if (
        !table ||
        table.parentElement?.classList.contains("matrix-table-scroll-wrapper")
    ) {
        return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "matrix-table-scroll-wrapper";

    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
}


/* ============================================================
   頁面初始化
   ============================================================ */


function renderMatrixView() {
    if (!Array.isArray(matrixAxes) || matrixAxes.length < 2) {
        matrixAxes = loadMatrixAxes();
    }

    // 重新取得最新角色資料，避免使用頁面載入時的舊資料。
    const latestCharacters = getCharacters();
    if (Array.isArray(latestCharacters)) {
        characters = latestCharacters;
    }

    injectMatrixStyles();
    ensureMatrixTableScrollWrapper();
    ensureCurrentAxes();

    renderMatrixAxisSelects();
    renderMatrixAxisManagement();
    renderCommonAxes();
    renderMatrixTable();

    // 先建立面板，再放置對角線控制項。
    renderMatrixDiagonalControl();
    renderMatrixTagFilter();

    // 最後繪製圖表，讓角色點和名稱使用最新資料。
    drawMatrixChart();
}


function ensureCurrentAxes() {
    const visible = getVisibleMatrixAxes();
    const usable = visible.length >= 2 ? visible : matrixAxes;

    if (!usable.some(axis => String(axis.id) === String(currentXAxisId))) {
        currentXAxisId = usable[0]?.id || "";
    }

    if (!usable.some(axis => String(axis.id) === String(currentYAxisId))) {
        currentYAxisId =
            usable.find(axis => String(axis.id) !== String(currentXAxisId))?.id ||
            usable[0]?.id ||
            "";
    }

    if (
        String(currentXAxisId) === String(currentYAxisId) &&
        usable.length > 1
    ) {
        currentYAxisId =
            usable.find(axis => String(axis.id) !== String(currentXAxisId))?.id ||
            currentYAxisId;
    }
}


/* ============================================================
   X / Y 軸選擇器
   ============================================================ */

function renderMatrixAxisSelects() {
    const xSelect = document.getElementById("matrixXAxisSelect");
    const ySelect = document.getElementById("matrixYAxisSelect");

    if (!xSelect || !ySelect) return;

    const visible = getVisibleMatrixAxes();
    const axesForSelect = visible.length >= 2 ? visible : matrixAxes;

    [xSelect, ySelect].forEach(select => {
        select.innerHTML = "";

        axesForSelect.forEach(axis => {
            const option = document.createElement("option");
            option.value = axis.id;
            option.textContent =
                `${axis.leftTop} / ${axis.rightBottom}` +
                `${axis.matrixHidden ? "（隱藏中）" : ""}`;

            select.appendChild(option);
        });
    });

    xSelect.value = currentXAxisId;
    ySelect.value = currentYAxisId;
}

/* ============================================================
   切換 X / Y 軸
   ============================================================ */

function changeMatrixAxis(type, id) {
    if (!matrixAxes.some(axis => String(axis.id) === String(id))) return;

    if (type === "x") currentXAxisId = id;
    if (type === "y") currentYAxisId = id;

    ensureCurrentAxes();
    renderMatrixAxisSelects();
    drawMatrixChart();
    renderMatrixTable();
}


/* ============================================================
   對角線選擇
   ============================================================ */


function renderMatrixDiagonalControl() {
    const canvas = document.getElementById("chartCanvas");
    if (!canvas || !canvas.parentElement) return;

    let control = document.getElementById("matrixDiagonalControl");

    if (!control) {
        control = document.createElement("label");
        control.id = "matrixDiagonalControl";
        control.style.cssText = `
            display: inline-flex;
            position: relative;
            align-items: center;
            gap: 8px;
            margin: 10px 0;
            z-index: 5;
        `;

        const text = document.createElement("span");
        text.textContent = "對角線：";

        const select = document.createElement("select");
        select.id = "matrixDiagonalSelect";

        [
            ["none", "不顯示"],
            ["down", "左上到右下"],
            ["up", "右上到左下"]
        ].forEach(([value, label]) => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = label;
            select.appendChild(option);
        });

        select.addEventListener("change", () => {
            matrixShowDiagonal = select.value;
            saveMatrixDiagonalSetting();
            drawMatrixChart();
        });

        control.append(text, select);
    }

    /*
     * 控制項固定放在 chartCanvas 後面。
     * 每次重繪都重新確認位置，避免被其他函式插回圖表前方。
     */
    const chartArea = canvas.closest(".chart-area");

    if (chartArea) {
        chartArea.insertAdjacentElement("afterend", control);
    } else {
        canvas.insertAdjacentElement("afterend", control);
    }

    const select = control.querySelector("select");
    if (select) select.value = matrixShowDiagonal;
}


/* ============================================================
   標籤篩選
   多選時符合任一標籤即可顯示
   ============================================================ */

function renderMatrixTagFilter() {
    const container = document.getElementById("matrixTagFilterList");
    if (!container) return;

    const tags = [
        ...new Set(
            characters
                .flatMap(char => Array.isArray(char.tags) ? char.tags : [])
                .map(tag => removeMatrixEmoji(tag).trim())
                .filter(Boolean)
        )
    ].sort((a, b) => a.localeCompare(b));

    matrixSelectedTags = matrixSelectedTags.filter(tag => tags.includes(tag));
    saveMatrixSelectedTags();

    container.innerHTML = "";

    const modeLabel = document.createElement("label");
    modeLabel.className = "matrix-tag-match-mode";

    const modeText = document.createElement("span");
    modeText.textContent = "多標籤條件：";

    const modeSelect = document.createElement("select");
    modeSelect.innerHTML = `
        <option value="any">符合任一標籤</option>
        <option value="all">符合全部標籤</option>
    `;
    modeSelect.value = matrixTagMatchMode;

    modeSelect.addEventListener("change", () => {
        matrixTagMatchMode = modeSelect.value;
        localStorage.setItem(
            MATRIX_TAG_MATCH_MODE_KEY,
            matrixTagMatchMode
        );
        drawMatrixChart();
    });

    modeLabel.append(modeText, modeSelect);
    container.appendChild(modeLabel);

    if (!tags.length) {
        const empty = document.createElement("span");
        empty.textContent = "目前沒有標籤";
        container.appendChild(empty);
        return;
    }

    tags.forEach(tag => {
        const label = document.createElement("label");
        label.className = "matrix-tag-chip";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = matrixSelectedTags.includes(tag);

        checkbox.addEventListener("change", () => {
            if (checkbox.checked) {
                if (!matrixSelectedTags.includes(tag)) {
                    matrixSelectedTags.push(tag);
                }
            } else {
                matrixSelectedTags = matrixSelectedTags.filter(
                    item => item !== tag
                );
            }

            saveMatrixSelectedTags();
            drawMatrixChart();
        });

        const span = document.createElement("span");
        span.textContent = `#${tag}`;

        label.append(checkbox, span);
        container.appendChild(label);
    });

    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "matrix-admin-btn";
    clear.textContent = "清除篩選";

    clear.addEventListener("click", () => {
        matrixSelectedTags = [];
        saveMatrixSelectedTags();
        renderMatrixTagFilter();
        drawMatrixChart();
    });

    container.appendChild(clear);
}


/* ============================================================
   繪製座標圖
   ============================================================ */

function drawMatrixChart() {
    const canvas = document.getElementById("chartCanvas");
    if (!canvas) return;

    canvas.querySelectorAll(
        ".character-dot, .character-name-label, .matrix-chart-svg"
    ).forEach(element => element.remove());

    const xAxis = matrixAxes.find(
        axis => String(axis.id) === String(currentXAxisId)
    );

    const yAxis = matrixAxes.find(
        axis => String(axis.id) === String(currentYAxisId)
    );

    if (!xAxis || !yAxis) return;

    const labels = {
        leftLabel: xAxis.leftTop,
        rightLabel: xAxis.rightBottom,
        topLabel: yAxis.leftTop,
        bottomLabel: yAxis.rightBottom
    };

    Object.entries(labels).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });

    const svg = createMatrixSvgElement("svg", {
        width: "100%",
        height: "100%",
        viewBox: "0 0 100 100",
        preserveAspectRatio: "none"
    });

    svg.classList.add("matrix-chart-svg");

    Object.assign(svg.style, {
        position: "absolute",
        inset: "0",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "visible",
        zIndex: "2"
    });

    canvas.appendChild(svg);

    if (matrixShowDiagonal === "down" || matrixShowDiagonal === "up") {
        const line = matrixShowDiagonal === "down"
            ? { x1: 0, y1: 0, x2: 100, y2: 100 }
            : { x1: 100, y1: 0, x2: 0, y2: 100 };

        svg.appendChild(createMatrixSvgElement("line", {
            ...line,
            stroke: "#e8a0a0",
            "stroke-width": 0.35,
            "stroke-dasharray": "2 1.5"
        }));
    }

    const shown = getVisibleMatrixCharacters();
    const groups = new Map();

    shown.forEach(char => {
        const x = getMatrixDisplayValue(char, xAxis.id);
        const y = getMatrixDisplayValue(char, yAxis.id);
        const key = `${x},${y}`;

        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(char);
    });

    const rendered = [];

    shown.forEach(char => {
        if (!char.matrixValues || typeof char.matrixValues !== "object") {
            char.matrixValues = {};
        }

        const xValue = getMatrixValue(char, xAxis.id);
        const yValue = getMatrixValue(char, yAxis.id);

        const x = xValue === null ? 50 : xValue;
        const y = yValue === null ? 50 : yValue;

        const left = 100 - x;
        const top = 100 - y;
        const color = char.color || "#E57373";

        const dot = document.createElement("div");
        dot.className = "character-dot";
        dot.dataset.characterId = String(char.id);

        if (isMatrixDragEnabled) dot.classList.add("draggable");

        Object.assign(dot.style, {
            position: "absolute",
            left: `${left}%`,
            top: `${top}%`,
            backgroundColor: color,
            zIndex: "3",
            touchAction: "none"
        });

        dot.title =
            `${char.name || "未命名"} (X:${xValue ?? "未設定"}, Y:${yValue ?? "未設定"})`;

        canvas.appendChild(dot);

        const group = groups.get(`${x},${y}`) || [];
        const index = group.indexOf(char);

        const offsets = [
            [0, 6],
            [-10, 6],
            [10, 6],
            [-12, 14],
            [12, 14],
            [0, 20],
            [-18, 20],
            [18, 20],
            [0, 26]
        ];

        const offset = group.length > 1
            ? offsets[index % offsets.length]
            : [0, 6];

        const saved = getMatrixLabelPosition(char);

        const labelX = saved
            ? saved.x
            : Math.max(
                0,
                Math.min(
                    100,
                    left + offset[0] * 100 / Math.max(canvas.clientWidth, 1)
                )
            );

        const labelY = saved
            ? saved.y
            : Math.max(
                0,
                Math.min(
                    100,
                    top + offset[1] * 100 / Math.max(canvas.clientHeight, 1)
                )
            );

        const label = document.createElement("div");
        label.className = "character-name-label";
        label.dataset.characterId = String(char.id);
        label.textContent = normalizeMatrixCharacterName(char.name) || "未命名";

        Object.assign(label.style, {
            position: "absolute",
            left: `${labelX}%`,
            top: `${labelY}%`,
            transform: "translate(-50%, 0)",
            zIndex: "4",
            cursor: isMatrixDragEnabled ? "grab" : "default",
            touchAction: "none",
            userSelect: "none",
            pointerEvents: "auto"
        });

        canvas.appendChild(label);

        if (isMatrixDragEnabled) {
            makeDraggable(dot, char, xAxis.id, yAxis.id, canvas);
        }

        // 不論拖移模式是否開啟，都綁定名稱的雙擊事件
        makeMatrixLabelDraggable(label, char, canvas);

        rendered.push({
            char,
            pointX: left,
            pointY: top,
            labelX,
            labelY,
            color,
            groupSize: group.length
        });
    });

    rendered.forEach(item => {
        const key = getMatrixLabelPositionKey(item.char);
        const hasManualPosition = Boolean(getMatrixLabelPosition(item.char));

        if (!hasManualPosition && item.groupSize <= 1) return;

        const line = createMatrixSvgElement("line", {
            x1: item.pointX,
            y1: item.pointY,
            x2: item.labelX,
            y2: item.labelY,
            stroke: item.color,
            "stroke-width": 0.3,
            "data-label-key": key
        });

        line.classList.add("matrix-connector");
        svg.appendChild(line);
    });
}


/* ============================================================
   拖移角色座標點
   同步移動名稱，維持名稱與圓點的相對距離
   ============================================================ */

function makeDraggable(element, char, xAxisId, yAxisId, container) {
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let labelStartX = null;
    let labelStartY = null;
    let labelElement = null;

    element.onpointerdown = event => {
        if (!isMatrixDragEnabled) return;

        dragging = true;

        startX = 100 - (getMatrixValue(char, xAxisId) ?? 50);
        startY = 100 - (getMatrixValue(char, yAxisId) ?? 50);

        labelElement = container.querySelector(
            `.character-name-label[data-character-id="${CSS.escape(String(char.id))}"]`
        );

        if (labelElement) {
            labelStartX = parseFloat(labelElement.style.left);
            labelStartY = parseFloat(labelElement.style.top);
        }

        element.setPointerCapture(event.pointerId);
        event.stopPropagation();
        event.preventDefault();
    };

    element.onpointermove = event => {
        if (!dragging) return;

        const rect = container.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        const newX = Math.max(
            0,
            Math.min(100, (event.clientX - rect.left) / rect.width * 100)
        );

        const newY = Math.max(
            0,
            Math.min(100, (event.clientY - rect.top) / rect.height * 100)
        );

        if (!char.matrixValues || typeof char.matrixValues !== "object") {
            char.matrixValues = {};
        }

        char.matrixValues[xAxisId] = Math.round(100 - newX);
        char.matrixValues[yAxisId] = Math.round(100 - newY);

        element.style.left = `${newX}%`;
        element.style.top = `${newY}%`;

        if (labelElement) {
            const labelX = Math.max(
                0,
                Math.min(100, labelStartX + (newX - startX))
            );

            const labelY = Math.max(
                0,
                Math.min(100, labelStartY + (newY - startY))
            );

            labelElement.style.left = `${labelX}%`;
            labelElement.style.top = `${labelY}%`;

            matrixLabelPositions[getMatrixLabelPositionKey(char)] = {
                x: labelX,
                y: labelY
            };

            const line = container.querySelector(
                `.matrix-chart-svg line[data-label-key="${CSS.escape(getMatrixLabelPositionKey(char))}"]`
            );

            if (line) {
                line.setAttribute("x1", newX);
                line.setAttribute("y1", newY);
                line.setAttribute("x2", labelX);
                line.setAttribute("y2", labelY);
            }
        }
    };

    const finish = event => {
        if (!dragging) return;

        dragging = false;

        try {
            element.releasePointerCapture(event.pointerId);
        } catch (_) { }

        saveCharacters(characters);
        saveMatrixLabelPositions();
        drawMatrixChart();
        renderMatrixTable();
    };

    element.onpointerup = finish;
    element.onpointercancel = finish;
}


/* ============================================================
   拖移名稱；雙擊名稱恢復預設位置
   ============================================================ */

function makeMatrixLabelDraggable(label, char, container) {
    let dragging = false;

    label.onpointerdown = event => {
        if (!isMatrixDragEnabled) return;

        dragging = true;
        label.setPointerCapture(event.pointerId);
        label.style.cursor = "grabbing";

        event.stopPropagation();
        event.preventDefault();
    };

    label.onpointermove = event => {
        if (!dragging) return;

        const rect = container.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        const x = Math.max(
            0,
            Math.min(100, (event.clientX - rect.left) / rect.width * 100)
        );

        const y = Math.max(
            0,
            Math.min(100, (event.clientY - rect.top) / rect.height * 100)
        );

        label.style.left = `${x}%`;
        label.style.top = `${y}%`;

        matrixLabelPositions[getMatrixLabelPositionKey(char)] = { x, y };

        const line = container.querySelector(
            `.matrix-chart-svg line[data-label-key="${CSS.escape(getMatrixLabelPositionKey(char))}"]`
        );

        if (line) {
            line.setAttribute("x2", x);
            line.setAttribute("y2", y);
        }
    };

    const finish = event => {
        if (!dragging) return;

        dragging = false;
        label.style.cursor = "grab";

        try {
            label.releasePointerCapture(event.pointerId);
        } catch (_) { }

        saveMatrixLabelPositions();
        drawMatrixChart();
    };

    label.onpointerup = finish;
    label.onpointercancel = finish;

    label.ondblclick = event => {
        event.preventDefault();
        event.stopPropagation();

        delete matrixLabelPositions[getMatrixLabelPositionKey(char)];

        saveMatrixLabelPositions();
        drawMatrixChart();
    };
}



function getAllMatrixTags() {
    return [
        ...new Set(
            characters
                .flatMap(char => Array.isArray(char.tags) ? char.tags : [])
                .map(tag => removeMatrixEmoji(tag).trim().replace(/^#+/, ""))
                .filter(Boolean)
        )
    ].sort((a, b) => a.localeCompare(b));
}

function renderMatrixCharacterTags(char, container) {
    container.innerHTML = "";
    container.classList.add("matrix-tags-column");

    const selectedTags = [
        ...new Set(
            (Array.isArray(char.tags) ? char.tags : [])
                .map(tag => removeMatrixEmoji(tag).trim().replace(/^#+/, ""))
                .filter(Boolean)
        )
    ];

    const chips = document.createElement("div");
    chips.className = "matrix-selected-tags";

    function saveTags(nextTags) {
        char.tags = [...new Set(
            nextTags
                .map(tag => removeMatrixEmoji(tag).trim().replace(/^#+/, ""))
                .filter(Boolean)
        )];

        saveCharacters(characters);
        renderMatrixView();
    }

    selectedTags.forEach(tag => {
        const chip = document.createElement("span");
        chip.className = "matrix-edit-tag-chip";

        const text = document.createElement("span");
        text.textContent = `#${tag}`;

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "matrix-remove-tag";
        remove.textContent = "×";
        remove.title = `移除標籤 ${tag}`;

        remove.addEventListener("click", () => {
            saveTags(selectedTags.filter(item => item !== tag));
        });

        chip.append(text, remove);
        chips.appendChild(chip);
    });

    const picker = document.createElement("div");
    picker.className = "matrix-tag-picker";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "matrix-tag-search";
    input.placeholder = "搜尋或新增標籤…";
    input.autocomplete = "off";

    const dropdown = document.createElement("div");
    dropdown.className = "matrix-tag-dropdown";
    dropdown.hidden = true;

    function renderOptions() {
        dropdown.innerHTML = "";

        const query = removeMatrixEmoji(input.value)
            .trim()
            .replace(/^#+/, "");

        const allTags = getAllMatrixTags();
        const matches = allTags.filter(tag =>
            !selectedTags.includes(tag) &&
            tag.toLocaleLowerCase().includes(query.toLocaleLowerCase())
        );

        matches.forEach(tag => {
            const option = document.createElement("button");
            option.type = "button";
            option.className = "matrix-tag-option";
            option.textContent = `＋ #${tag}`;

            option.addEventListener("mousedown", event => {
                event.preventDefault();
            });

            option.addEventListener("click", () => {
                saveTags([...selectedTags, tag]);
            });

            dropdown.appendChild(option);
        });

        const exactMatch = allTags.some(
            tag => tag.toLocaleLowerCase() === query.toLocaleLowerCase()
        );

        if (query && !exactMatch && !selectedTags.includes(query)) {
            const create = document.createElement("button");
            create.type = "button";
            create.className = "matrix-tag-option matrix-tag-create";
            create.textContent = `＋ 新增「${query}」`;

            create.addEventListener("mousedown", event => {
                event.preventDefault();
            });

            create.addEventListener("click", () => {
                saveTags([...selectedTags, query]);
            });

            dropdown.appendChild(create);
        }

        if (!dropdown.childElementCount) {
            const empty = document.createElement("div");
            empty.className = "matrix-tag-empty";
            empty.textContent = "沒有符合的標籤";
            dropdown.appendChild(empty);
        }

        dropdown.hidden = false;
    }

    input.addEventListener("focus", renderOptions);
    input.addEventListener("click", renderOptions);
    input.addEventListener("input", renderOptions);

    input.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            dropdown.hidden = true;
        }

        if (event.key === "Enter") {
            event.preventDefault();

            const query = removeMatrixEmoji(input.value)
                .trim()
                .replace(/^#+/, "");

            if (!query) return;

            const existing = getAllMatrixTags().find(
                tag => tag.toLocaleLowerCase() === query.toLocaleLowerCase()
            );

            const tag = existing || query;

            if (!selectedTags.includes(tag)) {
                saveTags([...selectedTags, tag]);
            }
        }
    });

    input.addEventListener("blur", () => {
        setTimeout(() => {
            dropdown.hidden = true;
        }, 150);
    });

    picker.append(input, dropdown);
    container.append(chips, picker);
}
/* ============================================================
   數值表格
   ============================================================ */

function renderMatrixTable() {
    const head = document.getElementById("matrixTableHead");
    const body = document.getElementById("matrixTableBody");
    if (!head || !body) return;

    ensureMatrixTableScrollWrapper();
    document.querySelectorAll(
        '.matrix-color-popup[data-floating="true"]'
    ).forEach(popup => popup.remove());
    head.innerHTML = "";
    body.innerHTML = "";

    const axes = getVisibleMatrixAxes();

    const nameTh = document.createElement("th");
    nameTh.textContent = "角色／操作";
    nameTh.className = "matrix-character-column";
    head.appendChild(nameTh);

    axes.forEach(axis => {
        const th = document.createElement("th");
        th.textContent = `${axis.leftTop} / ${axis.rightBottom}`;
        head.appendChild(th);
    });

    const tagsTh = document.createElement("th");
    tagsTh.textContent = "標籤";
    tagsTh.className = "matrix-tags-column";
    head.appendChild(tagsTh);

    const colorPresets = [
        "#E57373", "#F06292", "#BA68C8", "#9575CD",
        "#7986CB", "#64B5F6", "#4FC3F7", "#4DB6AC",
        "#81C784", "#AED581", "#DCE775", "#FFD54F",
        "#FFB74D", "#A1887F", "#90A4AE", "#555555"
    ];

    characters.forEach(char => {
        const tr = document.createElement("tr");

        if (isMatrixCharacterHidden(char)) {
            tr.classList.add("matrix-hidden-character");
        }

        // 角色名稱與操作
        const nameTd = document.createElement("td");
        nameTd.className = "matrix-character-column";

        const name = document.createElement("strong");
        name.className = "matrix-character-name";
        name.textContent =
            normalizeMatrixCharacterName(char.name) || "未命名";
        nameTd.appendChild(name);

        if (isMatrixCharacterHidden(char)) {
            const mark = document.createElement("span");
            mark.className = "matrix-hidden-mark";
            mark.textContent = "已隱藏";
            nameTd.appendChild(mark);
        }

        const controls = document.createElement("div");
        controls.className = "matrix-character-controls";

        // 顏色選單：平常只顯示目前顏色
        const colorWrap = document.createElement("div");
        colorWrap.className = "matrix-color-picker-wrap";

        const colorButton = document.createElement("button");
        colorButton.type = "button";
        colorButton.className = "matrix-current-color";
        colorButton.style.backgroundColor =
            /^#[0-9a-f]{6}$/i.test(char.color || "")
                ? char.color
                : "#E57373";
        colorButton.title = "更改角色顏色";
        colorButton.setAttribute("aria-label", "更改角色顏色");

        const popup = document.createElement("div");
        popup.className = "matrix-color-popup";
        popup.hidden = true;

        const presets = document.createElement("div");
        presets.className = "matrix-color-presets";

        colorPresets.forEach(preset => {
            const swatch = document.createElement("button");
            swatch.type = "button";
            swatch.className = "matrix-color-swatch";
            swatch.style.backgroundColor = preset;
            swatch.title = preset;
            swatch.setAttribute("aria-label", `選擇顏色 ${preset}`);

            swatch.addEventListener("click", () => {
                char.color = preset;
                saveCharacters(characters);
                drawMatrixChart();
                renderMatrixTable();
            });

            presets.appendChild(swatch);
        });

        const customLabel = document.createElement("label");
        customLabel.className = "matrix-custom-color-label";
        customLabel.textContent = "自訂顏色";

        const customColor = document.createElement("input");
        customColor.type = "color";
        customColor.className = "matrix-custom-color";
        customColor.value = colorButton.style.backgroundColor
            ? (/^#[0-9a-f]{6}$/i.test(char.color || "")
                ? char.color
                : "#E57373")
            : "#E57373";

        customColor.addEventListener("input", () => {
            char.color = customColor.value;
            colorButton.style.backgroundColor = char.color;
            saveCharacters(characters);

            const dot = document.querySelector(
                `.character-dot[data-character-id="${CSS.escape(String(char.id))}"]`
            );
            if (dot) dot.style.backgroundColor = char.color;
        });

        customLabel.appendChild(customColor);
        popup.append(presets, customLabel);

        colorButton.addEventListener("click", () => {
            if (popup.dataset.floating === "true" && popup.isConnected) {
                popup.remove();
                return;
            }

            document.querySelectorAll(
                '.matrix-color-popup[data-floating="true"]'
            ).forEach(item => item.remove());

            document.body.appendChild(popup);
            popup.dataset.floating = "true";
            popup.hidden = false;

            const rect = colorButton.getBoundingClientRect();
            const popupWidth = 150;
            const popupHeight = 110;

            popup.style.position = "fixed";
            popup.style.zIndex = "99999";
            popup.style.left = `${Math.max(
                4,
                Math.min(rect.left, window.innerWidth - popupWidth - 4)
            )}px`;

            popup.style.top = `${Math.max(
                4,
                Math.min(rect.bottom + 4, window.innerHeight - popupHeight - 4)
            )}px`;
        });

        colorWrap.append(colorButton, popup);
        controls.appendChild(colorWrap);

        // 隱藏／恢復：只影響座標圖
        const hide = document.createElement("button");
        hide.type = "button";
        hide.className = "matrix-admin-btn";
        hide.textContent = isMatrixCharacterHidden(char) ? "恢復" : "隱藏";

        hide.addEventListener("click", () => {
            const ids = loadMatrixHiddenCharacterIds();
            const id = String(char.id);

            if (isMatrixCharacterHidden(char)) {
                ids.delete(id);
                char.matrixHidden = false;
            } else {
                ids.add(id);
                char.matrixHidden = true;
            }

            saveMatrixHiddenCharacterIds(ids);
            saveCharacters(characters);

            drawMatrixChart();
            renderMatrixTable();
        });

        // 刪除角色
        const del = document.createElement("button");
        del.type = "button";
        del.className = "matrix-admin-btn matrix-admin-danger";
        del.textContent = "刪除";

        del.addEventListener("click", () => {
            if (!confirm(`確定要永久刪除「${char.name || "未命名"}」嗎？`)) {
                return;
            }

            characters = characters.filter(
                item => String(item.id) !== String(char.id)
            );

            Object.keys(matrixLabelPositions).forEach(key => {
                if (key.split("::")[0] === String(char.id)) {
                    delete matrixLabelPositions[key];
                }
            });

            saveCharacters(characters);
            saveMatrixLabelPositions();
            renderMatrixView();
        });

        controls.append(hide, del);
        nameTd.appendChild(controls);
        tr.appendChild(nameTd);

        // 各座標軸數值
        axes.forEach(axis => {
            const td = document.createElement("td");
            const input = document.createElement("input");

            input.type = "number";
            input.min = "0";
            input.max = "100";
            input.placeholder = "未設定";

            const value = getMatrixValue(char, axis.id);
            input.value = value === null ? "" : value;

            input.addEventListener("change", event => {
                const raw = event.target.value.trim();

                if (!char.matrixValues ||
                    typeof char.matrixValues !== "object") {
                    char.matrixValues = {};
                }

                if (raw === "") {
                    delete char.matrixValues[axis.id];
                } else {
                    const num = Number(raw);

                    if (!Number.isFinite(num)) {
                        event.target.value = "";
                        delete char.matrixValues[axis.id];
                    } else {
                        char.matrixValues[axis.id] = Math.max(
                            0,
                            Math.min(100, Math.round(num))
                        );
                    }
                }

                saveCharacters(characters);
                drawMatrixChart();
                renderMatrixTable();
            });

            td.appendChild(input);
            tr.appendChild(td);
        });

        // 最後一欄：膠囊式標籤編輯器
        const tagsTd = document.createElement("td");
        renderMatrixCharacterTags(char, tagsTd);
        tr.appendChild(tagsTd);

        body.appendChild(tr);
    });
}


/* ============================================================
   座標軸管理清單
   ============================================================ */



function renderMatrixAxisManagement() {
    const container = document.getElementById("matrixAxisList");
    if (!container) return;

    container.innerHTML = "";

    matrixAxes.forEach(axis => {
        const item = document.createElement("div");
        item.className = "matrix-axis-item";

        const nameEditor = document.createElement("div");
        nameEditor.className = "matrix-axis-name-editor";

        const name = document.createElement("span");
        name.className = "matrix-admin-name";
        name.textContent = `${axis.leftTop} ／ ${axis.rightBottom}`;

        const buttons = document.createElement("div");
        buttons.className = "matrix-axis-buttons";

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "btn";
        editBtn.textContent = "編輯";

        const hideBtn = document.createElement("button");
        hideBtn.type = "button";
        hideBtn.className = "btn";
        hideBtn.textContent = axis.matrixHidden ? "恢復顯示" : "隱藏座標軸";

        hideBtn.addEventListener("click", () => {
            if (!axis.matrixHidden) {
                const visibleCount = getVisibleMatrixAxes().length;

                if (visibleCount <= 2) {
                    alert("至少需要保留兩個顯示中的座標軸。");
                    return;
                }
            }

            axis.matrixHidden = !axis.matrixHidden;
            saveMatrixAxes();
            renderMatrixView();
        });

        const reverseBtn = document.createElement("button");
        reverseBtn.type = "button";
        reverseBtn.className = "btn";
        reverseBtn.textContent = "反轉數值";
        reverseBtn.addEventListener("click", () => {
            reverseMatrixAxis(axis.id);
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "btn btn-danger";
        deleteBtn.textContent = "刪除";
        deleteBtn.addEventListener("click", () => {
            deleteMatrixAxis(axis.id);
        });

        editBtn.addEventListener("click", () => {
            nameEditor.innerHTML = "";

            const leftInput = document.createElement("input");
            leftInput.type = "text";
            leftInput.value = axis.leftTop;
            leftInput.placeholder = "左側／上方名稱";

            const separator = document.createElement("span");
            separator.textContent = "／";

            const rightInput = document.createElement("input");
            rightInput.type = "text";
            rightInput.value = axis.rightBottom;
            rightInput.placeholder = "右側／下方名稱";

            const saveBtn = document.createElement("button");
            saveBtn.type = "button";
            saveBtn.className = "btn";
            saveBtn.textContent = "儲存";

            const cancelBtn = document.createElement("button");
            cancelBtn.type = "button";
            cancelBtn.className = "btn";
            cancelBtn.textContent = "取消";

            saveBtn.addEventListener("click", () => {
                const left = removeMatrixEmoji(leftInput.value).trim();
                const right = removeMatrixEmoji(rightInput.value).trim();

                if (!left || !right) {
                    alert("座標軸兩端的名稱都不能留空。");
                    return;
                }

                axis.leftTop = left;
                axis.rightBottom = right;

                saveMatrixAxes();
                renderMatrixView();
            });

            cancelBtn.addEventListener("click", () => {
                renderMatrixAxisManagement();
            });

            nameEditor.append(leftInput, separator, rightInput);
            buttons.innerHTML = "";
            buttons.append(saveBtn, cancelBtn);
        });

        nameEditor.appendChild(name);

        if (axis.matrixHidden) {
            const hiddenMark = document.createElement("span");
            hiddenMark.textContent = "（已隱藏）";
            hiddenMark.className = "matrix-hidden-mark";
            nameEditor.appendChild(hiddenMark);
        }

        buttons.append(editBtn, hideBtn, reverseBtn, deleteBtn);
        item.append(nameEditor, buttons);
        container.appendChild(item);
    });
}

function fixMatrixLayering() {
    const styleId = "matrixLayeringFix";

    let style = document.getElementById(styleId);

    if (!style) {
        style = document.createElement("style");
        style.id = styleId;
        document.head.appendChild(style);
    }

    style.textContent = `
        #matrixExtraPanels {
            position: relative !important;
            z-index: 20 !important;
            width: 100%;
        }

        #matrixDiagonalControl {
            position: relative !important;
            z-index: 20 !important;
            background: white;
            padding: 6px 0;
        }

        #chartCanvas {
            z-index: 1;
        }

        .matrix-table-scroll-wrapper {
            position: relative;
            isolation: isolate;
            max-height: 420px;
            overflow: auto;
        }

        .matrix-table-scroll-wrapper #matrixTableHead th {
            position: sticky !important;
            top: 0 !important;
            z-index: 10 !important;
            background: #f4f4f4 !important;
        }

        .matrix-table-scroll-wrapper th:first-child,
        .matrix-table-scroll-wrapper td:first-child {
            position: sticky;
            left: 0;
            z-index: 5;
        }

        .matrix-table-scroll-wrapper #matrixTableHead th:first-child {
            z-index: 12 !important;
        }
    `;
}