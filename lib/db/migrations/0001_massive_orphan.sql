CREATE TABLE "push_subscriptions" (
	"endpoint" text PRIMARY KEY NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"bid_limit_usd" double precision NOT NULL,
	"last_status" text DEFAULT 'winning' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
