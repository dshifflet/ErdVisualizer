import { Component, OnInit } from '@angular/core';
import {ErdViz} from '../services/erdviz';

declare var d3: any;

@Component({
  selector: 'app-erdeditor',
  templateUrl: './erdeditor.component.html',
  styleUrls: ['./erdeditor.component.css']
})
export class ErdeditorComponent implements OnInit {
  markup: string;
  errorDisplay: string;
  graphviz: any;
  constructor() {
  }

  ngOnInit() {
    this.graphviz = d3.select('#graph').graphviz()
    .transition(function () {
        return d3.transition('main')
            .ease(d3.easeLinear)
            .delay(0)
            .duration(0);
    });
    this.markup =
`# SAMPLE ERD FILE
# To create a comment start a line with #.

# To create a table copy and paste the SQL
create table AUTHOR (
AUTHOR_ID INT NOT NULL,
NAME VARCHAR(50) NOT NULL,
POSTCODE VARCHAR(50)
)

# Or put the table name in square brackets and the fields like so:

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

# Relationships are defined by:
# TableName.FieldName [Cardinality] TableName.FieldName
# Cardinality can be:
# 1:* = One to Many
# 1:1 = One to One
# *:* = Many to Many

AUTHOR.AUTHOR_ID [1:*] BOOK.AUTHOR_ID
OWNER.OWNER_ID 1:* INVENTORY.OWNER_ID
BOOK.BOOK_ID 1:* INVENTORY.BOOK_ID`;
    this.render(this.interpret(this.markup));
  }

  onMarkupChange(): void {
    this.render(this.interpret(this.markup));
  }

  interpret(input: string): string {
    try {
      const dotGenerator = new ErdViz.DotGenerator();
      const db = dotGenerator.parse(input);
      this.errorDisplay = '';
      return db.toDot();
    } catch (err) {
      this.errorDisplay = err;
    }
  }

  render(input: string): void {
    try {
      this.graphviz.renderDot(input);
    } catch (error) {
      alert('Error');
    }
  }
}
