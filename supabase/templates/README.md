# NANTI authentication emails

Prepared for production project `qyfywekaorkwpzrvbrth`. These files do not automatically update hosted Supabase settings.

In Authentication > Emails, paste each HTML file into its matching template and use the subject from subjects.json. `confirmation` = Confirm sign up; `invite` = Invite user; `magic_link` = Magic link or OTP; `email_change` = Change email address; `recovery` = Reset password; `reauthentication` = Reauthentication.

Keep Supabase's ConfirmationURL and Token placeholders intact. Magic-link copy uses a link because the app currently has no OTP entry form. Reauthentication uses the OTP token. No fixed expiration is promised; expiration follows the project settings.

Requested setting: Authentication > Sign In / Providers > Email > Confirm email OFF. This lets new email/password accounts sign in without proving ownership of their email. Keep secure email-change and recovery checks enabled. Confirmation template stays ready if signup confirmation is re-enabled.

Status: prepared, not applied to hosted Auth settings. Verify this status in the dashboard before release. Test each enabled email with a test account after applying, including redirect destinations and password recovery.
