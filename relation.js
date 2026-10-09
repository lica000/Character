// ============================================================
// 角色關係圖
// ============================================================

let characters = [];
let relations = [];
let nodePositions = {};

let isRelationDragEnabled =
    true;

let currentZoom = 1.0;
let panX = 0;
let panY = 0;

let currentTagFilter =
    "ALL";

let relationAppStarted =
    false;


// ============================================================
// 初始化
// ============================================================

function startRelationApp() {

    if (relationAppStarted) {

        renderRelationView();

        return;
    }


    relationAppStarted =
        true;


    initRelationData();

    initPanAndZoom();

    initTagFilter();

    renderRelationView();
}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startRelationApp
    );

} else {

    startRelationApp();
}


// ============================================================
// 視窗大小改變
// ============================================================

window.addEventListener(
    "resize",
    () => {

        if (
            document.getElementById(
                "relationCanvas"
            )
        ) {

            drawRelationChart();
        }
    }
);


// ============================================================
// 初始化資料
// ============================================================

function initRelationData() {

    characters =
        getCharacters();


    // --------------------------------------------------------
    // 關係
    // --------------------------------------------------------

    try {

        const raw =
            localStorage.getItem(
                "oc_relations"
            );


        const savedRelations =
            raw
                ? JSON.parse(raw)
                : [];


        relations =
            Array.isArray(
                savedRelations
            )
                ? savedRelations
                : [];

    } catch (error) {

        console.error(
            "讀取關係資料失敗：",
            error
        );

        relations = [];
    }


    // --------------------------------------------------------
    // 節點位置
    // --------------------------------------------------------

    try {

        const raw =
            localStorage.getItem(
                "oc_relation_positions"
            );


        const savedPositions =
            raw
                ? JSON.parse(raw)
                : {};


        nodePositions =
            savedPositions &&
                typeof savedPositions ===
                "object"
                ? savedPositions
                : {};

    } catch (error) {

        console.error(
            "讀取關係圖位置失敗：",
            error
        );

        nodePositions = {};
    }


    // --------------------------------------------------------
    // 清除不存在角色的關係
    // --------------------------------------------------------

    const validIds =
        new Set(
            characters.map(
                c =>
                    String(c.id)
            )
        );


    const originalRelationLength =
        relations.length;


    relations =
        relations.filter(
            relation =>
                validIds.has(
                    String(
                        relation.from
                    )
                ) &&
                validIds.has(
                    String(
                        relation.to
                    )
                )
        );


    if (
        relations.length !==
        originalRelationLength
    ) {

        localStorage.setItem(
            "oc_relations",
            JSON.stringify(
                relations
            )
        );
    }


    // --------------------------------------------------------
    // 清除不存在角色的位置
    // --------------------------------------------------------

    let positionsChanged =
        false;


    Object.keys(
        nodePositions
    ).forEach(
        id => {

            if (
                !validIds.has(
                    String(id)
                )
            ) {

                delete nodePositions[id];

                positionsChanged =
                    true;
            }
        }
    );


    if (positionsChanged) {

        localStorage.setItem(
            "oc_relation_positions",
            JSON.stringify(
                nodePositions
            )
        );
    }
}


// ============================================================
// 新增角色
// ============================================================

function addCharacterInline() {

    const nameInput =
        document.getElementById(
            "inlineCharNameInput"
        );


    const colorInput =
        document.getElementById(
            "inlineCharColorInput"
        );


    if (!nameInput) return;


    const name =
        nameInput.value.trim();


    if (!name) {

        alert(
            "請輸入角色名稱！"
        );

        return;
    }


    const newChar =
        createCharacterData({

            id:
                Date.now().toString() +
                Math.random()
                    .toString(36)
                    .substring(2, 7),

            name,

            color:
                colorInput?.value ||
                "#4CAF50",

            avatar: "",

            fullBodyAvatar: "",

            tags: [],

            quote: "",

            bio: "",

            matrixValues: {},

            radarValues: {}
        });


    characters.push(
        newChar
    );


    saveCharacters(
        characters
    );


    nameInput.value = "";


    initTagFilter();

    renderRelationView();
}


// ============================================================
// 修改角色顏色
// ============================================================

function updateCharacterColor(
    charId,
    newColor
) {

    const char =
        characters.find(
            c =>
                String(c.id) ===
                String(charId)
        );


    if (!char) return;


    char.color =
        newColor;


    saveCharacters(
        characters
    );


    renderRelationView();
}


// ============================================================
// 平移
// ============================================================

function initPanAndZoom() {

    const viewport =
        document.getElementById(
            "panViewport"
        );


    if (
        !viewport ||
        viewport.dataset.panInited
    ) {

        return;
    }


    viewport.dataset.panInited =
        "true";


    let isPanning =
        false;


    let startX = 0;
    let startY = 0;


    viewport.addEventListener(
        "pointerdown",
        event => {

            if (
                event.target.closest(
                    ".character-dot"
                ) ||
                event.target.closest(
                    ".relation-label"
                )
            ) {

                return;
            }


            isPanning = true;


            startX =
                event.clientX -
                panX;


            startY =
                event.clientY -
                panY;


            viewport.style.cursor =
                "grabbing";


            try {

                viewport.setPointerCapture(
                    event.pointerId
                );

            } catch (error) { }
        }
    );


    viewport.addEventListener(
        "pointermove",
        event => {

            if (!isPanning) return;


            const rawX =
                event.clientX -
                startX;


            const rawY =
                event.clientY -
                startY;


            const maxBoundX =
                viewport.clientWidth *
                0.7;


            const maxBoundY =
                viewport.clientHeight *
                0.7;


            panX =
                Math.max(
                    -maxBoundX,
                    Math.min(
                        maxBoundX,
                        rawX
                    )
                );


            panY =
                Math.max(
                    -maxBoundY,
                    Math.min(
                        maxBoundY,
                        rawY
                    )
                );


            applyTransform();
        }
    );


    const stopPan =
        event => {

            if (!isPanning) return;


            isPanning = false;


            viewport.style.cursor =
                "grab";


            try {

                viewport.releasePointerCapture(
                    event.pointerId
                );

            } catch (error) { }
        };


    viewport.addEventListener(
        "pointerup",
        stopPan
    );


    viewport.addEventListener(
        "pointercancel",
        stopPan
    );
}


// ============================================================
// 縮放
// ============================================================

function zoomRelation(
    delta
) {

    currentZoom =
        Math.min(
            Math.max(
                0.5,
                currentZoom +
                delta
            ),
            2.0
        );


    applyTransform();

    updateTextScaling();
}


// ============================================================
// 重設縮放 / 平移
// ============================================================

function resetRelationViewTransform() {

    currentZoom = 1.0;

    panX = 0;

    panY = 0;


    applyTransform();

    updateTextScaling();
}


// ============================================================
// 套用平移與縮放
// ============================================================

function applyTransform() {

    const container =
        document.getElementById(
            "zoomContainer"
        );


    if (container) {

        container.style.transform =
            `translate(${panX}px, ${panY}px) scale(${currentZoom})`;
    }


    const zoomText =
        document.getElementById(
            "zoomLevelText"
        );


    if (zoomText) {

        zoomText.innerText =
            `${Math.round(
                currentZoom * 100
            )}%`;
    }
}


// ============================================================
// 文字反向縮放
// ============================================================

function updateTextScaling() {

    const invScale =
        1 / currentZoom;


    document
        .querySelectorAll(
            ".relation-label, .character-name-label"
        )
        .forEach(
            element => {

                element.style.transform =
                    `translate(-50%, -50%) scale(${invScale})`;
            }
        );
}


// ============================================================
// 標籤篩選器
// ============================================================

function initTagFilter() {

    const select =
        document.getElementById(
            "tagFilterSelect"
        );


    if (!select) return;


    select.innerHTML = "";


    const allOption =
        document.createElement(
            "option"
        );


    allOption.value =
        "ALL";


    allOption.textContent =
        "顯示全部角色";


    select.appendChild(
        allOption
    );


    const allTags =
        new Set();


    characters.forEach(
        char => {

            (
                Array.isArray(char.tags)
                    ? char.tags
                    : []
            ).forEach(
                tag => {

                    allTags.add(tag);
                }
            );
        }
    );


    Array.from(allTags)
        .sort()
        .forEach(
            tag => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    tag;


                option.textContent =
                    `標籤: ${tag}`;


                select.appendChild(
                    option
                );
            }
        );


    select.value =
        currentTagFilter;
}


// ============================================================
// 篩選角色
// ============================================================

function filterRelationView() {

    const select =
        document.getElementById(
            "tagFilterSelect"
        );


    if (!select) return;


    currentTagFilter =
        select.value;


    renderRelationView();
}


// ============================================================
// 取得篩選後角色
// ============================================================

function getFilteredCharacters() {

    if (
        currentTagFilter ===
        "ALL"
    ) {

        return characters;
    }


    return characters.filter(
        char =>
            Array.isArray(
                char.tags
            ) &&
            char.tags.includes(
                currentTagFilter
            )
    );
}


// ============================================================
// 渲染關係圖頁面
// ============================================================

function renderRelationView() {

    // 不要每次 render 都重新 getCharacters()
    // 否則每次拖曳、修改、縮放都可能重新 JSON.parse。
    //
    // characters 只在：
    // 1. 初始載入
    // 2. 本頁新增角色
    // 3. 顏色修改
    // 時更新。


    const validIds =
        new Set(
            characters.map(
                c =>
                    String(c.id)
            )
        );


    const oldLength =
        relations.length;


    relations =
        relations.filter(
            relation =>
                validIds.has(
                    String(
                        relation.from
                    )
                ) &&
                validIds.has(
                    String(
                        relation.to
                    )
                )
        );


    // 只有真的刪掉無效關係時才寫 localStorage
    if (
        relations.length !==
        oldLength
    ) {

        localStorage.setItem(
            "oc_relations",
            JSON.stringify(
                relations
            )
        );
    }


    renderRelationSelects();

    renderRelationList();

    renderCharacterColorPicker();

    drawRelationChart();
}


// ============================================================
// 角色顏色設定
// ============================================================

function renderCharacterColorPicker() {

    const container =
        document.getElementById(
            "characterColorList"
        );


    if (!container) return;


    container.innerHTML = "";


    const visibleChars =
        getFilteredCharacters();


    visibleChars.forEach(
        char => {

            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.style.cssText =
                "display:flex; align-items:center; gap:6px; background:#f8f9fa; padding:4px 10px; border-radius:20px; border:1px solid #dee2e6; font-size:12px;";


            const colorInput =
                document.createElement(
                    "input"
                );


            colorInput.type =
                "color";


            colorInput.value =
                char.color ||
                "#E57373";


            colorInput.style.cssText =
                "width:20px; height:20px; border:none; background:none; cursor:pointer;";


            colorInput.onchange =
                event => {

                    updateCharacterColor(
                        char.id,
                        event.target.value
                    );
                };


            const name =
                document.createElement(
                    "span"
                );


            name.textContent =
                char.name ||
                "未命名";


            wrapper.appendChild(
                colorInput
            );


            wrapper.appendChild(
                name
            );


            container.appendChild(
                wrapper
            );
        }
    );
}


// ============================================================
// 關係角色選擇器
// ============================================================

function renderRelationSelects() {

    const visibleChars =
        getFilteredCharacters();


    const fromSelect =
        document.getElementById(
            "relFromSelect"
        );


    const toSelect =
        document.getElementById(
            "relToSelect"
        );


    if (
        !fromSelect ||
        !toSelect
    ) {

        return;
    }


    const oldFrom =
        fromSelect.value;


    const oldTo =
        toSelect.value;


    fromSelect.innerHTML = "";

    toSelect.innerHTML = "";


    visibleChars.forEach(
        char => {

            const fromOption =
                document.createElement(
                    "option"
                );


            fromOption.value =
                char.id;


            fromOption.textContent =
                char.name ||
                "未命名";


            const toOption =
                document.createElement(
                    "option"
                );


            toOption.value =
                char.id;


            toOption.textContent =
                char.name ||
                "未命名";


            fromSelect.appendChild(
                fromOption
            );


            toSelect.appendChild(
                toOption
            );
        }
    );


    if (
        visibleChars.some(
            c =>
                String(c.id) ===
                String(oldFrom)
        )
    ) {

        fromSelect.value =
            oldFrom;
    }


    if (
        visibleChars.some(
            c =>
                String(c.id) ===
                String(oldTo)
        )
    ) {

        toSelect.value =
            oldTo;

    } else if (
        toSelect.options.length >
        1
    ) {

        toSelect.selectedIndex =
            1;
    }
}


// ============================================================
// 鎖定 / 解鎖節點
// ============================================================

function toggleRelationDragLock() {

    isRelationDragEnabled =
        !isRelationDragEnabled;


    const button =
        document.getElementById(
            "dragLockBtn"
        );


    if (button) {

        button.innerText =
            isRelationDragEnabled
                ? "🔓 節點拖移啟用中"
                : "🔒 鎖定節點";


        button.style.backgroundColor =
            isRelationDragEnabled
                ? "#212529"
                : "#ffffff";


        button.style.color =
            isRelationDragEnabled
                ? "#ffffff"
                : "#212529";
    }


    drawRelationChart();
}


// ============================================================
// 繪製關係圖
// ============================================================

function drawRelationChart() {

    const canvas =
        document.getElementById(
            "relationCanvas"
        );


    if (!canvas) return;


    canvas.innerHTML = "";


    const rect =
        canvas.getBoundingClientRect();


    const width =
        rect.width ||
        800;


    const height =
        rect.height ||
        450;


    const visibleChars =
        getFilteredCharacters();


    const visibleCharIds =
        new Set(
            visibleChars.map(
                char =>
                    String(char.id)
            )
        );


    const svg =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );


    svg.id =
        "relationSvgRoot";


    svg.setAttribute(
        "width",
        width
    );


    svg.setAttribute(
        "height",
        height
    );


    svg.setAttribute(
        "viewBox",
        `0 0 ${width} ${height}`
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


    const defs =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "defs"
        );


    svg.appendChild(
        defs
    );


    canvas.appendChild(
        svg
    );


    // ========================================================
    // 初始化沒有位置的角色
    // ========================================================

    const total =
        visibleChars.length;


    let positionsChanged =
        false;


    visibleChars.forEach(
        (char, index) => {

            const id =
                String(char.id);


            if (
                !nodePositions[id]
            ) {

                positionsChanged =
                    true;


                if (
                    total === 1
                ) {

                    nodePositions[id] = {

                        x:
                            Math.round(
                                width / 2
                            ),

                        y:
                            Math.round(
                                height / 2
                            )
                    };

                } else {

                    const angle =
                        (index / total) *
                        2 *
                        Math.PI -
                        Math.PI / 2;


                    nodePositions[id] = {

                        x:
                            Math.round(
                                width / 2 +
                                width *
                                0.3 *
                                Math.cos(
                                    angle
                                )
                            ),

                        y:
                            Math.round(
                                height / 2 +
                                height *
                                0.3 *
                                Math.sin(
                                    angle
                                )
                            )
                    };
                }
            }
        }
    );


    // 只有真的新增了位置才寫入 localStorage。
    // resize / zoom / redraw 不會一直寫。
    if (positionsChanged) {

        localStorage.setItem(
            "oc_relation_positions",
            JSON.stringify(
                nodePositions
            )
        );
    }


    // ========================================================
    // 連線
    // ========================================================

    relations.forEach(
        relation => {

            if (
                !visibleCharIds.has(
                    String(
                        relation.from
                    )
                ) ||
                !visibleCharIds.has(
                    String(
                        relation.to
                    )
                )
            ) {

                return;
            }


            const fromPos =
                nodePositions[
                String(
                    relation.from
                )
                ];


            const toPos =
                nodePositions[
                String(
                    relation.to
                )
                ];


            if (
                !fromPos ||
                !toPos
            ) {

                return;
            }


            const dx =
                toPos.x -
                fromPos.x;


            const dy =
                toPos.y -
                fromPos.y;


            const len =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                ) || 1;


            const nx =
                -dy / len;


            const ny =
                dx / len;


            const reverseRelation =
                relations.find(
                    other =>
                        String(
                            other.from
                        ) ===
                        String(
                            relation.to
                        ) &&
                        String(
                            other.to
                        ) ===
                        String(
                            relation.from
                        ) &&
                        String(
                            other.id
                        ) !==
                        String(
                            relation.id
                        )
                );


            const hasReverse =
                !!reverseRelation;


            const offsetDistance =
                hasReverse
                    ? 10
                    : 0;


            const direction =
                hasReverse &&
                    String(
                        relation.id
                    ) >
                    String(
                        reverseRelation.id
                    )
                    ? -1
                    : 1;


            const offsetX =
                nx *
                offsetDistance *
                direction;


            const offsetY =
                ny *
                offsetDistance *
                direction;


            const startX =
                fromPos.x +
                offsetX;


            const startY =
                fromPos.y +
                offsetY;


            const endX =
                toPos.x +
                offsetX;


            const endY =
                toPos.y +
                offsetY;


            const color =
                relation.color ||
                "#6c757d";


            const markerId =
                `marker_${relation.id}`;


            // ------------------------------------------------
            // 箭頭
            // ------------------------------------------------

            if (
                relation.arrow ===
                "forward" ||
                relation.arrow ===
                "both"
            ) {

                const marker =
                    createSVGMarker(
                        markerId,
                        color
                    );


                defs.appendChild(
                    marker
                );
            }


            // ------------------------------------------------
            // 線
            // ------------------------------------------------

            const line =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "line"
                );


            line.id =
                `line_${relation.id}`;


            line.setAttribute(
                "x1",
                startX
            );


            line.setAttribute(
                "y1",
                startY
            );


            line.setAttribute(
                "x2",
                endX
            );


            line.setAttribute(
                "y2",
                endY
            );


            line.setAttribute(
                "stroke",
                color
            );


            line.setAttribute(
                "stroke-width",
                "2"
            );


            if (
                relation.style ===
                "dashed"
            ) {

                line.setAttribute(
                    "stroke-dasharray",
                    "6,4"
                );

            } else if (
                relation.style ===
                "dotted"
            ) {

                line.setAttribute(
                    "stroke-dasharray",
                    "2,3"
                );
            }


            if (
                relation.arrow ===
                "forward"
            ) {

                line.setAttribute(
                    "marker-end",
                    `url(#${markerId})`
                );

            } else if (
                relation.arrow ===
                "both"
            ) {

                line.setAttribute(
                    "marker-start",
                    `url(#${markerId})`
                );


                line.setAttribute(
                    "marker-end",
                    `url(#${markerId})`
                );
            }


            svg.appendChild(
                line
            );


            // ------------------------------------------------
            // 關係文字
            // ------------------------------------------------

            const midX =
                (
                    startX +
                    endX
                ) / 2;


            const midY =
                (
                    startY +
                    endY
                ) / 2;


            const label =
                document.createElement(
                    "div"
                );


            label.id =
                `label_rel_${relation.id}`;


            label.className =
                "relation-label";


            label.style.fontSize =
                "11px";


            label.style.fontWeight =
                "bold";


            label.style.color =
                color;


            label.style.border =
                `1px solid ${color}`;


            label.style.padding =
                "2px 6px";


            label.style.borderRadius =
                "10px";


            label.style.backgroundColor =
                "#ffffff";


            label.style.boxShadow =
                "0 2px 4px rgba(0,0,0,0.1)";


            label.style.position =
                "absolute";


            label.style.left =
                `${midX}px`;


            label.style.top =
                `${midY}px`;


            label.style.zIndex =
                "3";


            label.style.whiteSpace =
                "nowrap";


            label.style.transform =
                `translate(-50%, -50%) scale(${1 / currentZoom})`;


            label.innerText =
                relation.label ||
                "關係";


            canvas.appendChild(
                label
            );
        }
    );


    // ========================================================
    // 角色節點
    // ========================================================

    visibleChars.forEach(
        char => {

            const id =
                String(char.id);


            const pos =
                nodePositions[id];


            if (!pos) return;


            // ------------------------------------------------
            // 圓點
            // ------------------------------------------------

            const dot =
                document.createElement(
                    "div"
                );


            dot.id =
                `dot_${id}`;


            dot.className =
                `character-dot ${isRelationDragEnabled
                    ? "draggable"
                    : ""
                }`;


            dot.style.backgroundColor =
                char.color ||
                "#E57373";


            dot.style.width =
                "18px";


            dot.style.height =
                "18px";


            dot.style.borderRadius =
                "50%";


            dot.style.border =
                "2px solid #ffffff";


            dot.style.boxShadow =
                "0 2px 4px rgba(0,0,0,0.2)";


            dot.style.position =
                "absolute";


            dot.style.transform =
                "translate(-50%, -50%)";


            dot.style.left =
                `${pos.x}px`;


            dot.style.top =
                `${pos.y}px`;


            dot.style.zIndex =
                "4";


            if (
                isRelationDragEnabled
            ) {

                makeRelationDraggable(
                    dot,
                    id,
                    canvas
                );
            }


            canvas.appendChild(
                dot
            );


            // ------------------------------------------------
            // 名稱
            // ------------------------------------------------

            const nameLabel =
                document.createElement(
                    "div"
                );


            nameLabel.id =
                `namelbl_${id}`;


            nameLabel.className =
                "character-name-label";


            nameLabel.style.position =
                "absolute";


            nameLabel.style.fontSize =
                "12px";


            nameLabel.style.fontWeight =
                "bold";


            nameLabel.style.color =
                "#212529";


            nameLabel.style.textShadow =
                "0 1px 2px #fff, 0 -1px 2px #fff, 1px 0 2px #fff, -1px 0 2px #fff";


            nameLabel.innerText =
                char.name ||
                "未命名";


            nameLabel.style.left =
                `${pos.x}px`;


            nameLabel.style.top =
                `${pos.y + 14}px`;


            nameLabel.style.zIndex =
                "4";


            nameLabel.style.whiteSpace =
                "nowrap";


            nameLabel.style.transform =
                `translate(-50%, 0) scale(${1 / currentZoom})`;


            canvas.appendChild(
                nameLabel
            );
        }
    );
}


// ============================================================
// SVG 箭頭
// ============================================================

function createSVGMarker(
    id,
    color
) {

    const marker =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "marker"
        );


    marker.setAttribute(
        "id",
        id
    );


    marker.setAttribute(
        "viewBox",
        "0 0 10 10"
    );


    marker.setAttribute(
        "refX",
        "16"
    );


    marker.setAttribute(
        "refY",
        "5"
    );


    marker.setAttribute(
        "markerWidth",
        "5"
    );


    marker.setAttribute(
        "markerHeight",
        "5"
    );


    marker.setAttribute(
        "orient",
        "auto-start-reverse"
    );


    const path =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
        );


    path.setAttribute(
        "d",
        "M 0 0 L 10 5 L 0 10 z"
    );


    path.setAttribute(
        "fill",
        color
    );


    marker.appendChild(
        path
    );


    return marker;
}


// ============================================================
// 拖曳角色節點
// ============================================================

function makeRelationDraggable(
    element,
    charId,
    container
) {

    let isDragging =
        false;


    element.onpointerdown =
        event => {

            isDragging = true;


            element.setPointerCapture(
                event.pointerId
            );


            event.stopPropagation();
        };


    element.onpointermove =
        event => {

            if (!isDragging) return;


            const rect =
                container.getBoundingClientRect();


            let xPx =
                (
                    event.clientX -
                    rect.left -
                    panX
                ) /
                currentZoom;


            let yPx =
                (
                    event.clientY -
                    rect.top -
                    panY
                ) /
                currentZoom;


            xPx =
                Math.max(
                    15,
                    Math.min(
                        rect.width -
                        15,
                        xPx
                    )
                );


            yPx =
                Math.max(
                    15,
                    Math.min(
                        rect.height -
                        15,
                        yPx
                    )
                );


            nodePositions[
                String(charId)
            ] = {

                x:
                    Math.round(
                        xPx
                    ),

                y:
                    Math.round(
                        yPx
                    )
            };


            updateElementPositionsLive(
                String(charId)
            );
        };


    element.onpointerup =
        event => {

            if (!isDragging) return;


            isDragging = false;


            try {

                element.releasePointerCapture(
                    event.pointerId
                );

            } catch (error) { }


            // 只有拖曳結束才儲存。
            localStorage.setItem(
                "oc_relation_positions",
                JSON.stringify(
                    nodePositions
                )
            );
        };


    element.onpointercancel =
        event => {

            if (!isDragging) return;


            isDragging = false;


            try {

                element.releasePointerCapture(
                    event.pointerId
                );

            } catch (error) { }
        };
}


// ============================================================
// 拖曳時即時更新線與文字
// ============================================================

function updateElementPositionsLive(
    movedCharId
) {

    const pos =
        nodePositions[
        String(movedCharId)
        ];


    if (!pos) return;


    const dot =
        document.getElementById(
            `dot_${movedCharId}`
        );


    const nameLabel =
        document.getElementById(
            `namelbl_${movedCharId}`
        );


    if (dot) {

        dot.style.left =
            `${pos.x}px`;


        dot.style.top =
            `${pos.y}px`;
    }


    if (nameLabel) {

        nameLabel.style.left =
            `${pos.x}px`;


        nameLabel.style.top =
            `${pos.y + 14}px`;
    }


    relations.forEach(
        relation => {

            if (
                String(
                    relation.from
                ) !==
                String(
                    movedCharId
                ) &&
                String(
                    relation.to
                ) !==
                String(
                    movedCharId
                )
            ) {

                return;
            }


            const fromPos =
                nodePositions[
                String(
                    relation.from
                )
                ];


            const toPos =
                nodePositions[
                String(
                    relation.to
                )
                ];


            if (
                !fromPos ||
                !toPos
            ) {

                return;
            }


            const dx =
                toPos.x -
                fromPos.x;


            const dy =
                toPos.y -
                fromPos.y;


            const len =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                ) || 1;


            const nx =
                -dy / len;


            const ny =
                dx / len;


            const reverseRelation =
                relations.find(
                    other =>
                        String(
                            other.from
                        ) ===
                        String(
                            relation.to
                        ) &&
                        String(
                            other.to
                        ) ===
                        String(
                            relation.from
                        ) &&
                        String(
                            other.id
                        ) !==
                        String(
                            relation.id
                        )
                );


            const hasReverse =
                !!reverseRelation;


            const offsetDistance =
                hasReverse
                    ? 10
                    : 0;


            const direction =
                hasReverse &&
                    reverseRelation &&
                    String(
                        relation.id
                    ) >
                    String(
                        reverseRelation.id
                    )
                    ? -1
                    : 1;


            const offsetX =
                nx *
                offsetDistance *
                direction;


            const offsetY =
                ny *
                offsetDistance *
                direction;


            const startX =
                fromPos.x +
                offsetX;


            const startY =
                fromPos.y +
                offsetY;


            const endX =
                toPos.x +
                offsetX;


            const endY =
                toPos.y +
                offsetY;


            const line =
                document.getElementById(
                    `line_${relation.id}`
                );


            if (line) {

                line.setAttribute(
                    "x1",
                    startX
                );


                line.setAttribute(
                    "y1",
                    startY
                );


                line.setAttribute(
                    "x2",
                    endX
                );


                line.setAttribute(
                    "y2",
                    endY
                );
            }


            const label =
                document.getElementById(
                    `label_rel_${relation.id}`
                );


            if (label) {

                label.style.left =
                    `${(
                        startX +
                        endX
                    ) / 2}px`;


                label.style.top =
                    `${(
                        startY +
                        endY
                    ) / 2}px`;
            }
        }
    );
}


// ============================================================
// 儲存關係
// ============================================================

function saveRelation() {

    const editingInput =
        document.getElementById(
            "editingRelId"
        );


    const fromSelect =
        document.getElementById(
            "relFromSelect"
        );


    const toSelect =
        document.getElementById(
            "relToSelect"
        );


    const labelInput =
        document.getElementById(
            "relLabelInput"
        );


    const arrowSelect =
        document.getElementById(
            "relArrowSelect"
        );


    const styleSelect =
        document.getElementById(
            "relStyleSelect"
        );


    const colorInput =
        document.getElementById(
            "relColorInput"
        );


    if (
        !editingInput ||
        !fromSelect ||
        !toSelect ||
        !labelInput ||
        !arrowSelect ||
        !styleSelect ||
        !colorInput
    ) {

        return;
    }


    const editingId =
        editingInput.value;


    const from =
        fromSelect.value;


    const to =
        toSelect.value;


    const label =
        labelInput.value.trim() ||
        "關係";


    const arrow =
        arrowSelect.value;


    const style =
        styleSelect.value;


    const color =
        colorInput.value;


    if (
        !from ||
        !to
    ) {

        alert(
            "目前沒有足夠的角色可以建立關係。"
        );

        return;
    }


    if (
        from === to
    ) {

        alert(
            "不能建立角色與自己的連線！"
        );

        return;
    }


    if (editingId) {

        const relation =
            relations.find(
                r =>
                    String(r.id) ===
                    String(editingId)
            );


        if (relation) {

            relation.from =
                from;

            relation.to =
                to;

            relation.label =
                label;

            relation.arrow =
                arrow;

            relation.style =
                style;

            relation.color =
                color;
        }

    } else {

        relations.push({

            id:
                `r_${Date.now()}_${Math.random()
                    .toString(36)
                    .substring(2, 6)}`,

            from,

            to,

            label,

            arrow,

            style,

            color
        });
    }


    localStorage.setItem(
        "oc_relations",
        JSON.stringify(
            relations
        )
    );


    resetRelationForm();

    renderRelationView();
}


// ============================================================
// 編輯關係
// ============================================================

function editRelation(
    relationId
) {

    const relation =
        relations.find(
            r =>
                String(r.id) ===
                String(relationId)
        );


    if (!relation) return;


    const fromSelect =
        document.getElementById(
            "relFromSelect"
        );


    const toSelect =
        document.getElementById(
            "relToSelect"
        );


    const labelInput =
        document.getElementById(
            "relLabelInput"
        );


    const arrowSelect =
        document.getElementById(
            "relArrowSelect"
        );


    const styleSelect =
        document.getElementById(
            "relStyleSelect"
        );


    const colorInput =
        document.getElementById(
            "relColorInput"
        );


    const editingInput =
        document.getElementById(
            "editingRelId"
        );


    if (
        !fromSelect ||
        !toSelect ||
        !labelInput ||
        !arrowSelect ||
        !styleSelect ||
        !colorInput ||
        !editingInput
    ) {

        return;
    }


    editingInput.value =
        relation.id;


    fromSelect.value =
        relation.from;


    toSelect.value =
        relation.to;


    labelInput.value =
        relation.label ||
        "";


    arrowSelect.value =
        relation.arrow ||
        "forward";


    styleSelect.value =
        relation.style ||
        "solid";


    colorInput.value =
        relation.color ||
        "#6c757d";


    const title =
        document.getElementById(
            "relationFormTitle"
        );


    const saveButton =
        document.getElementById(
            "saveRelBtn"
        );


    const cancelButton =
        document.getElementById(
            "cancelEditBtn"
        );


    if (title) {

        title.innerText =
            "編輯連線關係";
    }


    if (saveButton) {

        saveButton.innerText =
            "💾 儲存修改";
    }


    if (cancelButton) {

        cancelButton.style.display =
            "inline-block";
    }
}


// ============================================================
// 重設關係表單
// ============================================================

function resetRelationForm() {

    const editingInput =
        document.getElementById(
            "editingRelId"
        );


    const labelInput =
        document.getElementById(
            "relLabelInput"
        );


    const title =
        document.getElementById(
            "relationFormTitle"
        );


    const saveButton =
        document.getElementById(
            "saveRelBtn"
        );


    const cancelButton =
        document.getElementById(
            "cancelEditBtn"
        );


    if (editingInput) {

        editingInput.value =
            "";
    }


    if (labelInput) {

        labelInput.value =
            "";
    }


    if (title) {

        title.innerText =
            "建立/編輯連線關係";
    }


    if (saveButton) {

        saveButton.innerText =
            "＋ 建立連線";
    }


    if (cancelButton) {

        cancelButton.style.display =
            "none";
    }
}


// ============================================================
// 關係列表
// ============================================================

function renderRelationList() {

    const container =
        document.getElementById(
            "relationList"
        );


    if (!container) return;


    container.innerHTML = "";


    relations.forEach(
        relation => {

            const c1 =
                characters.find(
                    char =>
                        String(
                            char.id
                        ) ===
                        String(
                            relation.from
                        )
                );


            const c2 =
                characters.find(
                    char =>
                        String(
                            char.id
                        ) ===
                        String(
                            relation.to
                        )
                );


            if (
                !c1 ||
                !c2
            ) {

                return;
            }


            const arrowSymbol =
                relation.arrow ===
                    "both"
                    ? "⇄"
                    : relation.arrow ===
                        "none"
                        ? "──"
                        : "➔";


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "matrix-axis-item";


            item.innerHTML = `
        <div
          style="
            display:flex;
            align-items:center;
            gap:8px;
            flex-wrap:wrap;
          "
        >

          <span
            style="
              display:inline-block;
              width:12px;
              height:12px;
              border-radius:50%;
              background-color:${escapeHtml(
                relation.color ||
                "#6c757d"
            )};
            "
          ></span>

          <strong>
            ${escapeHtml(
                c1.name ||
                "未命名"
            )}
          </strong>

          ${arrowSymbol}

          <span class="tag-badge">
            ${escapeHtml(
                relation.label ||
                "關係"
            )}
          </span>

          ${arrowSymbol}

          <strong>
            ${escapeHtml(
                c2.name ||
                "未命名"
            )}
          </strong>

        </div>

        <div
          style="
            display:flex;
            gap:4px;
          "
        >

          <button
            class="btn"
            style="
              font-size:11px;
              padding:2px 8px;
            "
            onclick="editRelation('${escapeHtmlAttribute(
                relation.id
            )}')"
          >
            編輯
          </button>

          <button
            class="btn btn-danger"
            style="
              font-size:11px;
              padding:2px 8px;
            "
            onclick="deleteRelation('${escapeHtmlAttribute(
                relation.id
            )}')"
          >
            刪除
          </button>

        </div>
      `;


            container.appendChild(
                item
            );
        }
    );
}


// ============================================================
// 刪除關係
// ============================================================

function deleteRelation(
    relationId
) {

    const confirmed =
        confirm(
            "確定要刪除這條關係嗎？"
        );


    if (!confirmed) {
        return;
    }


    relations =
        relations.filter(
            relation =>
                String(
                    relation.id
                ) !==
                String(
                    relationId
                )
        );


    localStorage.setItem(
        "oc_relations",
        JSON.stringify(
            relations
        )
    );


    renderRelationView();
}


// ============================================================
// HTML 跳脫
// ============================================================

function escapeHtml(
    value
) {

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


function escapeHtmlAttribute(
    value
) {

    return escapeHtml(
        value
    );
}