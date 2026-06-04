-- Prevent duplicate player entries in the same session
ALTER TABLE session_entries
  ADD CONSTRAINT session_entries_session_player_unique
  UNIQUE (session_id, player_id);
