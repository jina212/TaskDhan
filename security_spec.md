# Security Specification for TaskDhan

## Data Invariants
1. Users can only read their own profiles, except for admins.
2. Users can only update their own profiles for specific fields (coins, balance, streak, etc.), but NOT their role or ban status.
3. Tasks can only be created, updated, or deleted by admins.
4. Submissions must reference a valid task and include an accurate reward amount based on the multiplier.
5. Withdrawals must only be created if the user has sufficient balance.
6. Transactions must be immutable after creation.
7. Settings can only be updated by admins.
8. Banned users are denied all write operations.

## The Dirty Dozen Payloads (Rejection Expected)

1. **Identity Spoofing**: Attempt to create a user profile with a different UID.
2. **Privilege Escalation**: User tries to set their own `role` to 'admin'.
3. **Ghost Field Update**: User tries to update `isBanned` on their own profile.
4. **Illegal State Shortcut**: User tries to approve their own withdrawal.
5. **Resource Poisoning**: Large 1.5KB string as a task ID.
6. **Relational Sync Break**: Create a submission for a non-existent task.
7. **Negative Balance Hack**: Try to withdraw more money than currently in balance.
8. **Shadow Field Injection**: Adding `isVerified: true` to a submission.
9. **Time Warp**: Setting a future `submittedAt` timestamp.
10. **Immutable Field Break**: Updating `createdAt` on a user profile.
11. **Admin Key Leak**: Trying to update `/settings/global` as a normal user.
12. **Banned User Write**: A user with `isBanned: true` trying to claim a daily bonus.

## Test Runner (Logic Verification)
The `firestore.rules` will implement `isValidId()`, `isValidUser()`, `isValidTask()`, etc., and the Red Team Audit will verify these against the payloads.
