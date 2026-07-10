ALTER TABLE "story" ADD COLUMN "premium" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
-- Free-tier sampler (issue #34): one story per age band plus a spare stay free;
-- every other story is premium (the column default above). Keep this list in sync
-- with the `premium: false` flags in content/stories/*.ts.
UPDATE "story" SET "premium" = false WHERE "slug" IN (
	'starlight-sail',
	'bean-whispering-woods',
	'moon-goodnight-post',
	'owl-who-counted-stars'
);
