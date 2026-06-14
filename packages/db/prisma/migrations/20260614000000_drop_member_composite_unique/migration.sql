-- One organization per user is enforced solely by the unique on `userId`; the
-- (organizationId, userId) composite unique is redundant and the only multi-org-leaning
-- artifact. Drop it — multi-org per user is intentionally not supported.
DROP INDEX "organization_members_organizationId_userId_key";
