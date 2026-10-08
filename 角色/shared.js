// ============================================================
// OC Hub 共用資料與功能
// ============================================================

const DEFAULT_AVATAR_SVG =
    "data:image/svg+xml;utf8," +
    "<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'>" +
    "<rect width='100%' height='100%' fill='%23e9ecef'/>" +
    "<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23adb5bd' font-size='14'>無圖片</text>" +
    "</svg>";

const DEFAULT_COLORS = [
    "#E57373",
    "#FFB74D",
    "#FFF176",
    "#81C784",
    "#4DD0E1",
    "#7986CB",
    "#BA68C8",
    "#A1887F"
];


// ============================================================
// 角色資料格式化
// ============================================================

function createCharacterData(data = {}) {
    return {
        id: data.id || Date.now().toString(),
        name: data.name || "新角色",
        color: data.color || DEFAULT_COLORS[0],

        avatar: data.avatar || "",
        fullBodyAvatar: data.fullBodyAvatar || "",

        tags: Array.isArray(data.tags)
            ? data.tags
            : [],

        quote: data.quote || "",
        bio: data.bio || "",

        matrixValues:
            data.matrixValues &&
                typeof data.matrixValues === "object"
                ? data.matrixValues
                : {},

        radarValues:
            data.radarValues &&
                typeof data.radarValues === "object"
                ? data.radarValues
                : {}
    };
}


// ============================================================
// 讀取角色
// ============================================================

function getCharacters() {
    try {
        const rawData = localStorage.getItem("oc_characters");

        // 第一次開啟網站
        if (!rawData) {
            const sample = getSampleData();

            // 重要：
            // 把預設角色真正存進 localStorage，
            // 避免不同頁面各自產生一份「暫時的預設資料」。
            saveCharacters(sample);

            return sample;
        }

        const parsed = JSON.parse(rawData);

        // 資料格式錯誤
        if (!Array.isArray(parsed)) {
            const sample = getSampleData();
            saveCharacters(sample);
            return sample;
        }

        return parsed.map(createCharacterData);

    } catch (error) {
        console.error("讀取角色資料失敗：", error);

        // localStorage 資料損壞時，
        // 不直接覆蓋原資料，先讓目前頁面使用預設資料。
        return getSampleData();
    }
}


// ============================================================
// 預設角色
// ============================================================

function getSampleData() {
    return [
        createCharacterData({
            id: "1",
            name: "星野 霖",
            color: "#E57373",

            avatar: "",
            fullBodyAvatar: "",

            tags: [
                "主角",
                "魔法師"
            ],

            quote: "只要星光還沒熄滅，我就不會放棄。",
            bio: "皇家魔法學院三年生。",

            matrixValues: {},

            radarValues: {
                "力量": 70,
                "敏捷": 85,
                "智力": 90,
                "體力": 60,
                "魅力": 80
            }
        }),

        createCharacterData({
            id: "2",
            name: "陸 沉",
            color: "#7986CB",

            avatar: "",
            fullBodyAvatar: "",

            tags: [
                "騎士",
                "副隊長"
            ],

            quote: "守護此處是我的職責。",
            bio: "皇家衛隊副隊長。",

            matrixValues: {},

            radarValues: {
                "力量": 95,
                "敏捷": 60,
                "智力": 75,
                "體力": 90,
                "魅力": 70
            }
        })
    ];
}


// ============================================================
// 儲存角色
// ============================================================

function saveCharacters(chars) {
    try {
        const normalizedCharacters = Array.isArray(chars)
            ? chars.map(createCharacterData)
            : [];

        localStorage.setItem(
            "oc_characters",
            JSON.stringify(normalizedCharacters)
        );

    } catch (error) {
        console.error("儲存角色資料失敗：", error);

        alert(
            "⚠ 儲存失敗！可能是瀏覽器儲存空間已滿。"
        );
    }
}


// ============================================================
// 清除角色相關資料
// ============================================================

function cleanupCharacterReferences(characterIds) {
    const ids = new Set(
        characterIds.map(id => String(id))
    );


    // --------------------------------------------------------
    // 清除關係
    // --------------------------------------------------------

    try {
        const relations = JSON.parse(
            localStorage.getItem("oc_relations") || "[]"
        );

        const cleanedRelations = Array.isArray(relations)
            ? relations.filter(relation => {
                const fromId = String(relation.from);
                const toId = String(relation.to);

                return (
                    !ids.has(fromId) &&
                    !ids.has(toId)
                );
            })
            : [];

        localStorage.setItem(
            "oc_relations",
            JSON.stringify(cleanedRelations)
        );

    } catch (error) {
        console.error(
            "清理關係資料失敗：",
            error
        );
    }


    // --------------------------------------------------------
    // 清除關係圖位置
    // --------------------------------------------------------

    try {
        const positions = JSON.parse(
            localStorage.getItem(
                "oc_relation_positions"
            ) || "{}"
        );

        ids.forEach(id => {
            delete positions[id];
        });

        localStorage.setItem(
            "oc_relation_positions",
            JSON.stringify(positions)
        );

    } catch (error) {
        console.error(
            "清理關係圖位置失敗：",
            error
        );
    }
}


// ============================================================
// 重置所有資料
// ============================================================

function resetToDefaultData() {
    const confirmed = confirm(
        "確定要清空所有資料，重置為最初開頁狀態嗎？\n\n" +
        "這會刪除你建立的所有自訂角色、座標、關係與雷達圖資料。"
    );

    if (!confirmed) {
        return;
    }

    localStorage.removeItem("oc_characters");
    localStorage.removeItem("oc_matrix_axes");
    localStorage.removeItem("oc_relations");
    localStorage.removeItem("oc_radar_stats");
    localStorage.removeItem("oc_relation_positions");

    location.reload();
}


// ============================================================
// 選單
// ============================================================

function toggleMenu() {
    const menu = document.getElementById(
        "dropdownMenu"
    );

    if (menu) {
        menu.classList.toggle("show");
    }
}


// 點擊選單外面時關閉選單
window.addEventListener("click", event => {
    if (
        !event.target.closest(
            ".menu-dropdown-container"
        )
    ) {
        const menu = document.getElementById(
            "dropdownMenu"
        );

        if (menu) {
            menu.classList.remove("show");
        }
    }
});