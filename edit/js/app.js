const editable_title = 'h1:not(.exclude),h2:not(.exclude),h3:not(.exclude),h4:not(.exclude),h5:not(.exclude)';
const editable_paragraph = 'p:not(.exclude)';

netlifyIdentity.on('login', function(user) {
    console.log(user);
    createWidget();
    start();
})

function el(el) {
    return document.querySelector(el);
}

function els(el) {
    return document.querySelectorAll(el);
}

function wrap(myel) {
    var el = document.querySelector(myel);

    // create wrapper container
    var wrapper = document.createElement('div');
    wrapper.classList.add('current-item');
    wrapper.classList.add('paragraph-wrapper');
    wrapper.classList.add('exclude');

    // insert wrapper before el in the DOM tree
    el.parentNode.insertBefore(wrapper, el);

    // move el into wrapper
    wrapper.appendChild(el);
}

function unwrap(myel) {
    var el = document.querySelector(myel);

    if (typeof(el) != 'undefined' && el != null) {

        // get the element's parent node
        var parent = el.parentNode;

        // move all children out of the element
        while (el.firstChild) parent.insertBefore(el.firstChild, el);

        // remove the empty element
        parent.removeChild(el);

    }
}

function start() {

    els(editable_title).forEach(function(item) {
        item.addEventListener('click', function() {
            document.querySelector('#widget').classList.remove('closing');

            unwrap('.paragraph-wrapper');
            els('.editor').forEach(function(myitem) {
                myitem.classList.remove('current-item');
            });
            els('.current-item').forEach(function(myitem) {
                myitem.classList.remove('current-item');
            });
            item.classList.add('current-item');
            let val = item.innerText;
            el('#edit-title').value = val;
            el('#edit-title').style.display = 'block';
            el('#edit-title').addEventListener('keyup', function() {
                item.innerText = el('#content').value;
            });
        });
    });

    els(editable_paragraph).forEach(function(item) {
        item.addEventListener('click', function() {
            document.querySelector('#widget').classList.remove('closing');

            unwrap('.paragraph-wrapper');

            els('.editor').forEach(function(myitem) {
                myitem.classList.remove('current-item');
            });
            els('.current-item').forEach(function(myitem) {
                myitem.classList.remove('current-item');
            });
            els('.paragraph-item').forEach(function(myitem) {
                myitem.classList.remove('paragraph-item');
            });
            item.classList.add('paragraph-item');
            el('#edit-text').style.display = 'block';

            wrap('.paragraph-item'); // wrap the paragraph

            let val = item.parentNode.innerHTML;
            el('.pell-content').innerHTML = val;
            el('#edit-text').style.display = 'block';

        });
    });

}


function createWidget() {

    document.head.innerHTML += `<style>
    .ww-widget{background-color:white;position:fixed;bottom:0;right:0;margin:25px;width:350px;min-height:400px;border-radius:6px;overflow:hidden;text-align:center;box-shadow: 0 11px 15px -7px rgba(0, 0, 0, 0.2), 0 24px 38px 3px rgba(0, 0, 0, 0.14), 0 9px 46px 8px rgba(0, 0, 0, 0.12);box-sizing:border-box;}
    .ww-header{height:160px;background-image:url(edit/img/mountain1.jpg);background-size:cover;}
    .ww-content{padding: 20px;}
    .ww-footer{padding: 15px;border-top:1px solid #DDD;position: absolute;bottom:0;left:0;width:100%;box-sizing:border-box;}
    .ww-close{float: right; font-size: 25px; padding:15px; padding-top: 5px;color:white;cursor:pointer;}
    .ww-widget p{font-family: 'Cardo', serif;}
    .ww-widget h1, .ww-widget h2, .ww-widget h3, .ww-widget h4, .ww-button{font-family: 'Oswald', sans-serif; text-transform: uppercase;}
    .ww-button{display:block;text-align:center;padding:10px 15px;background-color: #20bf6b;border-radius: 4px;color:white;text-decoration: none;}
    .ww-widget{opacity: 0;animation-name: bounceIn;animation-duration: 250ms;animation-timing-function: linear;animation-fill-mode: forwards;}
    .closing{animation-name: bounceOut;animation-duration: 250ms;animation-timing-function: linear;animation-fill-mode: forwards;}
    @keyframes bounceIn{
      0%{
        opacity: 0;
        transform: scale(0.3) translate3d(0,0,0);
      }
      100%{
        opacity: 1;
        transform: scale(1) translate3d(0,0,0);
      }
    }
    @keyframes bounceOut{
      0%{
        opacity: 1;
        transform: scale(1) translate3d(0,0,0);
      }
      20%{
        transform: scale(1.1) translate3d(0,0,0);
      }
      100%{
        opacity: 0;
        transform: scale(0.3) translate3d(0,0,0);
      }
    }
    @media only screen and (max-width : 750px) {.ww-widget{width:85%;bottom:0;left:0;}}

    #widget-content textarea{height: 130px;}
    .editor{display: none;}
    .pell-content, .pell-content p{text-align: left; font-family: Helvetica, sans-serif; font-size: 17px; line-height: 26px;}
    #edit-text{margin-bottom: 75px;}

    ${editable_title}{cursor:pointer;border:1px solid transparent;}
    h1:hover:not(.exclude),h2:hover:not(.exclude),h3:hover:not(.exclude),h4:hover:not(.exclude),h5:hover:not(.exclude){border:1px solid lightblue;}
    ${editable_paragraph}:not(.exclude){cursor:pointer;border:1px solid transparent;}
    ${editable_paragraph}:hover:not(.exclude){border:1px solid lightblue;}
    .current-item{border:1px solid lightblue;}
    </style>`;

    document.body.innerHTML += `
    <div id="widget" class="ww-widget">
      <div class="ww-header"><div class="ww-close">&times;</div></div>
      <div class="ww-content" id="widget-content">
      
      <!-- <h2 class="exclude">Welcome</h2><p class="exclude">Click on an element on the page to edit it.</p>-->
      
      <input type="text" class="form-control editor" id="edit-title">
      <div id="edit-text" class="pell editor"></div>

      
      </div>
      <div class="ww-footer"><a href="#" class="ww-button ww-button-close">OK</a></div>
    </div>`;

    document.querySelector('.ww-close').addEventListener('click', function() {
        document.querySelector('#widget').classList.add('closing');
    });
    document.querySelector('.ww-button-close').addEventListener('click', function() {
        document.querySelector('#widget').classList.add('closing');
    });

    const editor = pell.init({
        element: document.getElementById('edit-text'),
        onChange: html => {
            el('.current-item').innerHTML = html
        },
        defaultParagraphSeparator: 'p',
        styleWithCSS: true,
        actions: [
            'bold',
            'underline',
            {
                name: 'italic',
                result: () => exec('italic')
            },
            {
                name: 'image',
                result: () => {
                    const url = window.prompt('Enter the image URL')
                    if (url) exec('insertImage', url)
                }
            },
            {
                name: 'link',
                result: () => {
                    const url = window.prompt('Enter the link URL')
                    if (url) exec('createLink', url)
                }
            }
        ]
    })


}



function getData(mypath = '') {

    let user = netlifyIdentity.currentUser()
    let token = user.token.access_token

    var url = "/.netlify/git/github/contents/" + mypath
    var bearer = 'Bearer ' + token
    return fetch(url, {
            method: 'GET',
            withCredentials: true,
            credentials: 'include',
            headers: {
                'Authorization': bearer,
                'Content-Type': 'application/json'
            }
        }).then(resp => {
            return resp.json()
        }).then(data => {

            if (data.code == 400) {

                netlifyIdentity.refresh().then(function(token) {
                    getData(mypath)
                })

            } else {
                return data
            }
        })
        .catch(error => {
            return error
        })

}

function saveData(mypath, data) {

    getData(mypath).then(function(curfile) {

        let user = netlifyIdentity.currentUser()
        let token = user.token.access_token

        let opts = {
            path: mypath,
            message: "initial commit",
            content: btoa(data),
            branch: "master",
            committer: { name: "Dashpilot", email: "support@dashpilot.com" },
        }

        if (typeof curfile !== 'undefined') {
            opts.sha = curfile.sha
        }

        var url = "/.netlify/git/github/contents/" + mypath
        var bearer = 'Bearer ' + token
        fetch(url, {
                body: JSON.stringify(opts),
                method: 'PUT',
                withCredentials: true,
                credentials: 'include',
                headers: {
                    'Authorization': bearer,
                    'Content-Type': 'application/json'
                }
            }).then(resp => {
                return resp.json()
            }).then(data => {
                if (data.code == 400) {

                    netlifyIdentity.refresh().then(function(token) {
                        saveData(mypath)
                    })

                } else {
                    return data
                }
            })
            .catch(error => this.setState({
                message: 'Error: ' + error
            }))

    })

}