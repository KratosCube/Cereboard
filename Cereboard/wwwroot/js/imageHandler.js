// Image storage using localStorage to avoid Blazor binding issues
const IMAGE_STORAGE_PREFIX = 'cereboard_img_';

// Store image data in localStorage
export function storeImageData(id, imageData) {
    try {
        localStorage.setItem(`${IMAGE_STORAGE_PREFIX}${id}`, imageData);
        return true;
    } catch (error) {
        console.error("Error storing image data:", error);
        return false;
    }
}

// Store image data outside of Blazor's binding system
export function getImageData(id) {
    try {
        return localStorage.getItem(`${IMAGE_STORAGE_PREFIX}${id}`);
    } catch (error) {
        console.error("Error retrieving image data:", error);
        return null;
    }
}

// Replace all image placeholders with actual images in HTML
export function replaceImagePlaceholders(html, prefix = 'IMG:') {
    try {
        const regex = new RegExp(`${prefix}([a-z0-9_-]+)`, 'gi');
        return html.replace(regex, (match, id) => {
            const imageData = getImageData(id);
            return imageData || 'missing-image';
        });
    } catch (error) {
        console.error("Error replacing image placeholders:", error);
        return html;
    }
}

// Insert image placeholder at cursor position
export function insertImagePlaceholder(textareaId, imageId) {
    try {
        const textarea = document.getElementById(textareaId);
        if (!textarea) return false;
        
        const input = textarea.querySelector('textarea') || textarea;
        if (!input) return false;
        
        const placeholder = `![Obrázek](IMG:${imageId})`;
        const start = input.selectionStart;
        
        // Direct DOM manipulation - bypass Blazor binding
        const newText = input.value.substring(0, start) + placeholder + input.value.substring(start);
        input.value = newText;
        
        // Move cursor after insertion
        input.selectionStart = start + placeholder.length;
        input.selectionEnd = start + placeholder.length;
        
        // Trigger change event for Blazor
        input.dispatchEvent(new Event('input', { bubbles: true }));
        
        return true;
    } catch (error) {
        console.error("Error inserting image placeholder:", error);
        return false;
    }
}

// Simple image optimization - resize and compress
export function optimizeImage(dataUrl, maxWidth, maxHeight, quality) {
    return new Promise((resolve, reject) => {
        try {
            const img = new Image();
            img.onload = function () {
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
                if (width > maxWidth) {
                    height = height * (maxWidth / width);
                    width = maxWidth;
                }

                if (height > maxHeight) {
                    width = width * (maxHeight / height);
                    height = maxHeight;
                }

                // Create canvas and resize
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to JPEG with quality setting
                resolve(canvas.toDataURL('image/jpeg', quality || 0.7));
            };

            img.onerror = () => reject("Failed to load image");
            img.src = dataUrl;
        } catch (error) {
            reject(error);
        }
    });
}

// Replace all image placeholders with actual images in HTML preview
// Replace all image placeholders with actual images in HTML preview
export function replaceImagePlaceholdersInPreview(containerSelector) {
    try {
        // Find all image placeholders in the document
        const placeholderImages = document.querySelectorAll(`${containerSelector} img.image-placeholder`);

        // Replace each placeholder with the actual image
        placeholderImages.forEach(img => {
            const imageId = img.getAttribute('data-img-id');
            if (imageId) {
                const imageData = getImageData(imageId);
                if (imageData) {
                    img.src = imageData;
                    img.classList.remove('image-placeholder');
                }
            }
        });

        return true;
    } catch (error) {
        console.error("Error replacing image placeholders:", error);
        return false;
    }
}

// Direct injection of image placeholders as real images
export function injectImagesIntoPreview(html) {
    try {
        // Find all image placeholders using regex
        const regex = /data-img-id="([^"]+)"/g;
        let match;
        let modifiedHtml = html;

        while ((match = regex.exec(html)) !== null) {
            const imageId = match[1];
            const imageData = getImageData(imageId);

            if (imageData) {
                // Create a unique marker for this placeholder
                const marker = `PLACEHOLDER_${imageId}_MARKER`;

                // Replace the src attribute in this specific img tag
                const imgRegex = new RegExp(`<img[^>]*data-img-id="${imageId}"[^>]*>`, 'g');
                const imgTag = html.match(imgRegex)[0];

                // Replace the src in this specific tag
                const newImgTag = imgTag.replace(/src="[^"]*"/, `src="${imageData}"`);

                // Replace this occurrence in our modified HTML
                modifiedHtml = modifiedHtml.replace(imgTag, newImgTag);
            }
        }

        return modifiedHtml;
    } catch (error) {
        console.error("Error injecting images:", error);
        return html;
    }
}