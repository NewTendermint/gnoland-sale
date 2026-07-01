CREATE TABLE "pkce_states" (
	"state" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"code_verifier" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "pkce_states_expires_at_idx" ON "pkce_states" USING btree ("expires_at");