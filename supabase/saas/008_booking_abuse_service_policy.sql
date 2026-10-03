-- Make the service-only abuse table explicit to Security Advisor.
-- anon/authenticated retain zero privileges; Edge Functions use service_role.

drop policy if exists booking_abuse_events_service_role on public.booking_abuse_events;
create policy booking_abuse_events_service_role
on public.booking_abuse_events
for all
to service_role
using (true)
with check (true);
