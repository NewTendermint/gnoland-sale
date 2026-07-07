CREATE TABLE "price_email_state" (
	"id" smallint PRIMARY KEY,
	"last_sent_price_usd" double precision NOT NULL,
	"last_sent_at" timestamp with time zone
);
