// define the types of elements
const spans = ["h1", "h2", "h3", "h4", "h5", "span"];
const blocks = ["div"];
const anchors = ["a"];

function el(el) {
    return document.querySelector(el);
}

function els(el) {
    return document.querySelectorAll(el);
}

fetch("index.json")
    .then((response) => response.json())
    .then(function(data) {
        console.log(data);
        console.log("fetched from Netlify");
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
    })
    .catch((error) => {
        el("body").classList.add("is-visible");
        console.log("error: " + error);
    });

netlifyIdentity.on("login", function(user) {
    console.log(user);
    getJson("index.json");

    createWidget();
    start();
});

netlifyIdentity.on("logout", () => console.log("Logged out"));

function start() {
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
                    item.innerText = el("#edit-title").value;
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
                    item.innerText = el("#edit-title").value;
                });
                el("#edit-link").addEventListener("keyup", function() {
                    item.href = el("#edit-link").value;
                });
            }
        });
    });
}

function createWidget() {
    document.body.innerHTML += `
    <div id="widget" class="ww-widget" spellCheck="false">
      <div class="ww-header"><div class="ww-close">&times;</div></div>
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
        el("#spinner").style.display = "inline-block";

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

        saveData("index.json", btoa(JSON.stringify(data)), "json");

        window.setTimeout(function() {
            el("#spinner").style.display = "none";
        }, 2000);
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
                    var data = base64data.replace(/^data:image\/\w+;base64,/, "");
                    saveData(path, data, "image");
                };
            }
        );
    };
}

function getJson(mypath = "") {
    let user = netlifyIdentity.currentUser();
    let token = user.token.access_token;

    var url = "/.netlify/git/github/contents/" + mypath;
    var bearer = "Bearer " + token;
    return fetch(url, {
            method: "GET",
            withCredentials: true,
            credentials: "include",
            headers: {
                Authorization: bearer,
                "Content-Type": "application/json",
            },
        })
        .then((resp) => {
            return resp.json();
        })
        .then((data) => {
            if (data.code == 400) {
                netlifyIdentity.refresh().then(function(token) {
                    getData(mypath);
                });
            } else {
                let content = JSON.parse(atob(data.content));

                console.log("fetched from Github");

                for (const [key, value] of Object.entries(content)) {
                    for (const [key2, value2] of Object.entries(value)) {
                        if (key2 == "image") {
                            el("#" + key + " [data-name='" + key2 + "']").src = value2;
                        } else {
                            el("#" + key + " [data-name='" + key2 + "']").innerHTML = value2;
                        }
                    }
                }
                el("body").classList.add("is-visible");

                return data;
            }
        })
        .catch((error) => {
            return error;
        });
}

function getData(mypath = "") {
    let user = netlifyIdentity.currentUser();
    let token = user.token.access_token;

    var url = "/.netlify/git/github/contents/" + mypath;
    var bearer = "Bearer " + token;
    return fetch(url, {
            method: "GET",
            withCredentials: true,
            credentials: "include",
            headers: {
                Authorization: bearer,
                "Content-Type": "application/json",
            },
        })
        .then((resp) => {
            return resp.json();
        })
        .then((data) => {
            if (data.code == 400) {
                netlifyIdentity.refresh().then(function(token) {
                    getData(mypath);
                });
            } else {
                return data;
            }
        })
        .catch((error) => {
            return error;
        });
}

function saveData(mypath, data, type) {
    getData(mypath).then(function(curfile) {
        let user = netlifyIdentity.currentUser();
        let token = user.token.access_token;

        let opts = {
            path: mypath,
            message: "initial commit",
            content: data,
            branch: "master",
            committer: {
                name: "Dashpilot",
                email: "support@dashpilot.com",
            },
        };

        if (typeof curfile !== "undefined") {
            opts.sha = curfile.sha;
        }

        var url = "/.netlify/git/github/contents/" + mypath;
        var bearer = "Bearer " + token;
        fetch(url, {
                body: JSON.stringify(opts),
                method: "PUT",
                withCredentials: true,
                credentials: "include",
                headers: {
                    Authorization: bearer,
                    "Content-Type": "application/json",
                },
            })
            .then((resp) => {
                return resp.json();
            })
            .then((data) => {
                if (data.code == 400) {
                    netlifyIdentity.refresh().then(function(token) {
                        saveData(mypath);
                    });
                } else {
                    console.log(data);
                    let url = data.content.download_url;
                    if (type == "image") {
                        document.querySelector(".current-item").src = url; // store the raw URL, so we don't have to wait for Netlify
                    }

                    return data;
                }
            })
            .catch((error) => {
                console.log("error: ", error);
                return error;
            });
    });
}

/*
function poll(path, type) {
    el("#spinner").style.display = "inline-block";
    window.setTimeout(function() {
        let result = doesFileExist(path);
        if (!result) {
            console.log("not found yet");
            poll(path);
        } else {
            console.log("ok");
            el("#spinner").style.display = "none";
            if (type == "image") {
                el(".current-item").src = path;
            }
        }
    }, 2000);
}

function doesFileExist(urlToFile) {
    var xhr = new XMLHttpRequest();
    xhr.open("HEAD", urlToFile, false);
    xhr.send();

    if (xhr.status == "404") {
        return false;
    } else {
        return true;
    }
}
*/