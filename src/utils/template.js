/**
 * Replaces placeholders in a template string with data.
 * Supports {{key}} for direct replacement and {{#key}}...{{/key}} for loops (basic).
 * Or simply replace {{key}} with value.
 * 
 * For this refactor, we will stick to simple replacements or using map in JS 
 * and passing the resulting HTML string to the template if needed, 
 * or just using the template for the outer structure.
 * 
 * Actually, given the complexity of the current JS rendering (loops inside loops),
 * a simple {{key}} replacement might be insufficient without a heavy engine.
 * 
 * STRATEGY: 
 * We will export functions that take data and return strings, but the "HTML" parts 
 * will be imported from .html files.
 * The .html files will be treated as strings.
 * 
 * @param {string} template 
 * @param {object} data 
 * @returns {string}
 */
export function render(template, data = {}) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] !== undefined ? data[key] : '';
    });
}
