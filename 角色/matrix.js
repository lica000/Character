// ============================================================
// 雙軸座標圖
// ============================================================

let characters = getCharacters();

let matrixAxes = loadMatrixAxes();

let currentXAxisId =
    matrixAxes[0]?.id || "";

let currentYAxisId =
    matrixAxes[1]?.id ||
    matrixAxes[0]?.id ||
    "";

let isMatrixDragEnabled = false;


// ============================================================
// 頁面初始化
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {
        renderMatrixView();
    }
);


// ============================================================
// 載入座標軸
// ============================================================

function loadMatrixAxes() {
    try {
        const raw =
            localStorage.getItem(
                "oc_matrix_axes"
            );

        if (raw) {
            const saved =
                JSON.parse(raw);

            if (
                Array.isArray(saved) &&
                saved.length >= 2
            ) {
                return saved;
            }
        }

    } catch (error) {
        console.error(
            "讀取座標軸失敗：",
            error
        );
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


// ============================================================
// 渲染整個座標圖頁面
// ============================================================

function renderMatrixView() {

    if (
        !Array.isArray(matrixAxes) ||
        matrixAxes.length < 2
    ) {
        matrixAxes =
            loadMatrixAxes();
    }


    ensureCurrentAxes();

    renderMatrixAxisSelects();
    renderMatrixAxisManagement();
    renderCommonAxes();
    renderMatrixTable();
    drawMatrixChart();
}


// ============================================================
// 確認目前選擇的 X / Y 軸仍存在
// ============================================================

function ensureCurrentAxes() {

    if (
        !matrixAxes.some(
            axis =>
                String(axis.id) ===
                String(currentXAxisId)
        )
    ) {
        currentXAxisId =
            matrixAxes[0]?.id || "";
    }


    if (
        !matrixAxes.some(
            axis =>
                String(axis.id) ===
                String(currentYAxisId)
        )
    ) {
        currentYAxisId =
            matrixAxes[1]?.id ||
            matrixAxes[0]?.id ||
            "";
    }
}


// ============================================================
// X / Y 軸選擇器
// ============================================================

function renderMatrixAxisSelects() {

    const xSelect =
        document.getElementById(
            "matrixXAxisSelect"
        );

    const ySelect =
        document.getElementById(
            "matrixYAxisSelect"
        );


    if (!xSelect || !ySelect) {
        return;
    }


    xSelect.innerHTML = "";
    ySelect.innerHTML = "";


    matrixAxes.forEach(axis => {

        const text =
            `${axis.leftTop} / ${axis.rightBottom}`;


        const optX =
            document.createElement(
                "option"
            );

        optX.value =
            axis.id;

        optX.textContent =
            text;


        const optY =
            document.createElement(
                "option"
            );

        optY.value =
            axis.id;

        optY.textContent =
            text;


        xSelect.appendChild(
            optX
        );

        ySelect.appendChild(
            optY
        );
    });


    xSelect.value =
        currentXAxisId;

    ySelect.value =
        currentYAxisId;
}


// ============================================================
// 切換 X / Y 軸
// ============================================================

function changeMatrixAxis(
    type,
    id
) {

    if (type === "x") {
        currentXAxisId = id;
    }


    if (type === "y") {
        currentYAxisId = id;
    }


    drawMatrixChart();
    renderMatrixTable();
}


// ============================================================
// 開關拖移模式
// ============================================================

function toggleMatrixDragLock() {

    isMatrixDragEnabled =
        !isMatrixDragEnabled;


    const btn =
        document.getElementById(
            "dragLockBtn"
        );


    if (btn) {

        btn.innerText =
            isMatrixDragEnabled
                ? "🔓 拖移模式啟用中"
                : "🔒 啟用拖移編輯";


        btn.style.backgroundColor =
            isMatrixDragEnabled
                ? "#212529"
                : "#ffffff";


        btn.style.color =
            isMatrixDragEnabled
                ? "#ffffff"
                : "#212529";
    }


    drawMatrixChart();
}


// ============================================================
// 取得角色某條軸的數值
// ============================================================

function getMatrixValue(
    char,
    axisId
) {

    if (
        char.matrixValues &&
        char.matrixValues[axisId] !== undefined
    ) {

        const value =
            Number(
                char.matrixValues[axisId]
            );


        if (!Number.isNaN(value)) {

            return Math.max(
                0,
                Math.min(
                    100,
                    value
                )
            );
        }
    }


    return 50;
}


// ============================================================
// 繪製座標圖
// ============================================================

function drawMatrixChart() {

    const canvas =
        document.getElementById(
            "chartCanvas"
        );


    if (!canvas) {
        return;
    }


    canvas.innerHTML = "";


    const xAxis =
        matrixAxes.find(
            axis =>
                String(axis.id) ===
                String(currentXAxisId)
        );


    const yAxis =
        matrixAxes.find(
            axis =>
                String(axis.id) ===
                String(currentYAxisId)
        );


    if (!xAxis || !yAxis) {
        return;
    }


    // --------------------------------------------------------
    // 軸文字
    // --------------------------------------------------------

    const leftLabel =
        document.getElementById(
            "leftLabel"
        );

    const rightLabel =
        document.getElementById(
            "rightLabel"
        );

    const topLabel =
        document.getElementById(
            "topLabel"
        );

    const bottomLabel =
        document.getElementById(
            "bottomLabel"
        );


    if (leftLabel) {
        leftLabel.innerText =
            xAxis.leftTop;
    }


    if (rightLabel) {
        rightLabel.innerText =
            xAxis.rightBottom;
    }


    if (topLabel) {
        topLabel.innerText =
            yAxis.leftTop;
    }


    if (bottomLabel) {
        bottomLabel.innerText =
            yAxis.rightBottom;
    }


    // --------------------------------------------------------
    // SVG：處理重疊角色的連接線
    // --------------------------------------------------------

    const svg =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );


    svg.setAttribute(
        "width",
        "100%"
    );

    svg.setAttribute(
        "height",
        "100%"
    );

    svg.setAttribute(
        "viewBox",
        "0 0 100 100"
    );


    svg.style.position =
        "absolute";

    svg.style.left =
        "0";

    svg.style.top =
        "0";

    svg.style.pointerEvents =
        "none";

    svg.style.zIndex =
        "2";


    canvas.appendChild(
        svg
    );


    // --------------------------------------------------------
    // 將相同座標的角色分組
    // --------------------------------------------------------

    const posGroups = new Map();


    characters.forEach(char => {

        if (
            !char.matrixValues ||
            typeof char.matrixValues !== "object"
        ) {
            char.matrixValues = {};
        }


        const xVal =
            getMatrixValue(
                char,
                xAxis.id
            );

        const yVal =
            getMatrixValue(
                char,
                yAxis.id
            );


        const key =
            `${xVal},${yVal}`;


        if (!posGroups.has(key)) {
            posGroups.set(
                key,
                []
            );
        }


        posGroups
            .get(key)
            .push(char);
    });


    // --------------------------------------------------------
    // 角色
    // --------------------------------------------------------

    characters.forEach(char => {

        const xVal =
            getMatrixValue(
                char,
                xAxis.id
            );

        const yVal =
            getMatrixValue(
                char,
                yAxis.id
            );


        // X：左 = 100，右 = 0
        const left =
            100 - xVal;


        // Y：上 = 100，下 = 0
        const top =
            100 - yVal;


        // ----------------------------------------------------
        // 角色圓點
        // ----------------------------------------------------

        const dot =
            document.createElement(
                "div"
            );


        dot.className =
            `character-dot ${isMatrixDragEnabled
                ? "draggable"
                : ""
            }`;


        dot.style.backgroundColor =
            char.color ||
            "#E57373";


        dot.style.left =
            `${left}%`;


        dot.style.top =
            `${top}%`;


        dot.title =
            `${char.name || "未命名"} ` +
            `(X:${xVal}, Y:${yVal})`;


        if (isMatrixDragEnabled) {

            makeDraggable(
                dot,
                char,
                xAxis.id,
                yAxis.id,
                canvas
            );
        }


        canvas.appendChild(
            dot
        );


        // ----------------------------------------------------
        // 同座標角色的名稱位置
        // ----------------------------------------------------

        const key =
            `${xVal},${yVal}`;


        const group =
            posGroups.get(key) || [];


        const index =
            group.indexOf(char);


        let offsetX = 0;
        let offsetY = 10;


        if (group.length > 1) {

            const offsets = [
                [-20, 10],
                [20, 10],
                [-20, 24],
                [20, 24],
                [0, 38],
                [0, 52]
            ];


            const offset =
                offsets[
                index %
                offsets.length
                ];


            offsetX =
                offset[0];

            offsetY =
                offset[1];


            // ----------------------------------------------
            // 連接線
            // ----------------------------------------------

            const line =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "line"
                );


            line.setAttribute(
                "x1",
                left
            );


            line.setAttribute(
                "y1",
                top
            );


            const pxToPercentX =
                100 /
                Math.max(
                    canvas.offsetWidth,
                    1
                );


            const pxToPercentY =
                100 /
                Math.max(
                    canvas.offsetHeight,
                    1
                );


            line.setAttribute(
                "x2",
                left +
                offsetX *
                pxToPercentX
            );


            line.setAttribute(
                "y2",
                top +
                offsetY *
                pxToPercentY
            );


            line.setAttribute(
                "stroke",
                char.color ||
                "#343a40"
            );


            line.setAttribute(
                "stroke-width",
                "0.35"
            );


            svg.appendChild(
                line
            );
        }


        // ----------------------------------------------------
        // 角色名稱
        // ----------------------------------------------------

        const label =
            document.createElement(
                "div"
            );


        label.className =
            "character-name-label";


        label.innerText =
            char.name ||
            "未命名";


        label.style.left =
            `calc(${left}% + ${offsetX}px)`;


        label.style.top =
            `calc(${top}% + ${offsetY}px)`;


        canvas.appendChild(
            label
        );
    });
}


// ============================================================
// 拖移角色
// ============================================================

function makeDraggable(
    element,
    char,
    xAxisId,
    yAxisId,
    container
) {

    let isDragging = false;


    element.onpointerdown =
        event => {

            isDragging =
                true;


            element.setPointerCapture(
                event.pointerId
            );


            event.stopPropagation();
        };


    element.onpointermove =
        event => {

            if (!isDragging) {
                return;
            }


            const rect =
                container.getBoundingClientRect();


            if (
                rect.width <= 0 ||
                rect.height <= 0
            ) {
                return;
            }


            let xPx =
                event.clientX -
                rect.left;


            let yPx =
                event.clientY -
                rect.top;


            xPx =
                Math.max(
                    0,
                    Math.min(
                        rect.width,
                        xPx
                    )
                );


            yPx =
                Math.max(
                    0,
                    Math.min(
                        rect.height,
                        yPx
                    )
                );


            const leftPercent =
                (
                    xPx /
                    rect.width
                ) *
                100;


            const topPercent =
                (
                    yPx /
                    rect.height
                ) *
                100;


            if (
                !char.matrixValues ||
                typeof char.matrixValues !== "object"
            ) {
                char.matrixValues = {};
            }


            char.matrixValues[
                xAxisId
            ] =
                Math.round(
                    100 -
                    leftPercent
                );


            char.matrixValues[
                yAxisId
            ] =
                Math.round(
                    100 -
                    topPercent
                );


            // 拖曳期間只改畫面
            // 不寫 localStorage
            element.style.left =
                `${leftPercent}%`;


            element.style.top =
                `${topPercent}%`;
        };


    element.onpointerup =
        event => {

            if (!isDragging) {
                return;
            }


            isDragging =
                false;


            try {

                element.releasePointerCapture(
                    event.pointerId
                );

            } catch (error) {
                // 已經釋放就不用處理
            }


            // 放開後才真正儲存
            saveCharacters(
                characters
            );


            drawMatrixChart();
            renderMatrixTable();
        };


    element.onpointercancel =
        event => {

            if (!isDragging) {
                return;
            }


            isDragging =
                false;


            try {

                element.releasePointerCapture(
                    event.pointerId
                );

            } catch (error) {
                // ignore
            }
        };
}


// ============================================================
// 表格
// ============================================================

function renderMatrixTable() {

    const head =
        document.getElementById(
            "matrixTableHead"
        );


    const body =
        document.getElementById(
            "matrixTableBody"
        );


    if (!head || !body) {
        return;
    }


    head.innerHTML = "";
    body.innerHTML = "";


    // --------------------------------------------------------
    // 表頭
    // --------------------------------------------------------

    const nameTh =
        document.createElement(
            "th"
        );


    nameTh.innerText =
        "角色名稱";


    head.appendChild(
        nameTh
    );


    matrixAxes.forEach(axis => {

        const th =
            document.createElement(
                "th"
            );


        th.innerText =
            `${axis.leftTop} / ${axis.rightBottom}`;


        head.appendChild(
            th
        );
    });


    // --------------------------------------------------------
    // 角色
    // --------------------------------------------------------

    characters.forEach(char => {

        const tr =
            document.createElement(
                "tr"
            );


        const nameTd =
            document.createElement(
                "td"
            );


        nameTd.style.fontWeight =
            "bold";


        nameTd.innerText =
            char.name ||
            "未命名";


        tr.appendChild(
            nameTd
        );


        matrixAxes.forEach(axis => {

            const td =
                document.createElement(
                    "td"
                );


            const input =
                document.createElement(
                    "input"
                );


            input.type =
                "number";

            input.min =
                "0";

            input.max =
                "100";


            input.value =
                getMatrixValue(
                    char,
                    axis.id
                );


            input.onchange =
                event => {

                    let num =
                        parseInt(
                            event.target.value,
                            10
                        );


                    if (
                        Number.isNaN(num)
                    ) {
                        num = 50;
                    }


                    num =
                        Math.max(
                            0,
                            Math.min(
                                100,
                                num
                            )
                        );


                    if (
                        !char.matrixValues ||
                        typeof char.matrixValues !== "object"
                    ) {
                        char.matrixValues = {};
                    }


                    char.matrixValues[
                        axis.id
                    ] =
                        num;


                    saveCharacters(
                        characters
                    );


                    drawMatrixChart();
                };


            td.appendChild(
                input
            );


            tr.appendChild(
                td
            );
        });


        body.appendChild(
            tr
        );
    });
}


// ============================================================
// 從座標圖建立角色
// ============================================================

function addCharacterFromMatrix() {

    const defaultColor =
        DEFAULT_COLORS[
        characters.length %
        DEFAULT_COLORS.length
        ];


    const newChar = {

        id:
            Date.now().toString() +
            Math.random()
                .toString(36)
                .substring(2, 7),

        name:
            `新角色_${characters.length + 1}`,

        color:
            defaultColor,

        avatar: "",
        fullBodyAvatar: "",

        tags: [],

        quote: "",
        bio: "",

        matrixValues: {},
        radarValues: {}
    };


    characters.push(
        newChar
    );


    saveCharacters(
        characters
    );


    renderMatrixView();
}


// ============================================================
// 座標軸管理
// ============================================================

function renderMatrixAxisManagement() {

    const container =
        document.getElementById(
            "matrixAxisList"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    matrixAxes.forEach(axis => {

        const item =
            document.createElement(
                "div"
            );


        item.className =
            "matrix-axis-item";


        const left =
            escapeHtml(
                axis.leftTop
            );


        const right =
            escapeHtml(
                axis.rightBottom
            );


        item.innerHTML = `
      <div>
        <strong>
          ${left} / ${right}
        </strong>
      </div>

      <div
        style="
          display:flex;
          gap:6px;
        "
      >

        <button
          class="btn"
          style="
            font-size:11px;
            padding:2px 8px;
          "
          onclick="
            reverseMatrixAxis('${escapeHtmlAttribute(axis.id)}')
          "
        >
          反轉數值
        </button>

        <button
          class="btn btn-danger"
          style="
            font-size:11px;
            padding:2px 8px;
          "
          onclick="
            deleteMatrixAxis('${escapeHtmlAttribute(axis.id)}')
          "
        >
          刪除
        </button>

      </div>
    `;


        container.appendChild(
            item
        );
    });
}


// ============================================================
// 反轉座標軸
// ============================================================

function reverseMatrixAxis(axisId) {

    const axis =
        matrixAxes.find(
            a =>
                String(a.id) ===
                String(axisId)
        );


    if (!axis) {
        return;
    }


    const temp =
        axis.leftTop;


    axis.leftTop =
        axis.rightBottom;


    axis.rightBottom =
        temp;


    characters.forEach(char => {

        if (
            char.matrixValues &&
            char.matrixValues[axisId] !== undefined
        ) {

            const oldValue =
                Number(
                    char.matrixValues[
                    axisId
                    ]
                );


            if (!Number.isNaN(oldValue)) {

                char.matrixValues[
                    axisId
                ] =
                    100 -
                    oldValue;
            }
        }
    });


    saveMatrixAxes();
    saveCharacters(
        characters
    );


    renderMatrixView();
}


// ============================================================
// 新增自訂座標軸
// ============================================================

function addNewAxisFromInput() {

    const leftInput =
        document.getElementById(
            "newAxisLeftInput"
        );


    const rightInput =
        document.getElementById(
            "newAxisRightInput"
        );


    if (
        !leftInput ||
        !rightInput
    ) {
        return;
    }


    const left =
        leftInput.value.trim();


    const right =
        rightInput.value.trim();


    if (!left || !right) {

        alert(
            "請輸入座標軸兩端名稱！"
        );

        return;
    }


    matrixAxes.push({

        id:
            `axis_${Date.now()}_${Math.random()
                .toString(36)
                .substring(2, 6)}`,

        leftTop:
            left,

        rightBottom:
            right
    });


    saveMatrixAxes();


    leftInput.value =
        "";

    rightInput.value =
        "";


    renderMatrixView();
}


// ============================================================
// 刪除座標軸
// ============================================================

function deleteMatrixAxis(axisId) {

    if (
        matrixAxes.length <= 2
    ) {

        alert(
            "最少保留兩個座標軸！"
        );

        return;
    }


    const axis =
        matrixAxes.find(
            a =>
                String(a.id) ===
                String(axisId)
        );


    if (!axis) {
        return;
    }


    const confirmed =
        confirm(
            `確定要刪除「${axis.leftTop} / ${axis.rightBottom}」嗎？`
        );


    if (!confirmed) {
        return;
    }


    matrixAxes =
        matrixAxes.filter(
            a =>
                String(a.id) !==
                String(axisId)
        );


    characters.forEach(char => {

        if (char.matrixValues) {

            delete char.matrixValues[
                axisId
            ];
        }
    });


    ensureCurrentAxes();


    saveMatrixAxes();

    saveCharacters(
        characters
    );


    renderMatrixView();
}


// ============================================================
// 常用座標軸
// ============================================================

const COMMON_AXES_PRESETS = [

    [
        "理性",
        "感性"
    ],

    [
        "秩序",
        "混沌"
    ],

    [
        "外向",
        "內向"
    ],

    [
        "可愛",
        "性感"
    ],

    [
        "天才",
        "努力家"
    ],

    [
        "怪人",
        "常識人"
    ]
];


// ============================================================
// 常用座標軸列表
// ============================================================

function renderCommonAxes() {

    const container =
        document.getElementById(
            "commonAxesList"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    COMMON_AXES_PRESETS.forEach(
        pair => {

            const btn =
                document.createElement(
                    "button"
                );


            btn.className =
                "common-axis-btn";


            btn.innerText =
                `＋ ${pair[0]} / ${pair[1]}`;


            btn.onclick =
                () => {

                    const exists =
                        matrixAxes.some(
                            axis =>
                                axis.leftTop ===
                                pair[0] &&
                                axis.rightBottom ===
                                pair[1]
                        );


                    if (exists) {
                        return;
                    }


                    matrixAxes.push({

                        id:
                            `axis_${Date.now()}_${Math.random()
                                .toString(36)
                                .substring(2, 6)}`,

                        leftTop:
                            pair[0],

                        rightBottom:
                            pair[1]
                    });


                    saveMatrixAxes();

                    renderMatrixView();
                };


            container.appendChild(
                btn
            );
        }
    );
}


// ============================================================
// 匯出文字
// ============================================================

function generateExportText() {

    const headers = [
        "角色",

        ...matrixAxes.map(
            axis =>
                `${axis.leftTop}/${axis.rightBottom}`
        ),

        "標籤"
    ];


    const lines = [
        headers.join(" ")
    ];


    characters.forEach(char => {

        const values =
            matrixAxes.map(
                axis =>
                    getMatrixValue(
                        char,
                        axis.id
                    )
            );


        const tags =
            Array.isArray(char.tags)
                ? char.tags.map(
                    tag =>
                        `#${tag}`
                )
                : [];


        lines.push(
            [
                char.name ||
                "未命名",

                ...values,

                ...tags
            ].join(" ")
        );
    });


    const area =
        document.getElementById(
            "matrixIOTextarea"
        );


    if (area) {

        area.value =
            lines.join("\n");
    }
}


// ============================================================
// 複製匯出文字
// ============================================================

async function copyExportText() {

    const area =
        document.getElementById(
            "matrixIOTextarea"
        );


    if (!area) {
        return;
    }


    if (!area.value) {
        generateExportText();
    }


    try {

        await navigator.clipboard.writeText(
            area.value
        );


        alert(
            "複製成功！"
        );

    } catch (error) {

        area.select();

        document.execCommand(
            "copy"
        );


        alert(
            "複製成功！"
        );
    }
}


// ============================================================
// 從文字匯入
// ============================================================

function importDataFromText() {

    const area =
        document.getElementById(
            "matrixIOTextarea"
        );


    if (!area) {
        return;
    }


    const text =
        area.value.trim();


    if (!text) {
        return;
    }


    const lines =
        text
            .split(/\r?\n/)
            .map(
                line =>
                    line.trim()
            )
            .filter(Boolean);


    if (lines.length < 2) {

        alert(
            "格式不足！"
        );

        return;
    }


    const headers =
        lines[0].split(
            /\s+/
        );


    if (
        headers[0] !== "角色"
    ) {

        alert(
            "第一欄必須是「角色」！"
        );

        return;
    }


    lines
        .slice(1)
        .forEach(line => {

            const tagMatches =
                line.match(
                    /#[^\s#]+/g
                ) || [];


            const cleanLine =
                line
                    .replace(
                        /#[^\s#]+/g,
                        ""
                    )
                    .trim();


            const parts =
                cleanLine.split(
                    /\s+/
                );


            const name =
                parts.shift();


            if (!name) {
                return;
            }


            const newChar = {

                id:
                    Date.now().toString() +
                    Math.random()
                        .toString(36)
                        .substring(2, 7),

                name,

                color:
                    DEFAULT_COLORS[
                    characters.length %
                    DEFAULT_COLORS.length
                    ],

                avatar: "",
                fullBodyAvatar: "",

                quote: "",
                bio: "",

                tags:
                    tagMatches.map(
                        tag =>
                            tag.slice(1)
                    ),

                matrixValues: {},
                radarValues: {}
            };


            matrixAxes.forEach(
                (axis, index) => {

                    const val =
                        parseInt(
                            parts[index],
                            10
                        );


                    newChar.matrixValues[
                        axis.id
                    ] =
                        Number.isNaN(val)
                            ? 50
                            : Math.max(
                                0,
                                Math.min(
                                    100,
                                    val
                                )
                            );
                }
            );


            characters.push(
                newChar
            );
        });


    saveCharacters(
        characters
    );


    renderMatrixView();


    alert(
        "匯入完成！"
    );
}


// ============================================================
// 儲存座標軸
// ============================================================

function saveMatrixAxes() {

    localStorage.setItem(
        "oc_matrix_axes",
        JSON.stringify(
            matrixAxes
        )
    );
}


// ============================================================
// HTML 跳脫
// ============================================================

function escapeHtml(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


function escapeHtmlAttribute(value) {
    return escapeHtml(value);
}