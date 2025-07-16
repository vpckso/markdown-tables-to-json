/*
 * index.ts
 * 
 * Main class (Extractor) for markdown-tables-to-json. Requires `markdown-it` to
 * parse Markdown-formatted strings.
 * 
 * Ian Cooper
 * 31 December 2020
 * 
 */

/**
 * A module for extracting tables from Markdown documents.
 * @module markdown-tables-to-string
 */

import MarkdownIt from 'markdown-it';


/**
 * Table mode type definition; `'rows'` or `'columns'`.
 */
export type TableMode = 'rows' | 'columns';

/**
 * Extracts tables from Markdown-formatted strings.
 * @class Extractor
 */
export class Extractor {

    mode: TableMode;
    lowercaseKeys: boolean;
    protected currentRow: string[];
    protected currentTable: string[][];
    protected extractedTables: string[][][];

    get tables(): string[][][] { return this.extractedTables; };
    get objects(): {}[] { return this.extractedTables.map(table => Extractor.tableToObject(table, this.lowercaseKeys)); };

    /**
     * Constructor. Creates the extractor with the specified mode.
     * @param {string} [mode] `'rows'` or `'columns'`
     */
    constructor(mode?: TableMode, lowercaseKeys?: boolean) {
        this.lowercaseKeys = lowercaseKeys ?? false;
        this.reset(mode);
    }

    /**
     * Clears the extracted tables and allows the mode to be changed.
     * @param {string} [mode='rows'] `'rows'` or `'columns'`
     */
    reset(mode: TableMode = 'rows'): void {
        this.mode = mode;
        this.currentRow = [];
        this.currentTable = [];
        this.extractedTables = [];
    }

    protected parseTokens(tokens: MarkdownIt.Token[]): void {
        let inTable = false;
        let inRow = false;
    
        for (const token of tokens) {
            if (token.type === 'table_open') {
                inTable = true;
                this.currentTable = [];
            } else if (token.type === 'table_close') {
                inTable = false;
                this.extractedTables.push(
                    this.mode === 'rows'
                        ? this.currentTable
                        : Extractor.transposeTable(this.currentTable)
                );
            } else if (inTable && token.type === 'tr_open') {
                inRow = true;
                this.currentRow = [];
            } else if (inTable && token.type === 'tr_close') {
                inRow = false;
                this.currentTable.push(this.currentRow);
            } else if (inRow && token.type === 'inline') {
                this.currentRow.push(token.content);
            }
        }
    }

    /**
     * Transposes the rows and columns of a table.
     * @param {string[][]} table square 2-dimensional string array
     * @returns {string[][]} transposed table
     */
    static transposeTable(table: string[][]): string[][] {
        let transposed = [];
        if (table.length === 0) {
            return [];
        }
        let cols = table.length;
        let rows = table[0].length;

        for (let row = 0; row < rows; row++) {
            transposed.push([]);
            for (let col = 0; col < cols; col++) {
                transposed[row].push(table[col][row]);
            }
        }

        return transposed;
    }

    /**
     * Converts a row-oriented table to an object.
     * @param {string[][]} table square 2-dimensional string array
     * @returns {Object} object
     */
    static tableToObject(table: string[][], lowercaseKeys: boolean): {} {
        if (!table || table.length === 0) {
            return {};
        }
        let keys: string[] = table.shift().slice(1);
        let obj = {};

        table.forEach((cells) => {
            let rowName = cells.shift();
            let rowObj = {};
            cells.forEach((cell, index) => {
                rowObj[lowercaseKeys ? keys[index].toLowerCase() : keys[index]] = cell;
            });
            obj[lowercaseKeys ? rowName.toLowerCase() : rowName] = rowObj;
        });

        return obj;
    }

    /**
     * Parses the provided Markdown input string and returns the associated Extractor.
     * Not public; use the extract* methods to access the extracted tables in various formats.
     * @param {string} markdown Markdown input string
     * @param {string} [mode] `'rows'` or `'columns'`
     * @returns {Extractor} an Extractor object after parsing is complete
     */
    protected static createExtractor(markdown: string, mode?: TableMode, lowercaseKeys?: boolean): Extractor {
        const md = new MarkdownIt();
        const tokens = md.parse(markdown, {});
        const extractor = new Extractor(mode, lowercaseKeys);
        extractor.parseTokens(tokens);
        return extractor;
    }

    /**
     * Extracts the first table in the provided Markdown input string.
     * @param {string} markdown Markdown input string
     * @param {string} [mode] `'rows'` or `'columns'`
     * @returns {Object} object representing the first extracted table, or `null` if there isn't one
     */
    static extractObject(markdown: string, mode?: TableMode, lowercaseKeys?: boolean): {} {
        let objects = Extractor.extractAllObjects(markdown, mode, lowercaseKeys);
        return objects.length > 0 ? objects[0] : null;
    }

    /**
     * Extracts all of the tables in the provided Markdown input string.
     * @param {string} markdown Markdown input string
     * @param {string} [mode] `'rows'` or `'columns'`
     * @returns {Object[]} array of objects representing the extracted tables; might be empty
     */
    static extractAllObjects(markdown: string, mode?: TableMode, lowercaseKeys?: boolean): {}[] {
        let extractor = Extractor.createExtractor(markdown, mode, lowercaseKeys);
        return extractor.objects;
    }

    /**
     * Extracts the first table in the provided Markdown input string.
     * @param {string} markdown Markdown input string
     * @param {string} [mode] `'rows'` or `'columns'`
     * @returns {string[][]} 2-dimensional string array representing the first extracted table, or `null` if there isn't one
     */
    static extractTable(markdown: string, mode?: TableMode, lowercaseKeys?: boolean): string[][] {
        let tables = Extractor.extractAllTables(markdown, mode, lowercaseKeys);
        return tables.length > 0 ? tables[0] : null;
    }

    /**
     * Extracts all of the tables in the provided Markdown input string.
     * @param {string} markdown Markdown input string
     * @param {string} [mode] `'rows'` or `'columns'`
     * @returns {string[][][]} array of 2-dimensional string arrays representing the extracted tables; might be empty
     */
    static extractAllTables(markdown: string, mode?: TableMode, lowercaseKeys?: boolean): string[][][] {
        let extractor = Extractor.createExtractor(markdown, mode, lowercaseKeys);
        return extractor.tables;
    }

    /**
     * Extracts the first table in the provided Markdown input string.
     * @param {string} markdown Markdown input string
     * @param {string} [mode] `'rows'` or `'columns'`
     * @returns {string} JSON string representing the first extracted table, or `null` if there isn't one
     */
    static extract(markdown: string, mode?: TableMode, lowercaseKeys?: boolean): string {
        let extractor = Extractor.createExtractor(markdown, mode, lowercaseKeys);
        return extractor.objects.length > 0 ? JSON.stringify(extractor.objects[0]) : null;
    }

    /**
     * Extracts all of the tables in the provided Markdown input string.
     * @param {string} markdown Markdown input string
     * @param {string} [mode] `'rows'` or `'columns'`
     * @returns {string[]} array of JSON strings representing the extracted tables; might be empty
     */
    static extractAll(markdown: string, mode?: TableMode, lowercaseKeys?: boolean): string[] {
        let extractor = Extractor.createExtractor(markdown, mode, lowercaseKeys);
        return extractor.objects.map(obj => JSON.stringify(obj));
    }
}
