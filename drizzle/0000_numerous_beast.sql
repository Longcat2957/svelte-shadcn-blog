CREATE TABLE "category" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"parent_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comment" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"parent_id" integer,
	"author_name" text NOT NULL,
	"password" text,
	"is_secret" boolean DEFAULT false NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"content" text NOT NULL,
	"category_id" integer NOT NULL,
	"tags" text[] NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_parent_id_category_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_parent_id_comment_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "published_idx" ON "post" USING btree ("published");--> statement-breakpoint
CREATE INDEX "created_idx" ON "post" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "category_id_idx" ON "post" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "tags_idx" ON "post" USING gin ("tags");