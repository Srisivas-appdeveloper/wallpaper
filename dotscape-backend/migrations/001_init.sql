CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE admin_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('super_admin','admin','editor','ai_creator','moderator','analyst')),
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE devices (
  id                      TEXT PRIMARY KEY,
  brand                   TEXT NOT NULL,
  model                   TEXT NOT NULL,
  marketing_name          TEXT NOT NULL,
  model_codes             TEXT[] NOT NULL DEFAULT '{}',
  screen_width            INT NOT NULL,
  screen_height           INT NOT NULL,
  safe_top                NUMERIC(4,3) NOT NULL DEFAULT 0.100,
  safe_bottom             NUMERIC(4,3) NOT NULL DEFAULT 0.080,
  supports_live_wallpaper BOOLEAN NOT NULL DEFAULT TRUE,
  supports_glyph          BOOLEAN NOT NULL DEFAULT FALSE,
  glyph_type              TEXT,
  is_generic              BOOLEAN NOT NULL DEFAULT FALSE,
  active                  BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order              INT NOT NULL DEFAULT 0
);

CREATE TABLE categories (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE wallpapers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  status           TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','review','scheduled','published','unpublished','private')),
  source_type      TEXT NOT NULL CHECK (source_type IN ('upload','procedural','ai','user_generated')),
  category_id      TEXT REFERENCES categories(id) ON DELETE SET NULL,
  style            TEXT,
  mood             TEXT,
  colors           TEXT[] NOT NULL DEFAULT '{}',
  tags             TEXT[] NOT NULL DEFAULT '{}',
  dna              JSONB,
  parent_id        UUID REFERENCES wallpapers(id) ON DELETE SET NULL,
  thumbnail_key    TEXT NOT NULL,
  preview_key      TEXT NOT NULL,
  full_key         TEXT NOT NULL,
  width            INT NOT NULL,
  height           INT NOT NULL,
  is_amoled        BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured      BOOLEAN NOT NULL DEFAULT FALSE,
  is_editor_pick   BOOLEAN NOT NULL DEFAULT FALSE,
  owner_install_id UUID,
  created_by       UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  download_count   INT NOT NULL DEFAULT 0,
  apply_count      INT NOT NULL DEFAULT 0,
  view_count       INT NOT NULL DEFAULT 0,
  published_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX wallpapers_status_published_idx ON wallpapers (status, published_at DESC);
CREATE INDEX wallpapers_tags_idx   ON wallpapers USING GIN (tags);
CREATE INDEX wallpapers_colors_idx ON wallpapers USING GIN (colors);
CREATE INDEX wallpapers_owner_idx  ON wallpapers (owner_install_id) WHERE owner_install_id IS NOT NULL;

CREATE TABLE wallpaper_devices (
  wallpaper_id UUID NOT NULL REFERENCES wallpapers(id) ON DELETE CASCADE,
  device_id    TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  PRIMARY KEY (wallpaper_id, device_id)
);
CREATE INDEX wallpaper_devices_device_idx ON wallpaper_devices (device_id);

CREATE TABLE interaction_events (
  id           BIGSERIAL PRIMARY KEY,
  type         TEXT NOT NULL,
  wallpaper_id UUID REFERENCES wallpapers(id) ON DELETE CASCADE,
  install_id   UUID NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX interaction_events_type_idx    ON interaction_events (type, created_at);
CREATE INDEX interaction_events_install_idx ON interaction_events (install_id, created_at);

CREATE TABLE reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallpaper_id UUID NOT NULL REFERENCES wallpapers(id) ON DELETE CASCADE,
  install_id   UUID NOT NULL,
  reason       TEXT NOT NULL CHECK (reason IN ('copyright','inappropriate','low_quality','other')),
  details      TEXT NOT NULL DEFAULT '',
  status       TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','dismissed','actioned')),
  resolved_by  UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE generations (
  id                  UUID PRIMARY KEY,
  install_id          UUID,
  kind                TEXT NOT NULL CHECK (kind IN ('generate','remix','admin_batch')),
  source_wallpaper_id UUID REFERENCES wallpapers(id) ON DELETE SET NULL,
  wallpaper_id        UUID REFERENCES wallpapers(id) ON DELETE SET NULL,
  request             JSONB NOT NULL,
  provider            TEXT NOT NULL,
  status              TEXT NOT NULL CHECK (status IN ('processing','completed','failed')),
  error_message       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at        TIMESTAMPTZ
);
CREATE INDEX generations_install_idx ON generations (install_id, created_at);

CREATE TABLE admin_audit_logs (
  id         BIGSERIAL PRIMARY KEY,
  admin_id   UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  entity     TEXT NOT NULL,
  entity_id  TEXT,
  before     JSONB,
  after      JSONB,
  ip         TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE feature_flags (
  key         TEXT PRIMARY KEY,
  enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
