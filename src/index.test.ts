/*
 * test.ts
 * 
 * Run some basic tests on the table extractor.
 * 
 * Ian Cooper
 * 31 December 2020
 * 
 */

// import the table extractor
import { Extractor } from '.';

// markdown string with a row-oriented table
const md_rows = `
| Name     | Head  | Body  | Tail  | Paws  |
|----------|-------|-------|-------|-------|
| Mittens  | BLACK | black | black | white |
| Dipstick | white | white | black | white |
| Snow     | white | white | white | white |
`

// markdown string with a column-oriented table
const md_cols = `
| Name | Mittens | Dipstick | Snow  |
|------|---------|----------|-------|
| Head | BLACK   | white    | white |
| Body | black   | white    | white |
| Tail | black   | black    | white |
| Paws | white   | white    | white |
`

const md_multiple = `
First table:

| Key | Value |
|---|---|
| A | 1 |
| B | 2 |

Second table:

| Prop | Data |
|---|---|
| X | 100 |
| Y | 200 |
`;

const md_empty_cells = `
| Name | Age | Location |
|---|---|---|
| Alice | 30 | |
| Bob | | New York |
| Charlie | 25 | London |
`;

const md_no_table = "This is a string with no table.";

describe('Extractor', () => {
    it('should extract tables from markdown', () => {
        // parse the markdown
        let json_rows = Extractor.extract(md_rows, 'rows');
        let table_rows = Extractor.extractTable(md_rows, 'rows');
        let obj_rows = Extractor.extractObject(md_rows, 'rows');
        let json_cols = Extractor.extract(md_cols, 'columns');
        let table_cols = Extractor.extractTable(md_cols, 'columns');
        let obj_cols = Extractor.extractObject(md_cols, 'columns');

        // compare the results when parsed by rows and columns in different formats
        [
            { type: 'JSON strings', rows: json_rows,  cols: json_cols  },
            { type: 'tables',       rows: table_rows, cols: table_cols },
            { type: 'objects',      rows: obj_rows,   cols: obj_cols   }
        ].forEach((test: { type: string, rows: any, cols: any }) => {
            // JSON.stringify is the easiest way to test that the objects are equivalent
            expect(JSON.stringify(test.rows)).toEqual(JSON.stringify(test.cols));
        });
    });

    it('should handle multiple tables', () => {
        const tables = Extractor.extractAllTables(md_multiple);
        const objects = Extractor.extractAllObjects(md_multiple);
        const jsons = Extractor.extractAll(md_multiple);

        expect(tables).toHaveLength(2);
        expect(objects).toHaveLength(2);
        expect(jsons).toHaveLength(2);

        expect(tables[0][1][0]).toBe('A');
        expect(objects[1]['Y']['Data']).toBe('200');
    });

    it('should handle no tables', () => {
        const table = Extractor.extractTable(md_no_table);
        const object = Extractor.extractObject(md_no_table);
        const json = Extractor.extract(md_no_table);

        expect(table).toBeNull();
        expect(object).toBeNull();
        expect(json).toBeNull();
    });

    it('should handle empty cells', () => {
        const table = Extractor.extractTable(md_empty_cells);
        const object = Extractor.extractObject(md_empty_cells);

        expect(table[1][2]).toBe('');
        expect(table[2][1]).toBe('');
        expect(object['Alice']['Location']).toBe('');
        expect(object['Bob']['Age']).toBe('');
    });

    it('should handle the lowercaseKeys option', () => {
        const obj = Extractor.extractObject(md_rows, 'rows', true);
        expect(obj['mittens']['head']).toBe('BLACK');
    });
});