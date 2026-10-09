// ============================================================
// 雷達圖
// ============================================================

let characters = getCharacters();

let radarStats =
    loadRadarStats();

let currentRadarCharId =
    characters[0]?.id || "";


// ============================================================
// 頁面初始化
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {
        renderRadarView();
    }
);


// ============================================================
// 讀取雷達圖指標
// ============================================================

function loadRadarStats() {

    try {

        const raw =
            localStorage.getItem(
                "oc_radar_stats"
            );

        if (raw) {

            const saved =
                JSON.parse(raw);

            if (
                Array.isArray(saved) &&
                saved.length >= 3
            ) {
                return saved;
            }
        }

    } catch (error) {

        console.error(
            "讀取雷達圖指標失敗：",
            error
        );
    }


    const defaults = [
        "力量",
        "敏捷",
        "智力",
        "體力",
        "魅力"
    ];


    localStorage.setItem(
        "oc_radar_stats",
        JSON.stringify(defaults)
    );


    return defaults;
}


// ============================================================
// 渲染整個雷達圖頁面
// ============================================================

function renderRadarView() {

    // 頁面重新渲染時不需要一直重新讀 localStorage。
    // 只有角色資料在本頁被修改時，直接使用目前的 characters。
    //
    // 這可以避免每次切換角色 / 增刪指標都重新 JSON.parse
    // 整份角色資料。

    if (
        !characters.some(
            c =>
                String(c.id) ===
                String(currentRadarCharId)
        )
    ) {

        currentRadarCharId =
            characters[0]?.id || "";
    }


    renderRadarSelect();

    renderRadarSliders();

    drawRadarCanvas();
}


// ============================================================
// 角色選擇
// ============================================================

function renderRadarSelect() {

    const select =
        document.getElementById(
            "radarCharSelect"
        );

    if (!select) return;


    select.innerHTML = "";


    characters.forEach(
        char => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                char.id;


            option.textContent =
                char.name ||
                "未命名";


            select.appendChild(
                option
            );
        }
    );


    if (currentRadarCharId) {

        select.value =
            currentRadarCharId;
    }
}


// ============================================================
// 切換角色
// ============================================================

function changeRadarCharacter(
    charId
) {

    currentRadarCharId =
        charId;


    renderRadarSliders();

    drawRadarCanvas();
}


// ============================================================
// 取得雷達數值
// ============================================================

function getRadarValue(
    char,
    stat
) {

    if (
        char.radarValues &&
        char.radarValues[stat] !== undefined
    ) {

        const value =
            Number(
                char.radarValues[stat]
            );


        if (
            !Number.isNaN(value)
        ) {

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
// 繪製雷達圖
// ============================================================

function drawRadarCanvas() {

    const canvas =
        document.getElementById(
            "radarCanvas"
        );

    if (!canvas) return;


    const ctx =
        canvas.getContext("2d");

    if (!ctx) return;


    const char =
        characters.find(
            c =>
                String(c.id) ===
                String(currentRadarCharId)
        );


    const width =
        canvas.width;

    const height =
        canvas.height;

    const centerX =
        width / 2;

    const centerY =
        height / 2;

    const radius =
        120;

    const total =
        radarStats.length;


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    if (!char) {

        ctx.font =
            "14px sans-serif";

        ctx.fillStyle =
            "#6c757d";

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";

        ctx.fillText(
            "目前沒有角色",
            centerX,
            centerY
        );

        return;
    }


    if (total < 3) {

        ctx.font =
            "14px sans-serif";

        ctx.fillStyle =
            "#6c757d";

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";

        ctx.fillText(
            "最少需要 3 個能力指標才能繪製雷達圖",
            centerX,
            centerY
        );

        return;
    }


    // ========================================================
    // 背景網格
    // ========================================================

    for (
        let level = 1;
        level <= 5;
        level++
    ) {

        const r =
            (radius / 5) *
            level;


        ctx.beginPath();


        for (
            let i = 0;
            i < total;
            i++
        ) {

            const angle =
                (i / total) *
                2 *
                Math.PI -
                Math.PI / 2;


            const x =
                centerX +
                r *
                Math.cos(angle);


            const y =
                centerY +
                r *
                Math.sin(angle);


            if (i === 0) {

                ctx.moveTo(
                    x,
                    y
                );

            } else {

                ctx.lineTo(
                    x,
                    y
                );
            }
        }


        ctx.closePath();


        ctx.strokeStyle =
            "#dee2e6";

        ctx.lineWidth =
            1;

        ctx.stroke();
    }


    // ========================================================
    // 放射線與標籤
    // ========================================================

    ctx.font =
        "12px sans-serif";

    ctx.fillStyle =
        "#343a40";

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";


    for (
        let i = 0;
        i < total;
        i++
    ) {

        const angle =
            (i / total) *
            2 *
            Math.PI -
            Math.PI / 2;


        const x =
            centerX +
            radius *
            Math.cos(angle);


        const y =
            centerY +
            radius *
            Math.sin(angle);


        ctx.beginPath();


        ctx.moveTo(
            centerX,
            centerY
        );


        ctx.lineTo(
            x,
            y
        );


        ctx.strokeStyle =
            "#ced4da";

        ctx.lineWidth =
            1;

        ctx.stroke();


        const labelX =
            centerX +
            (radius + 20) *
            Math.cos(angle);


        const labelY =
            centerY +
            (radius + 20) *
            Math.sin(angle);


        ctx.fillText(
            radarStats[i],
            labelX,
            labelY
        );
    }


    // ========================================================
    // 角色數值
    // ========================================================

    if (!char.radarValues) {

        char.radarValues = {};
    }


    ctx.beginPath();


    radarStats.forEach(
        (stat, index) => {

            const val =
                getRadarValue(
                    char,
                    stat
                );


            const r =
                (radius * val) /
                100;


            const angle =
                (index / total) *
                2 *
                Math.PI -
                Math.PI / 2;


            const x =
                centerX +
                r *
                Math.cos(angle);


            const y =
                centerY +
                r *
                Math.sin(angle);


            if (index === 0) {

                ctx.moveTo(
                    x,
                    y
                );

            } else {

                ctx.lineTo(
                    x,
                    y
                );
            }
        }
    );


    ctx.closePath();


    const color =
        char.color ||
        "#E57373";


    ctx.fillStyle =
        color + "40";

    ctx.fill();


    ctx.strokeStyle =
        color;

    ctx.lineWidth =
        2;

    ctx.stroke();


    // ========================================================
    // 數值點
    // ========================================================

    radarStats.forEach(
        (stat, index) => {

            const val =
                getRadarValue(
                    char,
                    stat
                );


            const r =
                (radius * val) /
                100;


            const angle =
                (index / total) *
                2 *
                Math.PI -
                Math.PI / 2;


            const x =
                centerX +
                r *
                Math.cos(angle);


            const y =
                centerY +
                r *
                Math.sin(angle);


            ctx.beginPath();


            ctx.arc(
                x,
                y,
                3,
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                color;

            ctx.fill();
        }
    );
}


// ============================================================
// 渲染能力滑桿
// ============================================================

function renderRadarSliders() {

    const container =
        document.getElementById(
            "radarSlidersContainer"
        );

    if (!container) return;


    container.innerHTML = "";


    const char =
        characters.find(
            c =>
                String(c.id) ===
                String(currentRadarCharId)
        );


    if (!char) return;


    if (!char.radarValues) {

        char.radarValues = {};
    }


    radarStats.forEach(
        stat => {

            const val =
                getRadarValue(
                    char,
                    stat
                );


            const row =
                document.createElement(
                    "div"
                );


            row.style.cssText =
                "display:flex; align-items:center; gap:12px; font-size:13px;";


            const name =
                document.createElement(
                    "span"
                );


            name.style.cssText =
                "width:70px; font-weight:bold;";


            name.textContent =
                stat;


            const slider =
                document.createElement(
                    "input"
                );


            slider.type =
                "range";

            slider.min =
                "0";

            slider.max =
                "100";

            slider.value =
                val;

            slider.style.flex =
                "1";


            const valueText =
                document.createElement(
                    "span"
                );


            valueText.style.cssText =
                "width:30px; text-align:right;";


            valueText.textContent =
                val;


            const deleteButton =
                document.createElement(
                    "button"
                );


            deleteButton.className =
                "btn btn-danger";


            deleteButton.style.cssText =
                "font-size:10px; padding:2px 6px;";


            deleteButton.textContent =
                "×";


            // ------------------------------------------------
            // 重要：
            // input 時只修改記憶體，不寫 localStorage。
            // ------------------------------------------------

            slider.oninput =
                event => {

                    const newValue =
                        parseInt(
                            event.target.value,
                            10
                        );


                    if (!char.radarValues) {

                        char.radarValues = {};
                    }


                    char.radarValues[
                        stat
                    ] =
                        newValue;


                    valueText.textContent =
                        newValue;


                    drawRadarCanvas();
                };


            // 放開滑桿後才儲存一次
            slider.onchange =
                () => {

                    saveCharacters(
                        characters
                    );
                };


            deleteButton.onclick =
                () => {

                    deleteRadarStat(
                        stat
                    );
                };


            row.appendChild(
                name
            );

            row.appendChild(
                slider
            );

            row.appendChild(
                valueText
            );

            row.appendChild(
                deleteButton
            );


            container.appendChild(
                row
            );
        }
    );
}


// ============================================================
// 新增能力指標
// ============================================================

function addRadarStat() {

    const input =
        document.getElementById(
            "newStatInput"
        );

    if (!input) return;


    const stat =
        input.value.trim();


    if (!stat) {
        return;
    }


    if (
        radarStats.includes(stat)
    ) {

        alert(
            "這個能力指標已經存在！"
        );

        return;
    }


    radarStats.push(
        stat
    );


    localStorage.setItem(
        "oc_radar_stats",
        JSON.stringify(
            radarStats
        )
    );


    input.value = "";


    renderRadarView();
}


// ============================================================
// 刪除能力指標
// ============================================================

function deleteRadarStat(
    stat
) {

    if (
        radarStats.length <= 3
    ) {

        alert(
            "最少需保留 3 個能力指標！"
        );

        return;
    }


    const confirmed =
        confirm(
            `確定要刪除「${stat}」這個能力指標嗎？`
        );


    if (!confirmed) return;


    radarStats =
        radarStats.filter(
            s =>
                s !== stat
        );


    characters.forEach(
        char => {

            if (
                char.radarValues
            ) {

                delete char.radarValues[
                    stat
                ];
            }
        }
    );


    localStorage.setItem(
        "oc_radar_stats",
        JSON.stringify(
            radarStats
        )
    );


    saveCharacters(
        characters
    );


    renderRadarView();
}