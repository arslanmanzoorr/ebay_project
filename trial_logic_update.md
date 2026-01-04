# Trial Logic Update - Manual Submission Flow

## implemented Changes

### 1. Activation Flow (`api/auth/activate.ts`)
- **Credits**: Trial users now strictly receive **3 credits** (updated from dynamic/fallback logic).
- **Auto-Fetch Disabled**: The automatic trigger to n8n (AI processing) has been removed.
- **Item Stub**: The system still creates an auction item entry ("stub") with the `hibid_url` and `hibid_title` to "lock" the user to their claimed auction. This item appears with `status: 'research'` and notes indicating "Claimed via Activation - Pending Processing".

### 2. Dashboard Experience (`app/admin/page.tsx`)
- **Unlocked Features**:
  - "Submit URLs" button is now **enabled** for trial users.
  - "Add Manual Item" button is now **enabled** for trial users.
  - URL input field is now **enabled**.
- **URL Pre-fill**:
  - When the dashboard loads, it checks for any "pending claimed items" (stubs created during activation).
  - If found, the **URL input is automatically pre-filled** with the claimed auction's URL.
  - A toast notification informs the user: "Your claimed auction URL is ready. Click 'Submit URLs' to process it."

## Verification Steps

1.  **Register a New User**: Use the onboarding app to claim a county/auction.
2.  **Activate Account**: Click the email link.
    *   Verify you receive **3 credits**.
    *   Verify you are redirected to login.
3.  **Login to Dashboard**:
    *   **Check Input**: The "Enter Auction URL" field should be pre-filled with your claimed URL.
    *   **Check List**: You might see a "Claimed Item" in the list below (the stub).
    *   **Action**: Click **"Submit URLs"**.
    *   **Result**: The system should process the URL (via n8n) and eventually update/create the item with full data.
4.  **Manual Creation**:
    *   Try clicking "Add Manual Item". It should open the modal (previously blocked).

## Note on Duplicates
Since the "stub" item is created during activation, and "Submit URLs" creates a processed item, you might see two entries initially or the system might update the existing one depending on the exact `hibid_url` matching logic in the webhook handler. This is expected behavior for this "soft lock" implementation.
