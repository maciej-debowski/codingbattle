document.addEventListener("DOMContentLoaded", () => {
    document.querySelector(".button-lobby-create").addEventListener("click", () => {
        const Request = new XMLHttpRequest()
        Request.open("post", '/api/creategame')
        Request.send()

        Request.addEventListener("readystatechange", () => {
            if(Request.responseText != "") window.location.href += 'game/' + Request.responseText
        })
    })
})