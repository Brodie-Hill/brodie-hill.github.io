function addClass(cls, ...selectors)
{
    selectors.forEach(
        e => {
            document.querySelectorAll(e).forEach(
                e => {
                    e.classList.add(cls);
                }
            )
        }
    )
}

function removeClass(cls, ...selectors)
{
    selectors.forEach(
        e => {
            document.querySelectorAll(e).forEach(
                e => {
                    e.classList.remove(cls);
                }
            )
        }
    )
}

function toggleClass(cls, ...selectors)
{
    selectors.forEach(
        e => {
            document.querySelectorAll(e).forEach(
                e => {
                    e.classList.toggle(cls);
                }
            )
        }
    )
}

function autoHide(cls, ...selectors)
{
    window.addEventListener("resize", () => {removeClass(cls, ...selectors)});
}