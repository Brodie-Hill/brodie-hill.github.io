export default async function getSheetAsync(url)
{
    const response = await fetch(url);
    const cssText = await response.text();

    const sheet = new CSSStyleSheet();

    await sheet.replace(cssText);

    return sheet;
}