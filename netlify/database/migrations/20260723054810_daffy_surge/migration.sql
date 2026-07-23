CREATE TABLE "bid_attribution" (
	"sale_specific_entity_id" text PRIMARY KEY,
	"influencer_handle" text NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_touch_at" timestamp with time zone DEFAULT now() NOT NULL,
	"committed_usd" double precision,
	"accepted_usd" double precision,
	"reconciled_at" timestamp with time zone,
	"status" text DEFAULT 'attributed' NOT NULL
);
--> statement-breakpoint
CREATE INDEX "bid_attribution_handle_idx" ON "bid_attribution" ("influencer_handle");