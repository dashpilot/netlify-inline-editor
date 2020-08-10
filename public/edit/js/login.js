document.querySelector('#login').addEventListener('click', function() {
    netlifyIdentity.open()
})

netlifyIdentity.on('login', function(user) {
    document.querySelector('#login').innerHTML = 'Log Out'
    window.location = '../';
})