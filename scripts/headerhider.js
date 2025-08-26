let lastScr = 0;
const header = document.querySelector("header")
window.addEventListener("scroll", () =>
{
    if (window.pageYOffset > lastScr) header.classList.add("collapse")
    else header.classList.remove("collapse")

    lastScr = window.pageYOffset
})