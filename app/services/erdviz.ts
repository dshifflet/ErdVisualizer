export namespace ErdViz {
    export class Database {
        Tables: Array<Table> = new Array<Table>();
        Relationships: Array<Relationship> = new Array<Relationship>();

        toDot(): string {
            let result = this.generateHeader(' ');
            this.Relationships.forEach(o => {
                result += o.toDot();
            });
            this.Tables.forEach(o => {
                result += o.toDot();
            });
            result += '}';
            return result;
        }

        generateHeader(name: string): string {
            return `
graph {
graph [label=<<FONT POINT-SIZE="20">${name}</FONT>>,
            labeljust = l,
            labelloc = t, nodesep = 0.5,
            ranksep = 0.5,
            pad = "0.2,0.2",
            margin = "0.0",
            cencentrate = true,
            splines = "spline",
            rankdir = LR
                ];
            node[
                label = "\N",
                fontsize = 14,
                margin = "0.07,0.05",
                penwidth = 1.0,
                shape = record
            ];
            edge[
                dir = both,
                fontsize = 12,
                arrowsize = 0.9,
                penwidth = 1.0,
                labelangle = 32,
                labeldistance = 1.8
            ];`;
        }
    }

    export class Table {
        Name: string;
        Fields: Array<Field> = new Array<Field>();

        public constructor(init?: Partial<Table>) {
            Object.assign(this, init);
        }

        toDot(): string {
            let fieldHtml = '';
            let delimiter = '';
            if (this.Fields != null && this.Fields.length > 0) {
                fieldHtml = '<TABLE BORDER="0" ALIGN="LEFT" CELLPADDING ="0" CELLSPACING ="4" WIDTH ="134" >';
                this.Fields.forEach(element => {
                    fieldHtml += element.toDot();
                });
                fieldHtml += '</TABLE>';
                delimiter = '|';
            }

            return `\n${this.Name} [label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="0.5" WIDTH="134" ALIGN="CENTER">
            <TR>
                <TD ALIGN="CENTER" VALIGN="BOTTOM" WIDTH="134"><FONT POINT-SIZE="14" FACE="Arial bold"><B>${this.Name}</B></FONT></TD >
            </TR>
            </TABLE>${delimiter}${fieldHtml}>,fillcolor="#ececfc",style=filled];`;
        }
    }

    export class Field {
        Name: string;
        Type: string;
        Length: number;
        PrimaryKey: boolean;
        Nullable: boolean;
        Table: Table;

        toDot(): string {
            let name = this.Name;
            if (this.PrimaryKey) {
                name = `<B>${name}</B>`;
            }
            let lenStr = '';
            if (this.Length && this.Length > 0) {
                lenStr = `(${this.Length})`;
            }
            let nullable = '';
            if (!this.Nullable) {
                nullable = ' <B>NOT NULL</B>';
            }
            const parts = [`<FONT POINT-SIZE="12">${name}</FONT>`,
            `<FONT FACE="Arial Italic" POINT-SIZE="10" COLOR ="grey60">&nbsp;&nbsp;${this.Type}${lenStr}${nullable}</FONT>`];
            return `\n    <TR><TD ALIGN="LEFT">${parts[0]}${parts[1]}</TD></TR>`;
        }
    }

    export enum Cardinality {OneToOne, OneToMany, ManyToMany}

    export class Relationship {
        ToField: Field;
        FromField: Field;
        Cardinality: Cardinality;
        Identifying: boolean;
        Label: string;

        toDot(): string {
            let label = '';
            if (this.Label) {
                label = `\nlable=<<FONT>${this.Label}</FONT>>`;
            }
            let style = 'dotted';
            if (this.Identifying) {
                style = 'solid';
            }
            let cardStr = '';
            switch (this.Cardinality) {
                case Cardinality.OneToOne:
                    cardStr =
                    `[arrowhead=noneotee,headlabel=<<FONT>1</FONT>>,${label}style=${style},arrowtail=noneotee,taillabel=<<FONT>1</FONT>>]`;
                    break;
                case Cardinality.OneToMany:
                    cardStr =
                    `[arrowhead=noneotee,headlabel=<<FONT>1</FONT>>,${label}style=${style},arrowtail=ocrow,taillabel=<<FONT>0..N</FONT>>]`;
                    break;
                case Cardinality.ManyToMany:
                    cardStr =
                    `[arrowhead=ocrow,headlabel=<<FONT>0..N</FONT>>,${label}style=${style},arrowtail=ocrow,taillabel=<<FONT>1..1</FONT>>]`;
                    break;
            }
            return `\n${this.ToField.Table.Name} -- ${this.FromField.Table.Name} ${cardStr} ;`;
        }
    }

    export class DotGenerator {
        parse(input: string): Database {
            const result = new Database();
            const relationshipText = new Array<string>();
            let table;
            input.split('\n').forEach(s => {
                if (s && !s.startsWith('#') && s.trim().length > 0 && s.trim() !== ')') {
                    // relationship
                    if (s.indexOf(':') > -1) {
                        relationshipText.push(s);
                    } else {
                        // table
                        const tableName = this.determineTable(s);
                        if (table && !tableName) {
                            table.Fields.push(this.getField(s));
                        }
                        if (tableName) {
                            if (table) {
                                result.Tables.push(table);
                            }
                            table = new Table({Name: tableName});
                        }
                    }
                }
            });
            // tail
            if (table != null) {
                result.Tables.push(table);
            }

            relationshipText.forEach(s => {
                this.parseRelationShip(result, s);
            });

            return result;
        }

        parseRelationShip(db: Database, s: string): Relationship {
            const splits = s.split(' ');
            if (splits.length >= 3) {
                const rln = new Relationship();
                rln.FromField = this.findField(db, splits[0]);
                rln.ToField = this.findField(db, splits[2]);
                if (splits[1].indexOf('[') > -1) {
                    rln.Identifying = true;
                }
                const cardinality = splits[1].replace('[', '').replace(']', '');
                switch (cardinality) {
                    case '1:1':
                        rln.Cardinality = Cardinality.OneToOne;
                        break;
                    case '1:*':
                        rln.Cardinality = Cardinality.OneToMany;
                        break;
                    case '*:*':
                        rln.Cardinality = Cardinality.ManyToMany;
                        break;
                    default:
                        throw new Error(`Unknown Cardinality: '${cardinality}' (Options are 1:1, 1:*, *:*)`);
                }
                db.Relationships.push(rln);
            }
            return null;
        }

        findField(db: Database, s: string): Field {
            const splits = s.split('.');
            if (splits.length !== 2) {
                throw new Error(`Error around '${s}'`);
            }
            let table;
            let field;
            db.Tables.forEach(o => {
                if (o.Name.toUpperCase() === splits[0].toUpperCase()) {
                    table = o;
                }
            });
            if (!table) { throw new Error(`Relationship: Unable to find table '${s}'`); }
            table.Fields.forEach(o => {
                if (o.Name.toUpperCase() === splits[1].toUpperCase()) {
                    field = o;
                    field.Table = table;
                }
            });
            if (!field) { throw new Error(`Relationship: Unable to find field '${s}'`); }
            return field;
        }

        getField(input: string): Field {
            const fld = new Field();
            const splits = input.trim().replace(',', '').split(' ');

            if (splits.length === 0) {fld.Name = input; }
            if (splits.length > 0) { fld.Name = splits[0]; }
            if (splits.length > 1) {
                this.getTypeAndLength(fld, splits[1]);
            }
            fld.Nullable = !input.toUpperCase().replace(',', '').endsWith(' NOT NULL');

            return fld;
        }

        getTypeAndLength(fld: Field, chk: string) {
            if (chk.indexOf('(') > -1) {
                const lenSplit = chk.split('(');
                fld.Type = lenSplit[0];
                try {
                    fld.Length = parseInt(lenSplit[1].replace(')', ''), 10);
                } catch (err) {
                    fld.Type = `${lenSplit[0]}(${lenSplit[1]}`;
                }
            } else {
                fld.Type = chk;
            }

        }
        determineTable(input: string): string {
            if (input.indexOf('create table ') > -1) {
                const splits = input.split(' ');
                if (splits.length > 2) {
                    return splits[2];
                }
            }

            if (input.startsWith('[') && input.endsWith(']') && input.length > 2) {
                return input.substring(1, input.length - 1);
            }
            return null;
        }
    }
}

