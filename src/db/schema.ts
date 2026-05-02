import {
    pgTable,
    bigint,
    varchar,
    timestamp,
    boolean,
    integer,
    serial,
    pgEnum,
    text,
    primaryKey,
    char,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --------------------------------------------------------------------------
// Enums
// --------------------------------------------------------------------------

export const scheduleTypeEnum = pgEnum("schedule_type", ["interval", "cron"]);

// --------------------------------------------------------------------------
// Tables
// --------------------------------------------------------------------------

export const guilds = pgTable("guilds", {
    guildId: bigint("guild_id", { mode: "bigint" }).primaryKey(),
    guildName: varchar("guild_name", { length: 100 }).notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    isActive: boolean("is_active").notNull().default(true),
    isDeleted: boolean("is_deleted").notNull().default(false)
});

export const guildConfigs = pgTable("guild_configs", {
    configId: serial("config_id").primaryKey(),
    guildId: bigint("guild_id", { mode: "bigint" })
        .notNull()
        .unique()
        .references(() => guilds.guildId, { onDelete: "cascade" }),
    activeSlotCount: integer("active_slot_count").notNull().default(8),
    timezone: varchar("timezone", { length: 64 }).notNull().default("UTC"),
});

export const reshuffleSchedules = pgTable("reshuffle_schedules", {
    scheduleId: serial("schedule_id").primaryKey(),
    configId: integer("config_id")
        .notNull()
        .references(() => guildConfigs.configId, { onDelete: "cascade" }),
    scheduleType: scheduleTypeEnum("schedule_type").notNull(),
    // Populated when scheduleType = 'interval'
    intervalMinutes: integer("interval_minutes"),
    // Populated when scheduleType = 'cron' (standard 5-field cron expression)
    cronExpression: varchar("cron_expression", { length: 100 }),
    lastReshuffledAt: timestamp("last_reshuffled_at", { withTimezone: true }),
    nextReshuffle: timestamp("next_reshuffle_at", { withTimezone: true }),
    isEnabled: boolean("is_enabled").notNull().default(true),
});

export const users = pgTable("users", {
    // Discord snowflake as the PK — no surrogate key needed
    userId: bigint("user_id", { mode: "bigint" }).primaryKey(),
    username: varchar("username", { length: 100 }).notNull(),
    // OAuth tokens for Discord login
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
});

// Junction table — tracks which users are members of which guilds
export const guildMembers = pgTable("guild_members", {
    guildId: bigint("guild_id", { mode: "bigint" })
        .notNull()
        .references(() => guilds.guildId, { onDelete: "cascade" }),
    userId: bigint("user_id", { mode: "bigint" })
        .notNull()
        .references(() => users.userId, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
    pk: primaryKey({ columns: [t.guildId, t.userId] }),
}));

export const sounds = pgTable("sounds", {
    soundId: serial("sound_id").primaryKey(),
    guildId: bigint("guild_id", { mode: "bigint" })
        .notNull()
        .references(() => guilds.guildId, { onDelete: "cascade" }),
    uploadedBy: bigint("uploaded_by", { mode: "bigint" })
        .references(() => users.userId, { onDelete: "set null" }),
    name: varchar("name", { length: 100 }).notNull(),
    emoji: varchar("emoji", { length: 4 }).notNull(),
    file: text("file_url").notNull(),
    playCount: integer("play_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastPlayedAt: timestamp("last_played_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull(),
    isDeleted: boolean("is_deleted").notNull().default(false),
});

export const activeSlotHistory = pgTable("active_slot_history", {
    historyId: serial("history_id").primaryKey(),
    guildId: bigint("guild_id", { mode: "bigint" })
        .notNull()
        .references(() => guilds.guildId, { onDelete: "cascade" }),
    soundId: integer("sound_id")
        .notNull()
        .references(() => sounds.soundId, { onDelete: "cascade" }),
    activatedAt: timestamp("activated_at", { withTimezone: true }).notNull().defaultNow(),
    // NULL means this sound is currently active in this slot
    deactivatedAt: timestamp("deactivated_at", { withTimezone: true }),
});

// --------------------------------------------------------------------------
// Relations
// --------------------------------------------------------------------------

export const usersRelations = relations(users, ({ many }) => ({
    guildMembers: many(guildMembers),
    uploadedSounds: many(sounds),
}));

export const guildMembersRelations = relations(guildMembers, ({ one }) => ({
    guild: one(guilds, {
        fields: [guildMembers.guildId],
        references: [guilds.guildId],
    }),
    user: one(users, {
        fields: [guildMembers.userId],
        references: [users.userId],
    }),
}));

export const guildsRelations = relations(guilds, ({ one, many }) => ({
    config: one(guildConfigs, {
        fields: [guilds.guildId],
        references: [guildConfigs.guildId],
    }),
    sounds: many(sounds),
    activeSlotHistory: many(activeSlotHistory),
    members: many(guildMembers),
}));

export const guildConfigsRelations = relations(guildConfigs, ({ one, many }) => ({
    guild: one(guilds, {
        fields: [guildConfigs.guildId],
        references: [guilds.guildId],
    }),
    reshuffleSchedules: many(reshuffleSchedules),
}));

export const reshuffleSchedulesRelations = relations(reshuffleSchedules, ({ one }) => ({
    config: one(guildConfigs, {
        fields: [reshuffleSchedules.configId],
        references: [guildConfigs.configId],
    }),
}));

export const soundsRelations = relations(sounds, ({ one, many }) => ({
    guild: one(guilds, {
        fields: [sounds.guildId],
        references: [guilds.guildId],
    }),
    uploadedBy: one(users, {
        fields: [sounds.uploadedBy],
        references: [users.userId],
    }),
    activeSlotHistory: many(activeSlotHistory),
}));

export const activeSlotHistoryRelations = relations(activeSlotHistory, ({ one }) => ({
    guild: one(guilds, {
        fields: [activeSlotHistory.guildId],
        references: [guilds.guildId],
    }),
    sound: one(sounds, {
        fields: [activeSlotHistory.soundId],
        references: [sounds.soundId],
    }),
}));

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type GuildMember = typeof guildMembers.$inferSelect;
export type NewGuildMember = typeof guildMembers.$inferInsert;

export type Guild = typeof guilds.$inferSelect;
export type NewGuild = typeof guilds.$inferInsert;

export type GuildConfig = typeof guildConfigs.$inferSelect;
export type NewGuildConfig = typeof guildConfigs.$inferInsert;

export type ReshuflleSchedule = typeof reshuffleSchedules.$inferSelect;
export type NewReshuflleSchedule = typeof reshuffleSchedules.$inferInsert;

export type Sound = typeof sounds.$inferSelect;
export type NewSound = typeof sounds.$inferInsert;

export type ActiveSlotHistory = typeof activeSlotHistory.$inferSelect;
export type NewActiveSlotHistory = typeof activeSlotHistory.$inferInsert;