# athletic-flow-saas

## Environment

Add these values to `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
STRIPE_SECRET_KEY=sk_test_...
```

`NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_URL` should be the project URL without `/rest/v1/`. Keep the service-role and Stripe secret keys server-only.

For Twilio SMS alerts, also set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER`.

## Local workflow

1. Apply `supabase/schema.sql` in the Supabase SQL editor. The `alter table ... if not exists` statements update an existing database with result and Stripe fields.
2. Start the app with `npm run dev`.
3. Open `/dashboard/meets/<meet-id>`, select an event, and open its scorekeeper link. Choose a heat, enter times such as `54.12`, and save official results. Places update as times are entered.
4. Open `/dashboard/meets/<meet-id>/print` for a heat sheet or add `?view=results` for result sheets. Use **Print / Save PDF** and choose **Save as PDF** in the browser dialog.
5. Open `/dashboard/meets/<meet-id>/summary` after scoring to calculate PRs, event winners, and team points, then generate the press release.
6. Choose the **$34.99 single meet license** or **$299.99 annual unlimited pass** from the meet dashboard. Use Stripe test mode, complete Checkout, then return and select **Publish portal**. The public portal is `/portal/<meet-id>`.

Stripe Checkout uses the success redirect for local testing. Production should also add a Stripe webhook to handle delayed or out-of-band payment events.

For the local webhook, install the Stripe CLI, run `stripe login`, then start forwarding events with `stripe listen --forward-to localhost:3000/api/stripe/webhook`. Put the `whsec_...` value printed by the CLI in `STRIPE_WEBHOOK_SECRET`, restart Next.js, and use Stripe test card `4242 4242 4242 4242` with any future expiry and CVC.