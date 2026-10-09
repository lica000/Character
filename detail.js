// ============================================================
// 角色詳細頁
// ============================================================

let characters =
    getCharacters();


const urlParams =
    new URLSearchParams(
        window.location.search
    );


const charId =
    urlParams.get("id");


let currentEditingId =
    charId;


let isDetailEditMode =
    false;


// ============================================================
// 延遲儲存
// ============================================================

let characterSaveTimer =
    null;


const CHARACTER_SAVE_DELAY =
    400;


// ============================================================
// 排程儲存
// ============================================================

function scheduleCharacterSave() {

    clearTimeout(
        characterSaveTimer
    );


    characterSaveTimer =
        setTimeout(
            () => {

                characterSaveTimer =
                    null;


                saveCharacters(
                    characters
                );

            },
            CHARACTER_SAVE_DELAY
        );
}


// ============================================================
// 立即儲存
// ============================================================

function flushCharacterSave() {

    if (
        characterSaveTimer ===
        null
    ) {

        return;
    }


    clearTimeout(
        characterSaveTimer
    );


    characterSaveTimer =
        null;


    saveCharacters(
        characters
    );
}


// ============================================================
// 離開頁面時確保資料已儲存
// ============================================================

window.addEventListener(
    "pagehide",
    () => {

        flushCharacterSave();
    }
);


// ============================================================
// 頁面初始化
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        renderDetailPoster();
    }
);


// ============================================================
// 渲染角色詳細頁
// ============================================================

function renderDetailPoster() {

    const char =
        characters.find(
            c =>
                String(c.id) ===
                String(currentEditingId)
        );


    if (!char) {

        location.href =
            "index.html";

        return;
    }


    const container =
        document.getElementById(
            "detailContainer"
        );


    if (!container) return;


    const avatarImg =
        char.avatar ||
        DEFAULT_AVATAR_SVG;


    const fullBodyImg =
        char.fullBodyAvatar ||
        char.avatar ||
        DEFAULT_AVATAR_SVG;


    const tags =
        Array.isArray(
            char.tags
        )
            ? char.tags
            : [];


    container.innerHTML = `
    <div class="detail-poster-container ${isDetailEditMode
            ? "is-editing"
            : ""
        }">

      <div class="poster-top-bar">

        <div
          style="
            display:flex;
            align-items:center;
            gap:8px;
            flex-wrap:wrap;
          "
        >

          <span
            class="poster-mode-badge ${isDetailEditMode
            ? "editing"
            : ""
        }"
          >
            ${isDetailEditMode
            ? "編輯模式"
            : "預覽模式"
        }
          </span>


          <button
            class="btn"
            onclick="toggleDetailEditMode()"
          >
            ${isDetailEditMode
            ? "完成編輯"
            : "✏️ 編輯資料"
        }
          </button>


          <button
            class="btn btn-danger"
            onclick="deleteCharacter()"
          >
            刪除
          </button>

        </div>


        <button
          class="btn btn-search"
          onclick="location.href='index.html'"
        >
          返回大廳
        </button>

      </div>


      <div class="poster-grid">


        <!-- ==================================================
             左側
        =================================================== -->

        <div class="poster-left-panel">


          <!-- 頭像 + 名稱 -->

          <div class="poster-header-group">

            <div class="poster-avatar-box">

              <img
                class="poster-avatar-img"
                src="${escapeHtmlAttribute(
            avatarImg
        )}"
                onerror="
                  this.onerror=null;
                  this.src=DEFAULT_AVATAR_SVG;
                "
              >


              ${isDetailEditMode
            ? `
                    <button
                      class="btn"
                      style="
                        position:absolute;
                        bottom:4px;
                        right:4px;
                        font-size:10px;
                        padding:2px 6px;
                        background:#fff;
                      "
                      onclick="triggerImageChange('avatar')"
                    >
                      📷 更換
                    </button>
                  `
            : ""
        }

            </div>


            <div style="flex:1;">

              <input
                type="text"
                class="poster-name-input editable-field"
                value="${escapeHtmlAttribute(
            char.name || ""
        )}"
                placeholder="角色名稱"
                ${!isDetailEditMode
            ? "readonly"
            : ""
        }
                oninput="
                  updateCurrentChar(
                    'name',
                    this.value
                  )
                "
              >


              <div
                style="margin-top:8px;"
                class="card-tags"
              >
                ${tags
            .map(
                tag =>
                    `<span class="tag-badge">${escapeHtml(
                        tag
                    )}</span>`
            )
            .join("")}
              </div>

            </div>

          </div>


          <!-- =================================================
               經典台詞
          ================================================== -->

          <div class="poster-section-block">

            <div class="poster-section-label">
              經典台詞 / 標語
            </div>


            <input
              type="text"
              class="poster-quote-input editable-field"
              value="${escapeHtmlAttribute(
                char.quote || ""
            )}"
              placeholder="${isDetailEditMode
            ? "點擊輸入台詞..."
            : "（無台詞）"
        }"
              ${!isDetailEditMode
            ? "readonly"
            : ""
        }
              oninput="
                updateCurrentChar(
                  'quote',
                  this.value
                )
              "
            >

          </div>


          <!-- =================================================
               背景設定
          ================================================== -->

          <div class="poster-section-block">

            <div class="poster-section-label">
              設定與故事背景
            </div>


            <textarea
              class="poster-bio-textarea editable-field"
              placeholder="${isDetailEditMode
            ? "點擊輸入背景設定..."
            : "（無背景設定）"
        }"
              ${!isDetailEditMode
            ? "readonly"
            : ""
        }
              oninput="
                updateCurrentChar(
                  'bio',
                  this.value
                )
              "
            >${escapeHtml(
            char.bio || ""
        )}</textarea>

          </div>

        </div>


        <!-- ==================================================
             右側立繪
        =================================================== -->

        <div class="poster-right-panel">

          <div class="poster-fullbody-box">

            <img
              class="poster-fullbody-img"
              src="${escapeHtmlAttribute(
            fullBodyImg
        )}"
              onerror="
                this.onerror=null;
                this.src=DEFAULT_AVATAR_SVG;
              "
            >


            ${isDetailEditMode
            ? `
                  <button
                    class="btn"
                    style="
                      position:absolute;
                      top:8px;
                      right:8px;
                      font-size:11px;
                      padding:4px 8px;
                      background:#fff;
                      box-shadow:
                        0 2px 6px rgba(0,0,0,0.15);
                    "
                    onclick="
                      triggerImageChange(
                        'fullBodyAvatar'
                      )
                    "
                  >
                    📷 更換立繪
                  </button>
                `
            : ""
        }

          </div>

        </div>

      </div>

    </div>
    `;
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


// ============================================================
// 編輯模式
// ============================================================

function toggleDetailEditMode() {

    if (
        isDetailEditMode
    ) {

        flushCharacterSave();
    }


    isDetailEditMode =
        !isDetailEditMode;


    renderDetailPoster();
}


// ============================================================
// 更換圖片
// ============================================================

function triggerImageChange(
    field
) {

    const method =
        confirm(
            "請選擇圖片更換方式：\n\n" +
            "【確定】➔ 貼上網路圖片 URL\n" +
            "【取消】➔ 從手機選擇圖片檔案"
        );


    // ========================================================
    // 使用 URL
    // ========================================================

    if (method) {

        const url =
            prompt(
                "請貼上圖片網址 (URL)："
            );


        if (
            url &&
            url.trim()
        ) {

            updateCurrentChar(
                field,
                url.trim()
            );


            flushCharacterSave();


            renderDetailPoster();
        }


        return;
    }


    // ========================================================
    // 選擇本機圖片
    // ========================================================

    const fileInput =
        document.createElement(
            "input"
        );


    fileInput.type =
        "file";


    fileInput.accept =
        "image/*";


    fileInput.onchange =
        event => {

            const file =
                event.target.files &&
                event.target.files[0];


            if (!file) return;


            const reader =
                new FileReader();


            reader.onload =
                event => {

                    const img =
                        new Image();


                    img.onload =
                        () => {

                            const canvas =
                                document.createElement(
                                    "canvas"
                                );


                            const ctx =
                                canvas.getContext(
                                    "2d"
                                );


                            const MAX_SIZE =
                                field ===
                                    "fullBodyAvatar"
                                    ? 800
                                    : 400;


                            let width =
                                img.naturalWidth ||
                                img.width;


                            let height =
                                img.naturalHeight ||
                                img.height;


                            if (
                                width <= 0 ||
                                height <= 0
                            ) {

                                alert(
                                    "圖片尺寸無法讀取。"
                                );

                                return;
                            }


                            // ------------------------------------------------
                            // 縮小圖片
                            // ------------------------------------------------

                            if (
                                width > height
                            ) {

                                if (
                                    width >
                                    MAX_SIZE
                                ) {

                                    const scale =
                                        MAX_SIZE /
                                        width;


                                    width *=
                                        scale;


                                    height *=
                                        scale;
                                }

                            } else {

                                if (
                                    height >
                                    MAX_SIZE
                                ) {

                                    const scale =
                                        MAX_SIZE /
                                        height;


                                    width *=
                                        scale;


                                    height *=
                                        scale;
                                }
                            }


                            canvas.width =
                                Math.round(
                                    width
                                );


                            canvas.height =
                                Math.round(
                                    height
                                );


                            ctx.drawImage(
                                img,
                                0,
                                0,
                                canvas.width,
                                canvas.height
                            );


                            // ------------------------------------------------
                            // 壓縮
                            // ------------------------------------------------

                            let imageData;


                            try {

                                imageData =
                                    canvas.toDataURL(
                                        "image/webp",
                                        0.8
                                    );

                            } catch (
                            error
                            ) {

                                imageData =
                                    canvas.toDataURL(
                                        "image/jpeg",
                                        0.8
                                    );
                            }


                            updateCurrentChar(
                                field,
                                imageData
                            );


                            flushCharacterSave();


                            renderDetailPoster();
                        };


                    img.onerror =
                        () => {

                            alert(
                                "圖片讀取失敗。"
                            );
                        };


                    img.src =
                        event.target.result;
                };


            reader.readAsDataURL(
                file
            );
        };


    fileInput.click();
}


// ============================================================
// 修改目前角色
// ============================================================

function updateCurrentChar(
    field,
    value
) {

    const char =
        characters.find(
            c =>
                String(c.id) ===
                String(currentEditingId)
        );


    if (!char) return;


    char[field] =
        value;


    // 不直接寫 localStorage。
    // 連續輸入時 400ms 內只會真正儲存一次。
    scheduleCharacterSave();
}


// ============================================================
// 刪除角色
// ============================================================

function deleteCharacter() {

    const confirmed =
        confirm(
            "確定要刪除這個角色嗎？\n\n" +
            "這也會刪除這個角色相關的關係與關係圖位置。"
        );


    if (!confirmed) {
        return;
    }


    // 先取消可能還沒完成的 debounce 儲存。
    flushCharacterSave();


    const deletedId =
        String(
            currentEditingId
        );


    characters =
        characters.filter(
            c =>
                String(c.id) !==
                deletedId
        );


    saveCharacters(
        characters
    );


    cleanupCharacterReferences([
        deletedId
    ]);


    location.href =
        "index.html";
}