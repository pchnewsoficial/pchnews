import React from "react";

/**
 * EditorialDataBridge used to mirror the Supabase snapshot into browser
 * localStorage and bootstrap an empty database from local seed data.
 *
 * That behavior made browser state a competing CMS source of truth.
 * Production editorial content is now database-only, so this component is
 * intentionally inert and remains only for route/component compatibility.
 */
export default function EditorialDataBridge() {
  return null;
}
