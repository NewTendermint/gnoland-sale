CREATE TABLE "cron_leases" (
	"name" text PRIMARY KEY,
	"leased_until" timestamp with time zone NOT NULL
);
