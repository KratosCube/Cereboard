// Flag pro sledování, zda jsme již nastavili observery
let setupComplete = false;

// Hlavní funkce pro nastavení zpracování klávesy Enter
export function setupEnterHandling() {
    // Zabráníme dvojitému nastavení
    if (setupComplete) return;

    console.log("Setting up Enter and Tab handling for Markdown lists");

    // Použijeme MutationObserver pro sledování nově přidaných textových polí
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes) {
                mutation.addedNodes.forEach((node) => {
                    // Pokud je přidaný uzel element
                    if (node.nodeType === 1) {
                        // Najdeme všechny textarea elementy v přidaném uzlu
                        const textareas = node.querySelectorAll("textarea");
                        textareas.forEach(setupTextArea);

                        // Zkontrolujeme, zda samotný přidaný uzel není textarea
                        if (node.tagName === "TEXTAREA") {
                            setupTextArea(node);
                        }
                    }
                });
            }
        });
    });

    // Nastavíme observer pro sledování celého dokumentu
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Nastavíme všechny existující textarea elementy
    document.querySelectorAll("textarea").forEach(setupTextArea);

    // Označíme, že nastavení bylo dokončeno
    setupComplete = true;
}

// Funkce pro nastavení konkrétního textarea elementu
function setupTextArea(textarea) {
    // Pokud již má nastavený handler, přeskočíme
    if (textarea._hasEnterHandler) return;

    // Přidáme keydown handler
    textarea.addEventListener("keydown", handleKeyDown, true);

    // Označíme, že element má nastavený handler
    textarea._hasEnterHandler = true;
}

// Handler pro zpracování klávesy
function handleKeyDown(event) {
    const textarea = event.target;

    // Zpracování klávesy Tab
    if (event.key === "Tab") {
        // Vždy zabráníme výchozímu chování (přesunu na další element)
        event.preventDefault();

        const pos = textarea.selectionStart;
        const text = textarea.value;

        // Získáme aktuální řádek
        const textBeforeCursor = text.substring(0, pos);
        const lastNewlineIndex = textBeforeCursor.lastIndexOf('\n');
        const lineStart = lastNewlineIndex === -1 ? 0 : lastNewlineIndex + 1;
        const currentLine = textBeforeCursor.substring(lineStart);

        // Kontrola, zda jsme na řádku se seznamem (číslovaný nebo odrážkový)
        const isListItem = /^(\s*)([*-]|\d+\.)\s/.test(currentLine);

        if (isListItem) {
            const lineEnd = text.indexOf('\n', pos);
            const fullLine = text.substring(lineStart, lineEnd > -1 ? lineEnd : text.length);

            if (event.shiftKey) {
                // Shift+Tab: Zmenšení odsazení
                if (fullLine.startsWith('    ')) {
                    // Odstraníme 4 mezery ze začátku řádku
                    const newText = text.substring(0, lineStart) + fullLine.substring(4) + text.substring(lineEnd > -1 ? lineEnd : text.length);
                    textarea.value = newText;

                    // Upravíme pozici kurzoru
                    const newCursorPos = pos - Math.min(4, pos - lineStart);
                    textarea.selectionStart = newCursorPos;
                    textarea.selectionEnd = newCursorPos;
                }
                else if (fullLine.startsWith('  ')) {
                    // Odstraníme 2 mezery ze začátku řádku
                    const newText = text.substring(0, lineStart) + fullLine.substring(2) + text.substring(lineEnd > -1 ? lineEnd : text.length);
                    textarea.value = newText;

                    // Upravíme pozici kurzoru
                    const newCursorPos = pos - Math.min(2, pos - lineStart);
                    textarea.selectionStart = newCursorPos;
                    textarea.selectionEnd = newCursorPos;
                }
            } else {
                // Tab: Zvětšení odsazení
                const newText = text.substring(0, lineStart) + '    ' + fullLine + text.substring(lineEnd > -1 ? lineEnd : text.length);
                textarea.value = newText;

                // Upravíme pozici kurzoru
                const newCursorPos = pos + 4;
                textarea.selectionStart = newCursorPos;
                textarea.selectionEnd = newCursorPos;
            }

            // Vyvoláme událost input pro aktualizaci Blazor bindingu
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            return false;
        }

        // Pokud nejsme na řádku se seznamem, vložíme standardní tabulátor (4 mezery)
        const newText = text.substring(0, pos) + '    ' + text.substring(pos);
        textarea.value = newText;

        // Nastavíme kurzor za vložené mezery
        textarea.selectionStart = pos + 4;
        textarea.selectionEnd = pos + 4;

        // Vyvoláme událost input pro aktualizaci Blazor bindingu
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        return false;
    }

    // Reagujeme pouze na Enter bez Shiftu
    if (event.key === "Enter" && !event.shiftKey) {
        const pos = textarea.selectionStart;
        const text = textarea.value;

        // Získáme aktuální řádek
        const textBeforeCursor = text.substring(0, pos);
        const lastNewlineIndex = textBeforeCursor.lastIndexOf('\n');
        const lineStart = lastNewlineIndex === -1 ? 0 : lastNewlineIndex + 1;
        const currentLine = textBeforeCursor.substring(lineStart);

        // Zjistíme odsazení řádku (počet mezer na začátku)
        const indentMatch = currentLine.match(/^(\s*)/);
        const indentation = indentMatch ? indentMatch[1] : '';

        // Test na číslovaný seznam: "1. ", "2. ", atd. (včetně odsazení)
        const numberedMatch = currentLine.match(/^(\s*)(\d+)\.\s(.*)$/);
        if (numberedMatch) {
            // Zabráníme výchozímu chování
            event.preventDefault();
            event.stopPropagation();

            const indent = numberedMatch[1] || '';  // Odsazení
            const number = parseInt(numberedMatch[2]);
            const content = numberedMatch[3];

            // Prázdný obsah = ukončení seznamu
            if (!content.trim()) {
                // Odstraníme prefix seznamu
                const newText = text.substring(0, lineStart) + text.substring(pos);
                textarea.value = newText;
                textarea.selectionStart = lineStart;
                textarea.selectionEnd = lineStart;
            } else {
                // Přidáme další položku seznamu se stejným odsazením
                const newItemPrefix = `\n${indent}${number + 1}. `;
                const newText = text.substring(0, pos) + newItemPrefix + text.substring(pos);

                textarea.value = newText;
                textarea.selectionStart = pos + newItemPrefix.length;
                textarea.selectionEnd = pos + newItemPrefix.length;
            }

            // Vyvoláme událost input pro aktualizaci Blazor bindingu
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            return false;
        }

        // Test na odrážkový seznam: "- ", "* " (včetně odsazení)
        const bulletMatch = currentLine.match(/^(\s*)([-*])\s(.*)$/);
        if (bulletMatch) {
            // Zabráníme výchozímu chování
            event.preventDefault();
            event.stopPropagation();

            const indent = bulletMatch[1] || '';  // Odsazení
            const bulletChar = bulletMatch[2];
            const content = bulletMatch[3];

            // Prázdný obsah = ukončení seznamu
            if (!content.trim()) {
                // Odstraníme prefix seznamu
                const newText = text.substring(0, lineStart) + text.substring(pos);
                textarea.value = newText;
                textarea.selectionStart = lineStart;
                textarea.selectionEnd = lineStart;
            } else {
                // Přidáme další položku seznamu se stejným odsazením
                const newItemPrefix = `\n${indent}${bulletChar} `;
                const newText = text.substring(0, pos) + newItemPrefix + text.substring(pos);

                textarea.value = newText;
                textarea.selectionStart = pos + newItemPrefix.length;
                textarea.selectionEnd = pos + newItemPrefix.length;
            }

            // Vyvoláme událost input pro aktualizaci Blazor bindingu
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            return false;
        }
    }
}

// Funkce pro vložení textu na pozici kurzoru
export function insertTextAtCursor(textAreaId, startTag, endTag) {
    try {
        const textarea = document.getElementById(textAreaId);
        if (!textarea) {
            console.error(`Textarea s ID ${textAreaId} nebyla nalezena`);
            return false;
        }

        // Pro MudBlazor TextFields, potřebujeme najít skutečný input element
        const input = textarea.querySelector('textarea') || textarea;

        if (!input || typeof input.selectionStart !== 'number') {
            console.error('Nepodařilo se najít textové pole');
            return false;
        }

        const start = input.selectionStart;
        const end = input.selectionEnd;
        const text = input.value;
        const selectedText = text.substring(start, end);

        // Vložíme tagy kolem výběru nebo na pozici kurzoru
        const newText = text.substring(0, start) + startTag + selectedText + endTag + text.substring(end);

        // Nastavíme novou hodnotu
        input.value = newText;

        // Nastavíme kurzor
        const newCursorPos = selectedText ? start + startTag.length + selectedText.length + endTag.length : start + startTag.length;
        input.setSelectionRange(newCursorPos, newCursorPos);
        input.focus();

        // Vyvoláme událost input pro aktualizaci bindingu
        const event = new Event('input', { bubbles: true });
        input.dispatchEvent(event);

        return true;
    } catch (error) {
        console.error("Error in insertTextAtCursor:", error);
        return false;
    }
}