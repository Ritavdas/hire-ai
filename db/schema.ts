import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { customType } from "drizzle-orm/pg-core";

const tsvector = customType<{ data: string }>({
	dataType() {
		return "tsvector";
	},
});

export const resumes = pgTable("resumes", {
	id: uuid("id")
		.default(sql`uuid_generate_v4()`)
		.notNull()
		.primaryKey(),
	name: text("name").notNull(),
	location: text("location"),
	rawText: text("raw_text").notNull(),
	tsv: tsvector("tsv"),
});
