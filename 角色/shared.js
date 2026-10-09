// ============================================================
// OC Hub - 共用資料核心
// ============================================================
//
// 新資料主要儲存在：
//     oc_hub_data
//
// 為了讓目前舊版頁面可以繼續運作，
// 暫時保留：
//     oc_characters
//     oc_relations
//     oc_radar_stats
//     oc_relation_positions
//     oc_matrix_axes
//
// 之後等各頁面逐步改完，再移除舊格式。
// ============================================================


// ============================================================
// 預設資料
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


const OC_DATA_KEY = "oc_hub_data";


// ============================================================
// ID
// ============================================================

function makeId(prefix = "id") {
    return (
        prefix +
        "_" +
        Date.now().toString(36) +
        "_" +
        Math.random()
            .toString(36)
            .slice(2, 8)
    );
}


// ============================================================
// 建立角色資料
// ============================================================
//
// 注意：
// 目前舊版頁面還會直接修改：
//     char.color
//     char.avatar
//     char.fullBodyAvatar
//
// 所以在相容期間，舊欄位優先。
// 同時仍然寫入新版結構。
// ============================================================

function createCharacterData(data = {}) {

    // --------------------------------------------------------
    // 顏色
    // --------------------------------------------------------

    const representativeColor =
        data.color ??
        data.appearance?.representativeColor ??
        DEFAULT_COLORS[0];


    // --------------------------------------------------------
    // 頭像
    // --------------------------------------------------------

    const avatar =
        data.avatar ??
        data.images?.avatar ??
        "";


    // --------------------------------------------------------
    // 立繪
    // --------------------------------------------------------

    const fullBody =
        data.fullBodyAvatar ??
        data.images?.fullBody ??
        "";


    return {

        // ----------------------------------------------------
        // 基本
        // ----------------------------------------------------

        id:
            data.id ||
            makeId("char"),

        name:
            data.name ||
            "新角色",


        // ----------------------------------------------------
        // 舊版欄位
        // ----------------------------------------------------
        // 暫時不能刪，舊頁面還在使用。

        color:
            representativeColor,

        avatar:
            avatar,

        fullBodyAvatar:
            fullBody,


        // ----------------------------------------------------
        // 新版圖片結構
        // ----------------------------------------------------
        // 之後詳細頁會再擴充成多張圖片、
        // 不同時期、表情、服裝等等。
        //
        // 現階段先保持目前結構，不破壞舊頁面。

        images: {

            avatar:
                avatar,

            fullBody:
                fullBody,

            other:
                Array.isArray(data.images?.other)
                    ? data.images.other
                    : []
        },


        // ----------------------------------------------------
        // 基本資料
        // ----------------------------------------------------

        basic: {

            height:
                data.basic?.height ??
                data.height ??
                null,

            age:
                data.basic?.age ??
                data.age ??
                "",

            birthday:
                data.basic?.birthday ??
                data.birthday ??
                "",

            gender:
                data.basic?.gender ??
                data.gender ??
                "",

            occupation:
                data.basic?.occupation ??
                data.occupation ??
                ""
        },


        // ----------------------------------------------------
        // 外觀
        // ----------------------------------------------------

        appearance: {

            representativeColor:
                representativeColor,

            hairColor:
                data.appearance?.hairColor ??
                "",

            eyeColor:
                data.appearance?.eyeColor ??
                ""
        },


        // ----------------------------------------------------
        // 其他角色資料
        // ----------------------------------------------------

        tags:
            Array.isArray(data.tags)
                ? [...data.tags]
                : [],

        quote:
            data.quote ||
            "",

        bio:
            data.bio ||
            "",

        customFields:
            Array.isArray(data.customFields)
                ? [...data.customFields]
                : [],


        // ----------------------------------------------------
        // 座標圖
        // ----------------------------------------------------

        matrixValues:
            data.matrixValues &&
                typeof data.matrixValues === "object"
                ? { ...data.matrixValues }
                : {},


        // ----------------------------------------------------
        // 雷達圖
        // ----------------------------------------------------

        radarValues:
            data.radarValues &&
                typeof data.radarValues === "object"
                ? { ...data.radarValues }
                : {}
    };
}


// ============================================================
// 建立完整 OCData
// ============================================================

function createDefaultOCData() {

    return {

        version: 1,

        // 所有角色
        characters: [],

        // 座標圖、雷達圖等圖表
        charts: [],

        // 角色之間的關係
        relations: [],

        // 團體
        groups: [],

        // 世界時間軸
        timelines: [],

        // 每個角色詳細頁的版面
        pageLayouts: {},

        // 全站設定
        settings: {}
    };
}


// ============================================================
// 範例角色
// ============================================================
//
// 注意：角色名稱故意不使用空格。
// 之後匯入格式也以「不含空格的角色名稱」為前提。
// ============================================================

function getSampleData() {

    return [

        createCharacterData({

            id: "1",

            name: "星野-霖",

            color: "#E57373",

            avatar: "",

            fullBodyAvatar: "",

            tags: [
                "主角",
                "魔法師"
            ],

            quote:
                "只要星光還沒熄滅，我就不會放棄。",

            bio:
                "皇家魔法學院三年生。",

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

            name: "陸-沉",

            color: "#7986CB",

            avatar: "",

            fullBodyAvatar: "",

            tags: [
                "騎士",
                "副隊長"
            ],

            quote:
                "守護此處是我的職責。",

            bio:
                "皇家衛隊副隊長。",

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
// 正規化完整資料
// ============================================================

function normalizeOCData(data) {

    const result =
        createDefaultOCData();


    if (
        !data ||
        typeof data !== "object"
    ) {
        return result;
    }


    result.version =
        Number(data.version) || 1;


    // --------------------------------------------------------
    // 角色
    // --------------------------------------------------------

    result.characters =
        Array.isArray(data.characters)
            ? data.characters.map(
                createCharacterData
            )
            : [];


    // --------------------------------------------------------
    // 圖表
    // --------------------------------------------------------

    result.charts =
        Array.isArray(data.charts)
            ? data.charts
            : [];


    // --------------------------------------------------------
    // 關係
    // --------------------------------------------------------

    result.relations =
        Array.isArray(data.relations)
            ? data.relations
            : [];


    // --------------------------------------------------------
    // 團體
    // --------------------------------------------------------

    result.groups =
        Array.isArray(data.groups)
            ? data.groups
            : [];


    // --------------------------------------------------------
    // 時間軸
    // --------------------------------------------------------

    result.timelines =
        Array.isArray(data.timelines)
            ? data.timelines
            : [];


    // --------------------------------------------------------
    // 詳細頁版面
    // --------------------------------------------------------

    result.pageLayouts =
        data.pageLayouts &&
            typeof data.pageLayouts === "object"
            ? data.pageLayouts
            : {};


    // --------------------------------------------------------
    // 全站設定
    // --------------------------------------------------------

    result.settings =
        data.settings &&
            typeof data.settings === "object"
            ? data.settings
            : {};


    return result;
}


// ============================================================
// 讀取完整 OCData
// ============================================================

function loadOCData() {

    try {

        const raw =
            localStorage.getItem(
                OC_DATA_KEY
            );


        // 沒有新格式
        // → 嘗試從舊資料轉換

        if (!raw) {
            return migrateOldData();
        }


        const parsed =
            JSON.parse(raw);


        if (
            !parsed ||
            typeof parsed !== "object"
        ) {
            return migrateOldData();
        }


        return normalizeOCData(
            parsed
        );

    } catch (error) {

        console.error(
            "讀取 OC Hub 資料失敗：",
            error
        );

        return migrateOldData();
    }
}


// ============================================================
// 儲存完整 OCData
// ============================================================

function saveOCData(data) {

    try {

        const normalized =
            normalizeOCData(data);


        localStorage.setItem(
            OC_DATA_KEY,
            JSON.stringify(
                normalized
            )
        );


        return true;

    } catch (error) {

        console.error(
            "儲存 OC Hub 資料失敗：",
            error
        );


        alert(
            "儲存失敗！可能是瀏覽器儲存空間已滿。"
        );


        return false;
    }
}


// ============================================================
// 舊資料 → 新資料
// ============================================================

function migrateOldData() {

    const data =
        createDefaultOCData();

    let migrated = false;


    // --------------------------------------------------------
    // 角色
    // --------------------------------------------------------

    try {

        const raw =
            localStorage.getItem(
                "oc_characters"
            );


        if (raw) {

            const parsed =
                JSON.parse(raw);


            if (
                Array.isArray(parsed)
            ) {

                data.characters =
                    parsed.map(
                        createCharacterData
                    );

                migrated = true;
            }
        }

    } catch (error) {

        console.error(
            "轉換舊角色資料失敗：",
            error
        );
    }


    // --------------------------------------------------------
    // 關係
    // --------------------------------------------------------

    try {

        const raw =
            localStorage.getItem(
                "oc_relations"
            );


        if (raw) {

            const parsed =
                JSON.parse(raw);


            if (
                Array.isArray(parsed)
            ) {

                data.relations =
                    parsed;

                migrated = true;
            }
        }

    } catch (error) {

        console.error(
            "轉換舊關係資料失敗：",
            error
        );
    }


    // --------------------------------------------------------
    // 雷達圖
    // --------------------------------------------------------

    try {

        const raw =
            localStorage.getItem(
                "oc_radar_stats"
            );


        if (raw) {

            const parsed =
                JSON.parse(raw);


            if (
                Array.isArray(parsed)
            ) {

                // 暫時放在 settings
                // 等 radar.js 改版後再搬到 charts

                data.settings.radarStats =
                    parsed;

                migrated = true;
            }
        }

    } catch (error) {

        console.error(
            "轉換舊雷達圖資料失敗：",
            error
        );
    }


    // --------------------------------------------------------
    // 關係圖位置
    // --------------------------------------------------------

    try {

        const raw =
            localStorage.getItem(
                "oc_relation_positions"
            );


        if (raw) {

            const parsed =
                JSON.parse(raw);


            if (
                parsed &&
                typeof parsed === "object"
            ) {

                data.settings.relationPositions =
                    parsed;

                migrated = true;
            }
        }

    } catch (error) {

        console.error(
            "轉換舊關係圖位置失敗：",
            error
        );
    }


    // --------------------------------------------------------
    // 座標軸
    // --------------------------------------------------------

    try {

        const raw =
            localStorage.getItem(
                "oc_matrix_axes"
            );


        if (raw) {

            const parsed =
                JSON.parse(raw);


            if (
                Array.isArray(parsed)
            ) {

                // 暫時保留在 settings
                // 等 matrix.js 改成多座標圖後再搬

                data.settings.matrixAxes =
                    parsed;

                migrated = true;
            }
        }

    } catch (error) {

        console.error(
            "轉換舊座標軸資料失敗：",
            error
        );
    }


    // --------------------------------------------------------
    // 完全沒有舊資料
    // → 建立範例角色
    // --------------------------------------------------------

    if (
        !migrated &&
        data.characters.length === 0
    ) {

        data.characters =
            getSampleData();
    }


    // --------------------------------------------------------
    // 儲存新格式
    // --------------------------------------------------------

    saveOCData(data);


    // 同步目前舊格式
    syncLegacyData(data);


    return data;
}


// ============================================================
// 舊格式同步
// ============================================================
//
// 新資料是主資料。
// 舊 localStorage 只是暫時讓舊頁面繼續工作。
// ============================================================

function syncLegacyData(data) {

    try {

        // ----------------------------------------------------
        // 角色
        // ----------------------------------------------------

        localStorage.setItem(
            "oc_characters",
            JSON.stringify(
                data.characters
            )
        );


        // ----------------------------------------------------
        // 關係
        // ----------------------------------------------------

        localStorage.setItem(
            "oc_relations",
            JSON.stringify(
                data.relations
            )
        );


        // ----------------------------------------------------
        // 雷達圖
        // ----------------------------------------------------

        if (
            data.settings &&
            Array.isArray(
                data.settings.radarStats
            )
        ) {

            localStorage.setItem(
                "oc_radar_stats",
                JSON.stringify(
                    data.settings.radarStats
                )
            );
        }


        // ----------------------------------------------------
        // 關係圖位置
        // ----------------------------------------------------

        if (
            data.settings &&
            data.settings.relationPositions &&
            typeof data.settings.relationPositions === "object"
        ) {

            localStorage.setItem(
                "oc_relation_positions",
                JSON.stringify(
                    data.settings.relationPositions
                )
            );
        }


        // ----------------------------------------------------
        // 座標軸
        // ----------------------------------------------------

        if (
            data.settings &&
            Array.isArray(
                data.settings.matrixAxes
            )
        ) {

            localStorage.setItem(
                "oc_matrix_axes",
                JSON.stringify(
                    data.settings.matrixAxes
                )
            );
        }

    } catch (error) {

        console.error(
            "同步舊格式資料失敗：",
            error
        );
    }
}


// ============================================================
// 取得角色
// ============================================================

function getCharacters() {

    const data =
        loadOCData();


    return data.characters;
}


// ============================================================
// 依 ID 找角色
// ============================================================

function getCharacterById(characterId) {

    const characters =
        getCharacters();


    return characters.find(
        character =>
            String(character.id) ===
            String(characterId)
    ) || null;
}


// ============================================================
// 依名稱找角色
// ============================================================
//
// 目前規則：
// 同名角色視為同一個角色。
// ============================================================

function getCharacterByName(name, characters = null) {

    const list =
        Array.isArray(characters)
            ? characters
            : getCharacters();


    const targetName =
        String(name || "").trim();


    if (!targetName) {
        return null;
    }


    return list.find(
        character =>
            String(character.name || "").trim() ===
            targetName
    ) || null;
}


// ============================================================
// 儲存角色
// ============================================================

function saveCharacters(chars) {

    try {

        const data =
            loadOCData();


        data.characters =
            Array.isArray(chars)
                ? chars.map(
                    createCharacterData
                )
                : [];


        // ----------------------------------------------------
        // 儲存新的完整資料
        // ----------------------------------------------------

        const success =
            saveOCData(data);


        if (!success) {
            return false;
        }


        // ----------------------------------------------------
        // 暫時同步舊格式
        // ----------------------------------------------------

        localStorage.setItem(
            "oc_characters",
            JSON.stringify(
                data.characters
            )
        );


        return true;

    } catch (error) {

        console.error(
            "儲存角色資料失敗：",
            error
        );


        alert(
            "儲存失敗！可能是瀏覽器儲存空間已滿。"
        );


        return false;
    }
}


// ============================================================
// 新增或更新角色
// ============================================================
//
// 這個函式先準備好給之後 matrix.js 等頁面使用。
//
// 規則：
// 1. 名稱相同 → 更新既有角色
// 2. 名稱不同 → 建立新角色
//
// 「同名角色更新數值」真正接到文字匯入時，
// matrix.js 會使用這個函式。
// ============================================================

function upsertCharacterByName(
    characterData,
    characters = null
) {

    const list =
        Array.isArray(characters)
            ? characters
            : getCharacters();


    const incoming =
        createCharacterData(
            characterData
        );


    const existing =
        getCharacterByName(
            incoming.name,
            list
        );


    // --------------------------------------------------------
    // 已存在
    // --------------------------------------------------------

    if (existing) {

        const oldId =
            existing.id;


        Object.assign(
            existing,
            incoming
        );


        // 保留原本 ID
        existing.id =
            oldId;


        return {
            character: existing,
            created: false,
            updated: true
        };
    }


    // --------------------------------------------------------
    // 不存在
    // --------------------------------------------------------

    list.push(
        incoming
    );


    return {
        character: incoming,
        created: true,
        updated: false
    };
}


// ============================================================
// 取得完整資料
// ============================================================

function getOCData() {

    return loadOCData();
}


// ============================================================
// 更新完整資料
// ============================================================

function updateOCData(callback) {

    const data =
        loadOCData();


    if (
        typeof callback === "function"
    ) {

        callback(data);
    }


    return saveOCData(data);
}


// ============================================================
// 清理角色相關資料
// ============================================================
//
// 刪除角色時一次完成所有清理，
// 不再像舊版本一樣反覆 load / save。
// ============================================================

function cleanupCharacterReferences(
    characterIds
) {

    const ids =
        new Set(
            (Array.isArray(characterIds)
                ? characterIds
                : []
            ).map(
                id => String(id)
            )
        );


    if (ids.size === 0) {
        return true;
    }


    try {

        const data =
            loadOCData();


        // ----------------------------------------------------
        // 關係
        // ----------------------------------------------------

        data.relations =
            Array.isArray(data.relations)
                ? data.relations.filter(
                    relation => {

                        if (!relation) {
                            return false;
                        }


                        const from =
                            relation.from != null
                                ? String(relation.from)
                                : "";


                        const to =
                            relation.to != null
                                ? String(relation.to)
                                : "";


                        return (
                            !ids.has(from) &&
                            !ids.has(to)
                        );
                    }
                )
                : [];


        // ----------------------------------------------------
        // 關係圖位置
        // ----------------------------------------------------

        const positions =
            data.settings &&
                data.settings.relationPositions &&
                typeof data.settings.relationPositions === "object"
                ? data.settings.relationPositions
                : {};


        ids.forEach(
            id => {
                delete positions[id];
            }
        );


        data.settings.relationPositions =
            positions;


        // ----------------------------------------------------
        // charts
        // ----------------------------------------------------

        data.charts =
            Array.isArray(data.charts)
                ? data.charts.map(
                    chart => {

                        if (!chart) {
                            return chart;
                        }


                        // characterIds

                        if (
                            Array.isArray(
                                chart.characterIds
                            )
                        ) {

                            chart.characterIds =
                                chart.characterIds.filter(
                                    id =>
                                        !ids.has(
                                            String(id)
                                        )
                                );
                        }


                        // characters object

                        if (
                            chart.characters &&
                            typeof chart.characters === "object" &&
                            !Array.isArray(
                                chart.characters
                            )
                        ) {

                            ids.forEach(
                                id => {
                                    delete chart.characters[id];
                                }
                            );
                        }


                        return chart;
                    }
                )
                : [];


        // ----------------------------------------------------
        // groups
        // ----------------------------------------------------

        data.groups =
            Array.isArray(data.groups)
                ? data.groups.map(
                    group => {

                        if (
                            group &&
                            Array.isArray(
                                group.members
                            )
                        ) {

                            group.members =
                                group.members.filter(
                                    id =>
                                        !ids.has(
                                            String(id)
                                        )
                                );
                        }


                        // 有些新版設計可能會使用
                        // memberIds，順便支援。

                        if (
                            group &&
                            Array.isArray(
                                group.memberIds
                            )
                        ) {

                            group.memberIds =
                                group.memberIds.filter(
                                    id =>
                                        !ids.has(
                                            String(id)
                                        )
                                );
                        }


                        return group;
                    }
                )
                : [];


        // ----------------------------------------------------
        // 時間軸
        // ----------------------------------------------------

        data.timelines =
            Array.isArray(data.timelines)
                ? data.timelines.map(
                    timeline => {

                        if (
                            !timeline ||
                            !Array.isArray(
                                timeline.events
                            )
                        ) {
                            return timeline;
                        }


                        timeline.events =
                            timeline.events.map(
                                event => {

                                    if (
                                        !event
                                    ) {
                                        return event;
                                    }


                                    if (
                                        Array.isArray(
                                            event.characters
                                        )
                                    ) {

                                        event.characters =
                                            event.characters.filter(
                                                id =>
                                                    !ids.has(
                                                        String(id)
                                                    )
                                            );
                                    }


                                    if (
                                        Array.isArray(
                                            event.characterIds
                                        )
                                    ) {

                                        event.characterIds =
                                            event.characterIds.filter(
                                                id =>
                                                    !ids.has(
                                                        String(id)
                                                    )
                                            );
                                    }


                                    return event;
                                }
                            );


                        return timeline;
                    }
                )
                : [];


        // ----------------------------------------------------
        // 儲存一次
        // ----------------------------------------------------

        const success =
            saveOCData(data);


        if (!success) {
            return false;
        }


        // ----------------------------------------------------
        // 同步舊格式
        // ----------------------------------------------------

        syncLegacyData(data);


        return true;

    } catch (error) {

        console.error(
            "清理角色相關資料失敗：",
            error
        );


        return false;
    }
}


// ============================================================
// 重置全部資料
// ============================================================

function resetToDefaultData() {

    const confirmed =
        confirm(
            "確定要清空所有資料，重置為最初開頁狀態嗎？\n\n這會刪除你建立的所有自訂角色、座標、關係與雷達圖資料。"
        );


    if (!confirmed) {
        return;
    }


    // --------------------------------------------------------
    // 新格式
    // --------------------------------------------------------

    localStorage.removeItem(
        OC_DATA_KEY
    );


    // --------------------------------------------------------
    // 舊格式
    // --------------------------------------------------------

    localStorage.removeItem(
        "oc_characters"
    );

    localStorage.removeItem(
        "oc_matrix_axes"
    );

    localStorage.removeItem(
        "oc_relations"
    );

    localStorage.removeItem(
        "oc_radar_stats"
    );

    localStorage.removeItem(
        "oc_relation_positions"
    );


    location.reload();
}


// ============================================================
// 匯出完整資料
// ============================================================

function exportOCData() {

    try {

        const data =
            loadOCData();


        const json =
            JSON.stringify(
                data,
                null,
                2
            );


        const blob =
            new Blob(
                [json],
                {
                    type:
                        "application/json"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            "OC-Hub-backup.json";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );

    } catch (error) {

        console.error(
            "匯出資料失敗：",
            error
        );


        alert(
            "匯出失敗。"
        );
    }
}


// ============================================================
// 匯入完整資料
// ============================================================

function importOCDataFile(
    file,
    onSuccess
) {

    if (!file) {
        return;
    }


    const reader =
        new FileReader();


    reader.onload =
        event => {

            try {

                const parsed =
                    JSON.parse(
                        event.target.result
                    );


                const data =
                    normalizeOCData(
                        parsed
                    );


                const success =
                    saveOCData(data);


                if (!success) {
                    return;
                }


                // 同步所有目前舊格式

                syncLegacyData(
                    data
                );


                if (
                    typeof onSuccess ===
                    "function"
                ) {

                    onSuccess(
                        data
                    );
                }


            } catch (error) {

                console.error(
                    "匯入資料失敗：",
                    error
                );


                alert(
                    "⚠ 匯入失敗！請確認這是 OC Hub 的 JSON 備份檔。"
                );
            }
        };


    reader.readAsText(file);
}


// ============================================================
// 選單
// ============================================================

function toggleMenu() {

    const menu =
        document.getElementById(
            "dropdownMenu"
        );


    if (menu) {

        menu.classList.toggle(
            "show"
        );
    }
}


// ============================================================
// 點擊其他地方時關閉選單
// ============================================================

window.addEventListener(
    "click",
    event => {

        if (
            !event.target.closest(
                ".menu-dropdown-container"
            )
        ) {

            const menu =
                document.getElementById(
                    "dropdownMenu"
                );


            if (menu) {

                menu.classList.remove(
                    "show"
                );
            }
        }
    }
);