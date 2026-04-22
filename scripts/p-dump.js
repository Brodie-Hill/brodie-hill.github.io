
export function dumpIntoP(element, {defaultText = "", filePath = null} = {})
{
    const finalPath = filePath?.trim() || element.getAttribute('data-file')?.trim();
    
    if (!finalPath)
    {
        element.textContent = defaultText;
        return;
    }

    let dump = (text) => {
        element.style.whiteSpace = "pre-wrap";
        element.textContent = text && text.trim() ? text : defaultText;
    };
    let err = (err) =>
    {
        element.textContent = defaultText;
        console.error(err);
    }
    
    fetch(finalPath)
        .then(res => {return res.ok ? res.text() : "";})
        .then(dump)
        .catch(err);
}

let globalDump = false;
export function dumpIntoPAll()
{
    if (globalDump) return;
    globalDump = true;
    const elements = document.querySelectorAll('p[data-file]');
    elements.forEach(el => dumpIntoP(el));
}
// deferred or not?
dumpIntoPAll();
window.addEventListener('DOMContentLoaded', dumpIntoPAll);