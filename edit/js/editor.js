// define the types of elements
const spans = ["h1", "h2", "h3", "h4", "h5", "span"];
const blocks = ["div"];
const anchors = ["a"];

fetch(
        "https://inline-editor.ams3.digitaloceanspaces.com/2178df7d-3d96-49f3-a534-10d1bcdaddad/data.json"
    )
    .then((response) => response.json())
    .then(function(data) {
        console.log(data);
        console.log("fetched from Netlify");
        renderPage(data);
    })
    .catch((error) => {
        el("body").classList.add("is-visible");
        console.log("error: " + error);
    });

netlifyIdentity.on("login", function(user) {
    createWidget();
    start();
});

function renderPage(data) {
    for (const [key, value] of Object.entries(data)) {
        for (const [key2, value2] of Object.entries(value)) {
            if (key2 == "image") {
                el("#" + key + " [data-name='" + key2 + "']").src = value2;
            } else {
                el("#" + key + " [data-name='" + key2 + "']").innerHTML = value2;
            }
        }
    }

    el("body").classList.add("is-visible");
}

function start() {
    console.log("start called");
    els("[data-name]").forEach(function(item) {
        item.addEventListener("click", function() {
            el("#widget").classList.remove("closing");
            el("#widget-welcome").style.display = "none";

            els(".editor").forEach(function(myitem) {
                myitem.style.display = "none";
            });
            els(".current-item").forEach(function(myitem) {
                myitem.classList.remove("current-item");
            });
            item.classList.add("current-item");

            let parent = item.closest(".editable");
            el("#section-name").innerHTML =
                parent.id + " &raquo; " + item.getAttribute("data-name");

            let type = item.tagName.toLowerCase();

            if (spans.includes(type)) {
                let val = item.innerText;
                el("#edit-title").value = val;
                el("#edit-title").style.display = "block";
                el("#edit-title").addEventListener("keyup", function() {
                    el(".current-item").innerText = el("#edit-title").value;
                });
            } else if (blocks.includes(type)) {
                let val = item.innerHTML;
                el(".pell-content").innerHTML = val;
                el("#edit-text").style.display = "block";
            } else if (type == "img") {
                el("#edit-image").style.display = "block";
            } else if (anchors.includes(type)) {
                let val = item.innerText;
                let href = item.href;
                el("#edit-title").value = val;
                el("#edit-link").value = href;
                el("#edit-title").style.display = "block";
                el("#edit-link").style.display = "block";
                el("#edit-title").addEventListener("keyup", function() {
                    el(".current-item").innerText = el("#edit-title").value;
                });
                el("#edit-link").addEventListener("keyup", function() {
                    el(".current-item").href = el("#edit-link").value;
                });
            }
        });
    });
}

function createWidget() {
    document.body.innerHTML += `
    <div id="widget" class="ww-widget" spellCheck="false">
      <div class="ww-header">
      <button class="btn btn-outline-light" onclick="logout();" id="logout">Log Out</button>
      <div class="ww-close">&times;</div>
      </div>
      <div class="ww-content" id="widget-content">
     <div id="widget-welcome">
     <h2 class="exclude">Welcome</h2><p class="exclude">Click on an element on the page to edit it.</p>
     </div>
      <div id="section-name"></div>
      <input id="edit-title" type="text" class="form-control editor" style="display: none;" placeholder="text">
      <input id="edit-link" type="text" class="form-control mt-3 editor" style="display: none;" placeholder="link">
      <div id="edit-text" class="pell editor"></div>
      <div id="edit-image" class="editor">
        <input type="file" id="select">
      </div>
 
      </div>
      <div class="ww-footer"><a class="ww-button ww-button-close" id="save"><i class="fa fa-spinner fa-spin mr-2" id="spinner" style="display: none;"></i> Save</a></div>
    </div>`;

    document.head.innerHTML += `
    <style>
    [data-name] {
        cursor: pointer;
        border: 1px solid transparent;
    }
    [data-name]:hover {
        border: 1px solid lightblue;
    }
    .current-item {
        border: 1px solid lightblue;
    }
    </style>`;

    document.querySelector(".ww-close").addEventListener("click", function() {
        document.querySelector("#widget").classList.add("closing");
    });

    const editor = pell.init({
        element: document.getElementById("edit-text"),
        onChange: (html) => {
            el(".current-item").innerHTML = html;
        },
        defaultParagraphSeparator: "p",
        styleWithCSS: true,
        actions: [
            "bold",
            "underline",
            {
                name: "italic",
                result: () => exec("italic"),
            },
        ],
    });

    el("#save").addEventListener("click", function(item) {
        data = {};
        els(".editable").forEach(function(item) {
            let id = item.id;
            let type = item.tagName.toLowerCase();
            data[id] = {};

            els("#" + id + " [data-name]").forEach(function(item2) {
                let name = item2.getAttribute("data-name");
                if (name == "image") {
                    data[id][name] = item2.src;
                } else {
                    data[id][name] = item2.innerHTML.replace(/  |\r\n|\n|\r/gm, "");
                }
            });
        });

        console.log(data);

        saveData("data.json", data, "json");
    });

    document.getElementById("select").onchange = function(evt) {
        ImageTools.resize(
            this.files[0], {
                width: 500, // maximum width
                height: 500, // maximum height
            },
            function(blob, didItResize) {
                // didItResize will be true if it managed to resize it, otherwise false (and will return the original file as 'blob')

                // you can also now upload this blob using an XHR.
                var reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = function() {
                    var base64data = reader.result;

                    let name = Math.random().toString(36).substr(2, 9) + ".jpg";
                    let path = "img/" + name;

                    // first, temporarily show the base64 data
                    //document.querySelector(".current-item").src = base64data;

                    // save the image
                    var data = base64data;
                    saveData(path, data, "image");
                };
            }
        );
    };
}

async function saveData(filename, data, type) {
    const token = await netlifyIdentity.currentUser().jwt();
    let user = await netlifyIdentity.currentUser();

    el("#spinner").style.display = "inline-block";

    const response = await fetch("/.netlify/functions/save", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            method: "post",
            body: JSON.stringify({
                filename: filename,
                data: data,
                type: type,
            }),
        })
        .then((response) => response.text())
        .then(function(res) {
            console.log(res);

            if (res.includes("img/")) {
                document.querySelector(".current-item").src =
                    "https://inline-editor.ams3.digitaloceanspaces.com/2178df7d-3d96-49f3-a534-10d1bcdaddad/" +
                    res;
            }

            window.setTimeout(function() {
                el("#spinner").style.display = "none";
            }, 2000);
        });
}

function logout() {
    netlifyIdentity.logout();
    window.setTimeout(function() {
        window.location.reload();
    }, 1000);
}

/* helpers */

function el(el) {
    return document.querySelector(el);
}

function els(el) {
    return document.querySelectorAll(el);
}