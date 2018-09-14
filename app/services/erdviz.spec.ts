import {ErdViz} from './erdviz';

  // Straight Jasmine testing without Angular's testing support
    describe('ErdViz', () => {
        let table: ErdViz.Table;
        let dotGenerator: ErdViz.DotGenerator;
        let outText = '';
        beforeEach(() => {
          table = new ErdViz.Table({Name: 'DaveTable'});
          dotGenerator = new ErdViz.DotGenerator();
        });

        it('#toDot should return some text', () => {
          expect(table.toDot()).toContain('BORDER="0" CELLPADDING="0" CELLSPACING="0.5"');
        });

        it('#parse should return a database with tables', () => {
          const testErd =
`# SAMPLE ERD FILE
create table AUTHOR (
AUTHOR_ID INT NOT NULL,
NAME VARCHAR(50) NOT NULL,
POSTCODE VARCHAR(50)


[BOOK]
BOOK_ID INT NOT NULL,
AUTHOR_ID INT NOT NULL,
NAME VARCHAR(50) NOT NULL,

[OWNER]
OWNER_ID INT NOT NULL,
NAME VARCHAR(ABC50) NOT NULL,

[INVENTORY]
INVENTORY_ID INT NOT NULL,
OWNER_ID INT NOT NULL,
BOOK_ID INT NOT NULL
CREATED_DATE_UTC
CREATED_BY

AUTHOR.AUTHOR_ID [1:*] BOOK.AUTHOR_ID
OWNER.OWNER_ID 1:* INVENTORY.OWNER_ID
BOOK.BOOK_ID 1:* INVENTORY.BOOK_ID
          `;
          const db = dotGenerator.parse(testErd);
          expect(db.Tables.length === 4);
          expect(db.Tables[0].Fields.length === 3);
          expect(db.Relationships.length === 3);
          const dotText = db.toDot();
          outText = dotText;
          expect(dotText.length > 0);
          console.log(dotText);
        });
});
