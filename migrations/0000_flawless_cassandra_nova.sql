CREATE TYPE "public"."user_role" AS ENUM('vendor', 'recipient');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('draft', 'sent', 'submitted', 'approved', 'approved_adjusted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."credit_term" AS ENUM('net_10', 'net_20', 'net_30');--> statement-breakpoint
CREATE TYPE "public"."revenue_band" AS ENUM('under_1m', '1m_10m', '10m_100m', '100m_250m', '250m_500m', 'over_500m');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(40) NOT NULL,
	"subject" varchar(100) NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unit_amount" integer DEFAULT 10000 NOT NULL,
	"role" "user_role" DEFAULT 'vendor' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_name" varchar(255) NOT NULL,
	"template_path" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp with time zone,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "application_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "application_status" DEFAULT 'draft' NOT NULL,
	"company_name" varchar(255),
	"dba" varchar(255),
	"country" varchar(100),
	"website" varchar(500),
	"revenue_band" "revenue_band",
	"credit_amount_requested" integer,
	"credit_term_requested" "credit_term",
	"billing_contact_name" varchar(255),
	"billing_contact_email" varchar(255),
	"recipient_name" varchar(255),
	"recipient_email" varchar(255),
	"decision_amount" integer,
	"decision_term" "credit_term",
	"rejection_reason" text,
	"ai_summary" text,
	"vendor_id" uuid,
	"meta" jsonb DEFAULT '{}'::jsonb,
	"sent_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trade_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"business_name" varchar(255) NOT NULL,
	"engagement_start" timestamp with time zone,
	"engagement_end" timestamp with time zone,
	"contact_name" varchar(255),
	"contact_email" varchar(255),
	"contact_position" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_tokens" ADD CONSTRAINT "application_tokens_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_references" ADD CONSTRAINT "trade_references_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_email_templates_event_name" ON "email_templates" USING btree ("event_name");