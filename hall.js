// ============================================================
// 角色大廳
// ============================================================

let characters = getCharacters();

let activeSelectedTags = [];
let isNoTagsOnly = false;


// ============================================================
// 頁面初始化
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    renderHall();
});


// ============================================================
// 角色大廳
// ============================================================

function renderHall() {
    const grid =
        document.getElementById("characterGrid");

    if (!grid) return;

    renderTagFilterBar();

    grid.innerHTML = "";


    // --------------------------------------------------------
    // 建立角色按鈕
    // --------------------------------------------------------

    const addCard =
        document.createElement("div");

    addCard.className =
        "card card-add";

    addCard.innerText =
        "+ 建立角色";

    addCard.onclick =
        createNewCharacter;

    grid.appendChild(addCard);


    // --------------------------------------------------------
    // 搜尋
    // --------------------------------------------------------

    const searchInput =
        document.getElementById("searchInput");

    const keyword =
        searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";


    // --------------------------------------------------------
    // 篩選角色
    // --------------------------------------------------------

    const filtered =
        characters.filter(char => {

            const name =
                String(char.name || "")
                    .toLowerCase();

            const tags =
                Array.isArray(char.tags)
                    ? char.tags
                    : [];


            const matchKeyword =
                !keyword ||
                name.includes(keyword) ||
                tags.some(tag =>
                    String(tag)
                        .toLowerCase()
                        .includes(keyword)
                );


            const matchNoTags =
                !isNoTagsOnly ||
                tags.length === 0;


            const matchTags =
                activeSelectedTags.length === 0 ||
                activeSelectedTags.every(tag =>
                    tags.includes(tag)
                );


            return (
                matchKeyword &&
                matchNoTags &&
                matchTags
            );
        });


    // --------------------------------------------------------
    // 角色卡片 Template
    // --------------------------------------------------------

    const template =
        document.getElementById(
            "characterCardTemplate"
        );

    if (!template) return;


    filtered.forEach(char => {

        const clone =
            template.content.cloneNode(true);

        const card =
            clone.querySelector(".card");

        const imgEl =
            clone.querySelector(".card-avatar");

        const avatarWrapper =
            clone.querySelector(
                ".card-avatar-wrapper"
            );

        const titleEl =
            clone.querySelector(
                ".card-title"
            );

        const tagsContainer =
            clone.querySelector(
                ".card-tags"
            );

        const addBtnWrapper =
            clone.querySelector(
                ".tag-add-btn-wrapper"
            );


        // ----------------------------------------------------
        // 點卡片進入詳情
        // ----------------------------------------------------

        card.onclick = () => {
            location.href =
                `detail.html?id=${encodeURIComponent(char.id)}`;
        };


        // ----------------------------------------------------
        // 頭像
        // ----------------------------------------------------

        imgEl.src =
            char.avatar ||
            DEFAULT_AVATAR_SVG;

        imgEl.onerror = () => {
            imgEl.onerror = null;
            imgEl.src = DEFAULT_AVATAR_SVG;
        };


        avatarWrapper.onclick = event => {
            event.stopPropagation();

            location.href =
                `detail.html?id=${encodeURIComponent(char.id)}`;
        };


        // ----------------------------------------------------
        // 名稱
        // ----------------------------------------------------

        titleEl.textContent =
            char.name || "未命名";

        titleEl.onclick = event => {
            event.stopPropagation();

            location.href =
                `detail.html?id=${encodeURIComponent(char.id)}`;
        };


        // ----------------------------------------------------
        // 標籤
        // ----------------------------------------------------

        const tags =
            Array.isArray(char.tags)
                ? char.tags
                : [];


        tags.forEach(tag => {

            const tagBadge =
                document.createElement("span");

            tagBadge.className =
                "tag-badge";


            const tagText =
                document.createElement("span");

            tagText.textContent =
                tag;


            const removeBtn =
                document.createElement("span");

            removeBtn.className =
                "remove-tag-btn";

            removeBtn.innerHTML =
                "&times;";


            removeBtn.onclick = event => {
                event.stopPropagation();

                removeTag(
                    char.id,
                    tag
                );
            };


            tagBadge.appendChild(tagText);
            tagBadge.appendChild(removeBtn);


            tagsContainer.insertBefore(
                tagBadge,
                addBtnWrapper
            );
        });


        // ----------------------------------------------------
        // 標籤選單
        // ----------------------------------------------------

        const tagMenu =
            clone.querySelector(
                ".tag-select-menu"
            );

        const tagBtn =
            clone.querySelector(
                ".tag-add-btn"
            );

        const tagInput =
            clone.querySelector(
                ".tag-menu-input"
            );

        const listContainer =
            clone.querySelector(
                ".tag-options-list"
            );


        tagMenu.id =
            `tagMenu-${char.id}`;

        tagInput.id =
            `tagMenuInput-${char.id}`;

        listContainer.id =
            `tagMenuList-${char.id}`;


        // 開啟標籤選單
        tagBtn.onclick =
            event => {
                toggleTagMenu(
                    char.id,
                    event
                );
            };


        // 防止點擊輸入框關閉選單
        tagInput.onclick =
            event => {
                event.stopPropagation();
            };


        // 搜尋標籤
        tagInput.oninput =
            () => {
                renderTagMenuOptions(
                    char.id
                );
            };


        // Enter 新增標籤
        tagInput.onkeydown =
            event => {

                if (event.key !== "Enter") {
                    return;
                }

                event.preventDefault();

                createAndAddTag(
                    char.id
                );
            };


        grid.appendChild(clone);
    });
}


// ============================================================
// 標籤篩選列
// ============================================================

function renderTagFilterBar() {

    const container =
        document.getElementById(
            "tagFilterList"
        );

    if (!container) return;

    container.innerHTML = "";


    // --------------------------------------------------------
    // 無標籤
    // --------------------------------------------------------

    const noTagChip =
        document.createElement("div");

    noTagChip.className =
        `filter-tag-chip ${isNoTagsOnly
            ? "selected"
            : ""
        }`;

    noTagChip.textContent =
        "無標籤";


    noTagChip.onclick = () => {

        isNoTagsOnly =
            !isNoTagsOnly;

        renderHall();
    };


    container.appendChild(
        noTagChip
    );


    // --------------------------------------------------------
    // 所有標籤
    // --------------------------------------------------------

    const tagSet =
        new Set();


    characters.forEach(char => {

        if (!Array.isArray(char.tags)) {
            return;
        }

        char.tags.forEach(tag => {
            tagSet.add(tag);
        });
    });


    const allTags =
        Array.from(tagSet).sort();


    allTags.forEach(tag => {

        const chip =
            document.createElement("div");

        chip.className =
            `filter-tag-chip ${activeSelectedTags.includes(tag)
                ? "selected"
                : ""
            }`;

        chip.textContent =
            tag;


        chip.onclick = () => {

            if (
                activeSelectedTags.includes(tag)
            ) {

                activeSelectedTags =
                    activeSelectedTags.filter(
                        t => t !== tag
                    );

            } else {

                activeSelectedTags.push(tag);
            }

            renderHall();
        };


        container.appendChild(
            chip
        );
    });
}


// ============================================================
// 移除角色標籤
// ============================================================

function removeTag(charId, tagText) {

    const char =
        characters.find(
            c => String(c.id) === String(charId)
        );

    if (!char) return;


    char.tags =
        Array.isArray(char.tags)
            ? char.tags.filter(
                tag => tag !== tagText
            )
            : [];


    saveCharacters(
        characters
    );

    renderHall();
}


// ============================================================
// 開關標籤選單
// ============================================================

function toggleTagMenu(charId, event) {

    if (event) {
        event.stopPropagation();
    }


    const menu =
        document.getElementById(
            `tagMenu-${charId}`
        );

    if (!menu) return;


    const isOpen =
        menu.classList.contains("show");


    // 先關閉所有其他選單
    document
        .querySelectorAll(
            ".tag-select-menu"
        )
        .forEach(otherMenu => {

            otherMenu.classList.remove(
                "show"
            );
        });


    if (!isOpen) {

        menu.classList.add("show");

        renderTagMenuOptions(
            charId
        );


        const input =
            document.getElementById(
                `tagMenuInput-${charId}`
            );


        if (input) {

            setTimeout(
                () => input.focus(),
                0
            );
        }
    }
}


// ============================================================
// 標籤選單內容
// ============================================================

function renderTagMenuOptions(charId) {

    const char =
        characters.find(
            c => String(c.id) === String(charId)
        );


    const listContainer =
        document.getElementById(
            `tagMenuList-${charId}`
        );


    const inputEl =
        document.getElementById(
            `tagMenuInput-${charId}`
        );


    if (
        !char ||
        !listContainer ||
        !inputEl
    ) {
        return;
    }


    const searchVal =
        inputEl.value
            .trim()
            .toLowerCase();


    const charTags =
        Array.isArray(char.tags)
            ? char.tags
            : [];


    // --------------------------------------------------------
    // 收集所有標籤
    // --------------------------------------------------------

    const tagSet =
        new Set();


    characters.forEach(c => {

        if (!Array.isArray(c.tags)) {
            return;
        }

        c.tags.forEach(tag => {
            tagSet.add(tag);
        });
    });


    const availableTags =
        Array.from(tagSet).filter(tag => {

            return (
                !charTags.includes(tag) &&
                String(tag)
                    .toLowerCase()
                    .includes(searchVal)
            );
        });


    listContainer.innerHTML = "";


    // --------------------------------------------------------
    // 新增標籤
    // --------------------------------------------------------

    if (
        availableTags.length === 0 &&
        searchVal
    ) {

        const item =
            document.createElement("div");

        item.className =
            "tag-option-item";

        item.textContent =
            `新增「${inputEl.value.trim()}」`;


        item.onclick = event => {

            event.stopPropagation();

            createAndAddTag(
                charId
            );
        };


        listContainer.appendChild(
            item
        );

        return;
    }


    // --------------------------------------------------------
    // 已存在標籤
    // --------------------------------------------------------

    availableTags.forEach(tag => {

        const item =
            document.createElement("div");

        item.className =
            "tag-option-item";

        item.textContent =
            tag;


        item.onclick = event => {

            event.stopPropagation();


            if (
                !Array.isArray(char.tags)
            ) {
                char.tags = [];
            }


            if (
                !char.tags.includes(tag)
            ) {
                char.tags.push(tag);
            }


            saveCharacters(
                characters
            );

            renderHall();
        };


        listContainer.appendChild(
            item
        );
    });
}


// ============================================================
// 建立新角色
// ============================================================

function createNewCharacter() {

    const newChar =
        createCharacterData({

            id:
                Date.now().toString() +
                Math.random()
                    .toString(36)
                    .substring(2, 7),

            name:
                "新角色",

            color:
                DEFAULT_COLORS[
                characters.length %
                DEFAULT_COLORS.length
                ],

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


    location.href =
        `detail.html?id=${encodeURIComponent(newChar.id)}`;
}
// ============================================================
// 點擊其他地方關閉標籤選單
// ============================================================

document.addEventListener(
    "click",
    event => {

        if (
            event.target.closest(
                ".tag-add-btn-wrapper"
            ) ||
            event.target.closest(
                ".tag-select-menu"
            )
        ) {
            return;
        }


        document
            .querySelectorAll(
                ".tag-select-menu"
            )
            .forEach(menu => {

                menu.classList.remove(
                    "show"
                );
            });
    }
);