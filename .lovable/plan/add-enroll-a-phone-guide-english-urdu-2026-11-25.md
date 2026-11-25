# Add "Enroll a phone" guide (English + Urdu)

## What you'll get
A new **Enroll a phone** page in the dashboard sidebar with numbered steps, switching to Urdu (right-to-left) with the existing language toggle.

## Sections
1. **Before you start** – new or factory-reset phone, no Google account added, Wi-Fi ready, customer agreement signed and consent given.
2. **Create the contract** – add customer, then the device, and open its enrollment QR from the Devices page.
3. **Scan the QR** – on the welcome screen tap 6 times, connect Wi-Fi, scan QR, wait for Lockbizz to install as device manager.
4. **Confirm it worked** – device shows "checked in" on the Devices page; test lock/unlock once.
5. **If the client factory-resets the phone** – Google account protection blocks re-setup; watch "last check-in"; contact the customer; re-enroll after recovery.
6. **Releasing the phone** – final payment releases it automatically; how to confirm.
7. **Rules to remember** – calls and emergency dialer always work; location only with consent.

A "How to enroll" link is also added next to the QR button on the Devices page.

## Technical details
- New route `src/routes/_authenticated/enroll-guide.tsx` with its own head() metadata.
- Add sidebar entry in `_authenticated/route.tsx`; strings added to `src/lib/i18n.tsx` (en + ur).
- Presentation only; no database changes.
