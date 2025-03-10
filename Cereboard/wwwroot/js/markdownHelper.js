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

// Nastavení globálních event listenerů pro zpracování Enter v textových polích
export function setupListMarkdownListeners() {
    // Najdeme všechny textarea elementy v MudTextField komponentách
    document.querySelectorAll('.mud-input textarea').forEach(textarea => {
        if (textarea._hasMarkdownListener) return; // Vyhýbáme se dvojitým listenerům

        textarea.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                const handled = processListItemInTextarea(textarea);
                if (handled) {
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                }
            }
        }, true); // true pro capture fázi, aby se zachytila událost před Blazor handlery

        textarea._hasMarkdownListener = true;
    });

    return true;
}

// Zpracování položky seznamu v konkrétním textarea elementu
function processListItemInTextarea(textarea) {
    try {
        const pos = textarea.selectionStart;
        const text = textarea.value;

        // Získáme aktuální řádek
        const beforeCursor = text.substring(0, pos);
        const lastNewlineIndex = beforeCursor.lastIndexOf('\n');
        const currentLineStart = lastNewlineIndex === -1 ? 0 : lastNewlineIndex + 1;
        const currentLine = beforeCursor.substring(currentLineStart);

        // Kontrola číslovaného seznamu
        const numberedMatch = currentLine.match(/^(\d+)\.\s(.*)$/);
        if (numberedMatch) {
            const num = parseInt(numberedMatch[1]);
            const content = numberedMatch[2];

            // Pokud je obsah prázdný, ukončíme seznam
            if (!content.trim()) {
                const newText = text.substring(0, currentLineStart) + text.substring(pos);
                textarea.value = newText;
                textarea.selectionStart = currentLineStart;
                textarea.selectionEnd = currentLineStart;

                // Vyvoláme událost změny
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                return true;
            }

            // Přidáme nový bod seznamu
            const newItem = `${num + 1}. `;
            const newText = text.substring(0, pos) + "\n" + newItem + text.substring(pos);
            textarea.value = newText;
            textarea.selectionStart = pos + 1 + newItem.length;
            textarea.selectionEnd = pos + 1 + newItem.length;

            // Vyvoláme událost změny
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
        }

        // Kontrola odrážkového seznamu
        const bulletMatch = currentLine.match(/^([-*])\s(.*)$/);
        if (bulletMatch) {
            const bullet = bulletMatch[1];
            const content = bulletMatch[2];

            // Pokud je obsah prázdný, ukončíme seznam
            if (!content.trim()) {
                const newText = text.substring(0, currentLineStart) + text.substring(pos);
                textarea.value = newText;
                textarea.selectionStart = currentLineStart;
                textarea.selectionEnd = currentLineStart;

                // Vyvoláme událost změny
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                return true;
            }

            // Přidáme nový bod seznamu
            const newItem = `${bullet} `;
            const newText = text.substring(0, pos) + "\n" + newItem + text.substring(pos);
            textarea.value = newText;
            textarea.selectionStart = pos + 1 + newItem.length;
            textarea.selectionEnd = pos + 1 + newItem.length;

            // Vyvoláme událost změny
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
        }

        return false;
    } catch (error) {
        console.error("Error in processListItemInTextarea:", error);
        return false;
    }
}

// Zpracování položky seznamu podle ID
export function processListItem(textAreaId) {
    try {
        const textarea = document.getElementById(textAreaId);
        if (!textarea) return false;

        const input = textarea.querySelector('textarea') || textarea;
        if (!input) return false;

        return processListItemInTextarea(input);
    } catch (error) {
        console.error("Error in processListItem:", error);
        return false;
    }
}

// Pro zpětnou kompatibilitu
export function handleEnterInList(textAreaId) {
    return processListItem(textAreaId);
}

// Prázdná funkce pro tab
export function handleTab(textAreaId, shiftKey) {
    return false;
}