const editable_title =
  "h1:not(.exclude),h2:not(.exclude),h3:not(.exclude),h4:not(.exclude),h5:not(.exclude)";
const editable_paragraph = "p:not(.exclude)";

netlifyIdentity.on("login", function(user) {
  console.log(user);
  createWidget();
  start();
});

function el(el) {
  return document.querySelector(el);
}

function els(el) {
  return document.querySelectorAll(el);
}

function wrap(myel) {
  let el = myel;

  // create wrapper container
  var wrapper = document.createElement("div");
  wrapper.classList.add("paragraph-wrapper");

  // insert wrapper before el in the DOM tree
  el.parentNode.insertBefore(wrapper, el);

  // move el into wrapper
  wrapper.appendChild(el);
}

function unwrap(myel) {
  var el = document.querySelector(myel);

  if (typeof el != "undefined" && el != null) {
    // get the element's parent node
    var parent = el.parentNode;

    // move all children out of the element
    while (el.firstChild) parent.insertBefore(el.firstChild, el);

    // remove the empty element
    parent.removeChild(el);

    start();
  }
}

function start() {
  els(".cms-editable").forEach(function(item) {
    item.addEventListener("click", function() {
      el("#widget").classList.remove("closing");
      el("#widget-welcome").style.display = "none";

      // unwrap('.paragraph-wrapper');
      els(".editor").forEach(function(myitem) {
        myitem.style.display = "none";
      });
      els(".current-item").forEach(function(myitem) {
        myitem.classList.remove("current-item");
      });
      item.classList.add("current-item");

      let type = item.tagName.toLowerCase();

      if (
        type == "h1" ||
        type == "h2" ||
        type == "h3" ||
        type == "h4" ||
        type == "h5"
      ) {
        let val = item.innerText;
        el("#edit-title").value = val;
        el("#edit-title").style.display = "block";
        el("#edit-title").addEventListener("keyup", function() {
          item.innerText = el("#edit-title").value;
        });
      } else if (type == "div") {
        let val = item.innerHTML;
        el(".pell-content").innerHTML = val;
        el("#edit-text").style.display = "block";
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
      <input type="text" class="form-control editor" id="edit-title">
      <div id="edit-text" class="pell editor"></div>
      </div>
      <div class="ww-footer"><a class="ww-button ww-button-close" id="save"><i class="fa fa-spinner fa-spin" id="spinner" style="display: none;"></i> &nbsp;Save</a></div>
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
    el("#spinner").style.display = "block";

    data = {};
    els(".cms-editable").forEach(function(item) {
      let id = item.id;
      let type = item.tagName.toLowerCase();

      let val = "";
      if (
        type == "h1" ||
        type == "h2" ||
        type == "h3" ||
        type == "h4" ||
        type == "h5"
      ) {
        val = item.innerText.replace(/  |\r\n|\n|\r/gm, "");
      } else if (type == "div") {
        val = item.innerHTML.replace(/  |\r\n|\n|\r/gm, "");
      } else {
        val = item.innerHTML.replace(/  |\r\n|\n|\r/gm, "");
      }

      data[id] = val;
    });

    console.log(data);

    saveData("index.json", JSON.stringify(data));

    window.setTimeout(function() {
      el("#spinner").style.display = "none";
    }, 2000);


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

function saveData(mypath, data) {
  getData(mypath).then(function(curfile) {
    let user = netlifyIdentity.currentUser();
    let token = user.token.access_token;

    let opts = {
      path: mypath,
      message: "initial commit",
      content: btoa(data),
      branch: "master",
      committer: {
        name: "Dashpilot",
        email: "support@dashpilot.com"
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
          return data;
        }
      })
      .catch((error) =>
        this.setState({
          message: "Error: " + error,
        })
      );
  });
}